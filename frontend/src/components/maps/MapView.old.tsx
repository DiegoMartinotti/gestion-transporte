import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Paper, Stack, Text, Loader, Alert, Group, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconMap,
  IconCurrentLocation,
  IconRefresh,
  IconMaximize,
  IconMinimize,
} from '@tabler/icons-react';
import {
  useGoogleMapsLoader,
  useCurrentLocation,
  type GoogleMap,
  type GoogleMarker,
  type GoogleInfoWindow,
  type GoogleMapEvent,
} from './MapViewHelpers';

// Componentes de estado
const LoadingView = ({
  height,
  width,
  className,
  style,
}: {
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Paper h={height} w={width} withBorder className={className} style={style}>
    <Stack align="center" justify="center" h="100%">
      <Loader size="lg" />
      <Text c="dimmed">Cargando mapa...</Text>
    </Stack>
  </Paper>
);

const ErrorView = ({
  height,
  width,
  className,
  style,
  error,
}: {
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
  error: string;
}) => (
  <Paper h={height} w={width} withBorder className={className} style={style}>
    <Stack align="center" justify="center" h="100%" p="md">
      <Alert color="red" title="Error en el mapa">
        {error}
      </Alert>
    </Stack>
  </Paper>
);

const NotLoadedView = ({
  height,
  width,
  className,
  style,
}: {
  height: number;
  width: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <Paper h={height} w={width} withBorder className={className} style={style}>
    <Stack align="center" justify="center" h="100%">
      <IconMap size={48} color="gray" />
      <Text c="dimmed">Cargando Google Maps...</Text>
    </Stack>
  </Paper>
);

// Componente de controles
const MapControls = ({
  showControls,
  showCurrentLocation,
  markers,
  isFullscreen,
  onCurrentLocation,
  onFitToMarkers,
  onToggleFullscreen,
}: {
  showControls: boolean;
  showCurrentLocation: boolean;
  markers: MapMarker[];
  isFullscreen: boolean;
  onCurrentLocation: () => void;
  onFitToMarkers: () => void;
  onToggleFullscreen: () => void;
}) => {
  if (!showControls) return null;

  return (
    <Paper pos="absolute" top={10} right={10} p="xs" style={{ zIndex: 1000 }} shadow="sm">
      <Group gap="xs">
        {showCurrentLocation && (
          <Tooltip label="Mi ubicación">
            <ActionIcon variant="light" color="blue" onClick={onCurrentLocation}>
              <IconCurrentLocation size={16} />
            </ActionIcon>
          </Tooltip>
        )}

        {markers.length > 0 && (
          <Tooltip label="Ajustar a marcadores">
            <ActionIcon variant="light" color="green" onClick={onFitToMarkers}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        )}

        <Tooltip label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          <ActionIcon variant="light" color="gray" onClick={onToggleFullscreen}>
            {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
};

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
    google: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => GoogleMap;
        Marker: new (options: unknown) => GoogleMarker;
        InfoWindow: new () => GoogleInfoWindow;
        LatLngBounds: new () => { extend: (pos: { lat: number; lng: number }) => void };
        Size: new (width: number, height: number) => { width: number; height: number };
        MapTypeId: {
          ROADMAP: string;
          SATELLITE: string;
          HYBRID: string;
          TERRAIN: string;
        };
        TravelMode: Record<string, string>;
      };
    };
  }
}

// Helper para crear marcadores
const createMapMarkers = (
  map: GoogleMap,
  markers: MapMarker[],
  infoWindow: GoogleInfoWindow,
  onMarkerClick?: (marker: MapMarker) => void
): GoogleMarker[] => {
  const newMarkers: GoogleMarker[] = [];

  markers.forEach((markerData) => {
    try {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title || '',
        icon: markerData.icon
          ? { url: markerData.icon, scaledSize: new window.google.maps.Size(24, 24) }
          : undefined,
        clickable: markerData.clickable !== false,
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

  return newMarkers;
};

// Helper para ajustar vista a marcadores
const fitMarkersToMap = (map: GoogleMap, markers: MapMarker[]) => {
  if (!map || markers.length === 0) return;

  const bounds = new window.google.maps.LatLngBounds();
  markers.forEach((marker) => {
    bounds.extend(marker.position);
  });

  if (markers.length === 1) {
    map.setCenter(markers[0].position);
    map.setZoom(15);
  } else {
    map.fitBounds(bounds);
  }
};

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
  style,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [mapMarkers, setMapMarkers] = useState<GoogleMarker[]>([]);
  const [infoWindow, setInfoWindow] = useState<GoogleInfoWindow | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { mapLoaded, mapError } = useGoogleMapsLoader();
  const { getCurrentLocation } = useCurrentLocation(map);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map || disabled) return;

    const mapOptions = {
      zoom,
      center,
      mapTypeId: (window as any).google.maps.MapTypeId[mapTypeId.toUpperCase()],
      zoomControl: showControls,
      mapTypeControl: showControls,
      scaleControl: showControls,
      streetViewControl: showControls,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: disabled ? 'none' : 'auto',
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    const newInfoWindow = new window.google.maps.InfoWindow();

    if (onMapClick) {
      newMap.addListener('click', (event: GoogleMapEvent) => {
        onMapClick({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });
    }

    setMap(newMap);
    setInfoWindow(newInfoWindow);
  }, [mapLoaded, disabled, zoom, center, mapTypeId, showControls, onMapClick, map]);

  useEffect(() => {
    if (!map || !window.google || !infoWindow) return;
    mapMarkers.forEach((marker) => marker.setMap(null));
    const newMarkers = createMapMarkers(map, markers, infoWindow, onMarkerClick);
    setMapMarkers(newMarkers);
    if (center) map.setCenter(center);
    if (zoom) map.setZoom(zoom);
  }, [map, markers, infoWindow, onMarkerClick, mapMarkers, center, zoom]);

  const fitToMarkers = useCallback(() => {
    if (map) fitMarkersToMap(map, markers);
  }, [map, markers]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (loading)
    return <LoadingView height={height} width={width} className={className} style={style} />;
  if (error || mapError)
    return (
      <ErrorView
        height={height}
        width={width}
        className={className}
        style={style}
        error={error || mapError}
      />
    );
  if (!mapLoaded)
    return <NotLoadedView height={height} width={width} className={className} style={style} />;

  const containerStyle = {
    ...style,
    ...(isFullscreen && { position: 'fixed' as const, top: 0, left: 0, zIndex: 9999 }),
  };

  const mapStyle = {
    width: '100%',
    height: '100%',
    borderRadius: isFullscreen ? 0 : 8,
  };

  return (
    <Box
      pos="relative"
      h={isFullscreen ? '100vh' : height}
      w={isFullscreen ? '100vw' : width}
      className={className}
      style={containerStyle}
    >
      <MapControls
        showControls={showControls}
        showCurrentLocation={showCurrentLocation}
        markers={markers}
        isFullscreen={isFullscreen}
        onCurrentLocation={getCurrentLocation}
        onFitToMarkers={fitToMarkers}
        onToggleFullscreen={toggleFullscreen}
      />

      <div ref={mapRef} style={mapStyle} />
    </Box>
  );
}

// Hook personalizado para usar el mapa
export const useMapView = () => {
  const [mapInstance, setMapInstance] = useState<GoogleMap | null>(null);

  const addMarker = useCallback(
    (marker: MapMarker) => {
      if (!mapInstance) return null;

      return new window.google.maps.Marker({
        position: marker.position,
        map: mapInstance,
        title: marker.title || '',
        icon: marker.icon
          ? { url: marker.icon, scaledSize: new window.google.maps.Size(24, 24) }
          : undefined,
        clickable: marker.clickable !== false,
      });
    },
    [mapInstance]
  );

  const removeMarker = useCallback((marker: GoogleMarker | null) => {
    if (marker) {
      marker.setMap(null);
    }
  }, []);

  const setCenter = useCallback(
    (position: { lat: number; lng: number }) => {
      if (mapInstance) {
        mapInstance.setCenter(position);
      }
    },
    [mapInstance]
  );

  const setZoom = useCallback(
    (zoom: number) => {
      if (mapInstance) {
        mapInstance.setZoom(zoom);
      }
    },
    [mapInstance]
  );

  return {
    mapInstance,
    setMapInstance,
    addMarker,
    removeMarker,
    setCenter,
    setZoom,
  };
};
