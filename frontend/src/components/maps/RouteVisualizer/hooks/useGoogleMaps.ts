import { useState, useEffect, useRef } from 'react';
import { GoogleMap, GoogleDirectionsService, GoogleDirectionsRenderer } from '../types';

export const useGoogleMaps = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GoogleMap | null>(null);
  const [directionsService, setDirectionsService] = useState<GoogleDirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<GoogleDirectionsRenderer | null>(
    null
  );
  const [alternativeRenderers, setAlternativeRenderers] = useState<GoogleDirectionsRenderer[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Cargar Google Maps
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
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa y servicios
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: -34.6037, lng: -58.3816 },
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    }) as GoogleMap;

    const newDirectionsService =
      new window.google.maps.DirectionsService() as GoogleDirectionsService;
    const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
      draggable: true,
      map: newMap,
      panel: null,
    }) as GoogleDirectionsRenderer;

    setMap(newMap);
    setDirectionsService(newDirectionsService);
    setDirectionsRenderer(newDirectionsRenderer);
  }, [mapLoaded, map]);

  return {
    mapRef,
    map,
    directionsService,
    directionsRenderer,
    alternativeRenderers,
    setAlternativeRenderers,
    mapLoaded,
  };
};
