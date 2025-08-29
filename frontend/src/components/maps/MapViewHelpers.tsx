import { useState, useEffect, useCallback } from 'react';

export interface GoogleMap {
  setCenter: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  addListener: (event: string, handler: (event: GoogleMapEvent) => void) => void;
  fitBounds: (bounds: GoogleLatLngBounds) => void;
}

export interface GoogleMapEvent {
  latLng: {
    lat: () => number;
    lng: () => number;
  };
}

export interface GoogleMarker {
  setMap: (map: GoogleMap | null) => void;
  addListener: (event: string, handler: () => void) => void;
  getPosition: () => { lat: () => number; lng: () => number };
}

export interface GoogleInfoWindow {
  setContent: (content: string) => void;
  open: (map: GoogleMap, marker: GoogleMarker) => void;
}

export interface GoogleLatLngBounds {
  extend: (position: { lat: number; lng: number }) => void;
}

// Función helper para cargar Google Maps
export const loadGoogleMaps = (onLoad: () => void, onError: (message: string) => void) => {
  if (window.google?.maps) {
    onLoad();
    return;
  }

  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    const checkGoogle = setInterval(() => {
      if (window.google?.maps) {
        onLoad();
        clearInterval(checkGoogle);
      }
    }, 100);
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}&libraries=geometry`;
  script.async = true;
  script.defer = true;
  script.onload = onLoad;
  script.onerror = () => onError('Error al cargar Google Maps');
  document.head.appendChild(script);
};

// Helper para crear el icono de ubicación actual
export const createCurrentLocationIcon = () => {
  const svgIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `;
  
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
    scaledSize: new window.google.maps.Size(24, 24)
  };
};

// Hook para manejar la carga de Google Maps
export const useGoogleMapsLoader = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');

  useEffect(() => {
    loadGoogleMaps(
      () => setMapLoaded(true),
      (error) => setMapError(error)
    );
  }, []);

  return { mapLoaded, mapError };
};

// Hook para manejar ubicación actual
export const useCurrentLocation = (map: GoogleMap | null) => {
  const [currentLocationMarker, setCurrentLocationMarker] = useState<GoogleMarker | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) {
      return { success: false, error: 'Geolocalización no disponible' };
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        map.setCenter(pos);
        map.setZoom(15);

        // Limpiar marcador anterior
        if (currentLocationMarker) {
          currentLocationMarker.setMap(null);
        }

        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: 'Tu ubicación actual',
          icon: createCurrentLocationIcon(),
          clickable: false
        });

        setCurrentLocationMarker(marker);
        setGettingLocation(false);
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
        setGettingLocation(false);
        return { success: false, error: message };
      }
    );

    return { success: true, error: null };
  }, [map, currentLocationMarker]);

  return { getCurrentLocation, gettingLocation, currentLocationMarker };
};

// Helper para crear marcadores
const createMapMarkers = (
  map: GoogleMap,
  markers: any[],
  infoWindow: GoogleInfoWindow,
  onMarkerClick?: (marker: any) => void
): GoogleMarker[] => {
  const newMarkers: GoogleMarker[] = [];

  markers.forEach((markerData) => {
    try {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title || '',
        icon: markerData.icon ? { url: markerData.icon, scaledSize: new window.google.maps.Size(24, 24) } : undefined,
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

  return newMarkers;
};

// Hook principal para manejar toda la lógica del mapa
export const useMapLogic = ({
  mapLoaded,
  disabled,
  markers,
  center,
  zoom,
  mapTypeId,
  showControls,
  onMapClick,
  onMarkerClick
}: {
  mapLoaded: boolean;
  disabled: boolean;
  markers: any[];
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId: string;
  showControls: boolean;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onMarkerClick?: (marker: any) => void;
}) => {
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [mapMarkers, setMapMarkers] = useState<GoogleMarker[]>([]);
  const [infoWindow, setInfoWindow] = useState<GoogleInfoWindow | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { getCurrentLocation } = useCurrentLocation(map);

  // Inicializar mapa
  const initializeMap = useCallback((mapRef: HTMLDivElement) => {
    if (!mapLoaded || map || disabled) return;

    try {
      const newMap = new window.google.maps.Map(mapRef, {
        zoom,
        center,
        mapTypeId: window.google.maps.MapTypeId[mapTypeId.toUpperCase() as keyof typeof window.google.maps.MapTypeId],
        zoomControl: showControls,
        mapTypeControl: showControls,
        scaleControl: showControls,
        streetViewControl: showControls,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: disabled ? 'none' : 'auto'
      });

      const newInfoWindow = new window.google.maps.InfoWindow();

      if (onMapClick) {
        newMap.addListener('click', (event: GoogleMapEvent) => {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        });
      }

      setMap(newMap);
      setInfoWindow(newInfoWindow);
    } catch {
      // Error will be handled by parent component
    }
  }, [mapLoaded, center, zoom, mapTypeId, showControls, onMapClick, disabled, map]);

  // Actualizar marcadores
  useEffect(() => {
    if (!map || !window.google || !infoWindow) return;

    // Limpiar marcadores existentes
    mapMarkers.forEach(marker => marker.setMap(null));
    
    const newMarkers = createMapMarkers(map, markers, infoWindow, onMarkerClick);
    setMapMarkers(newMarkers);
  }, [map, markers, infoWindow, onMarkerClick, mapMarkers]);

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

  const fitToMarkers = useCallback(() => {
    if (!map || markers.length === 0) return;

    if (markers.length === 1) {
      map.setCenter(markers[0].position);
      map.setZoom(15);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => bounds.extend(marker.position));
      map.fitBounds(bounds);
    }
  }, [map, markers]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  return {
    map,
    isFullscreen,
    initializeMap,
    getCurrentLocation,
    fitToMarkers,
    toggleFullscreen
  };
};