import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  Text,
  Loader,
  Alert,
  Group,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconMap,
  IconCurrentLocation,
  IconRefresh,
  IconMaximize,
  IconMinimize
} from '@tabler/icons-react';

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  icon?: string;
  content?: string;
  clickable?: boolean;
  onClick?: (marker: MapMarker) => void;
}

interface MapViewProps {
  height?: number;
  width?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  showCurrentLocation?: boolean;
  showControls?: boolean;
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapView({
  height = 400,
  width = '100%',
  center = { lat: -34.6037, lng: -58.3816 }, // Buenos Aires por defecto
  zoom = 10,
  markers = [],
  onMapClick,
  onMarkerClick,
  showCurrentLocation = true,
  showControls = true,
  mapTypeId = 'roadmap',
  disabled = false,
  loading = false,
  error,
  className,
  style
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<any>(null);

  // Cargar Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            setMapLoaded(true);
            clearInterval(checkGoogle);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setMapError('Error al cargar Google Maps');
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map || disabled) return;

    try {
      const mapOptions = {
        zoom,
        center,
        mapTypeId: window.google.maps.MapTypeId[mapTypeId.toUpperCase()],
        zoomControl: showControls,
        mapTypeControl: showControls,
        scaleControl: showControls,
        streetViewControl: showControls,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: disabled ? 'none' : 'auto'
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      const newInfoWindow = new window.google.maps.InfoWindow();

      // Click listener
      if (onMapClick) {
        newMap.addListener('click', (event: any) => {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        });
      }

      setMap(newMap);
      setInfoWindow(newInfoWindow);
    } catch (error) {
      setMapError('Error al inicializar el mapa');
    }
  }, [mapLoaded, center, zoom, mapTypeId, showControls, onMapClick, disabled, map]);

  // Actualizar marcadores
  useEffect(() => {
    if (!map || !window.google) return;

    // Limpiar marcadores existentes
    mapMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers: any[] = [];

    markers.forEach((markerData) => {
      try {
        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map,
          title: markerData.title || '',
          icon: markerData.icon || undefined,
          clickable: markerData.clickable !== false
        });

        if (markerData.content || markerData.onClick) {
          marker.addListener('click', () => {
            if (markerData.content) {
              infoWindow.setContent(markerData.content);
              infoWindow.open(map, marker);
            }
            
            if (markerData.onClick) {
              markerData.onClick(markerData);
            }
            
            if (onMarkerClick) {
              onMarkerClick(markerData);
            }
          });
        }

        newMarkers.push(marker);
      } catch (error) {
        console.error('Error creando marcador:', error);
      }
    });

    setMapMarkers(newMarkers);
  }, [map, markers, infoWindow, onMarkerClick]);

  // Centrar mapa cuando cambia el centro
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Cambiar zoom
  useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  // Función para obtener ubicación actual
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) {
      setMapError('Geolocalización no disponible');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        map.setCenter(pos);
        map.setZoom(15);

        // Agregar marcador de ubicación actual
        if (currentLocationMarker) {
          currentLocationMarker.setMap(null);
        }

        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: 'Tu ubicación actual',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24)
          }
        });

        setCurrentLocationMarker(marker);
        setMapError('');
      },
      (error) => {
        let message = 'Error obteniendo ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado';
            break;
        }
        setMapError(message);
      }
    );
  }, [map, currentLocationMarker]);

  // Función para ajustar vista a marcadores
  const fitToMarkers = useCallback(() => {
    if (!map || markers.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach(marker => {
      bounds.extend(marker.position);
    });

    if (markers.length === 1) {
      map.setCenter(markers[0].position);
      map.setZoom(15);
    } else {
      map.fitBounds(bounds);
    }
  }, [map, markers]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (loading) {
    return (
      <Paper h={height} w={width} withBorder className={className} style={style}>
        <Stack align="center" justify="center" h="100%">
          <Loader size="lg" />
          <Text c="dimmed">Cargando mapa...</Text>
        </Stack>
      </Paper>
    );
  }

  if (error || mapError) {
    return (
      <Paper h={height} w={width} withBorder className={className} style={style}>
        <Stack align="center" justify="center" h="100%" p="md">
          <Alert color="red" title="Error en el mapa">
            {error || mapError}
          </Alert>
        </Stack>
      </Paper>
    );
  }

  if (!mapLoaded) {
    return (
      <Paper h={height} w={width} withBorder className={className} style={style}>
        <Stack align="center" justify="center" h="100%">
          <IconMap size={48} color="gray" />
          <Text c="dimmed">Cargando Google Maps...</Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box
      pos="relative"
      h={isFullscreen ? '100vh' : height}
      w={isFullscreen ? '100vw' : width}
      className={className}
      style={{
        ...style,
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999
        })
      }}
    >
      {/* Controles del mapa */}
      {showControls && (
        <Paper
          pos="absolute"
          top={10}
          right={10}
          p="xs"
          style={{ zIndex: 1000 }}
          shadow="sm"
        >
          <Group gap="xs">
            {showCurrentLocation && (
              <Tooltip label="Mi ubicación">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={getCurrentLocation}
                >
                  <IconCurrentLocation size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {markers.length > 0 && (
              <Tooltip label="Ajustar a marcadores">
                <ActionIcon
                  variant="light"
                  color="green"
                  onClick={fitToMarkers}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            <Tooltip label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
              <ActionIcon
                variant="light"
                color="gray"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>
      )}

      {/* Mapa */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: isFullscreen ? 0 : 8
        }}
      />
    </Box>
  );
}

// Hook personalizado para usar el mapa
export const useMapView = () => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  const addMarker = useCallback((marker: MapMarker) => {
    if (!mapInstance) return null;
    
    const googleMarker = new window.google.maps.Marker({
      position: marker.position,
      map: mapInstance,
      title: marker.title || '',
      icon: marker.icon || undefined
    });
    
    return googleMarker;
  }, [mapInstance]);
  
  const removeMarker = useCallback((marker: any) => {
    if (marker) {
      marker.setMap(null);
    }
  }, []);
  
  const setCenter = useCallback((position: { lat: number; lng: number }) => {
    if (mapInstance) {
      mapInstance.setCenter(position);
    }
  }, [mapInstance]);
  
  const setZoom = useCallback((zoom: number) => {
    if (mapInstance) {
      mapInstance.setZoom(zoom);
    }
  }, [mapInstance]);
  
  return {
    mapInstance,
    setMapInstance,
    addMarker,
    removeMarker,
    setCenter,
    setZoom
  };
};