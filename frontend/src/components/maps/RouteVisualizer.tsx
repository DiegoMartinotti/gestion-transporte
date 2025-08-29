import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Alert
} from '@mantine/core';
import {
  IconRoute
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Site } from '../../types';

interface RouteWaypoint {
  location: { lat: number; lng: number };
  stopover?: boolean;
  site?: Site;
}



interface RouteVisualizerProps {
  origin?: { lat: number; lng: number } | Site;
  destination?: { lat: number; lng: number } | Site;
  waypoints?: RouteWaypoint[];
  height?: number;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  optimizeWaypoints?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  showAlternatives?: boolean;
  autoCalculate?: boolean;
}

// Hook para la lógica del mapa
const useGoogleMaps = () => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        setMapLoaded(true);
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google?.maps) {
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

  return { mapLoaded };
};



function RouteVisualizer({
  origin,
  destination,
  waypoints = [],
  height = 500,
  travelMode = 'DRIVING',
  optimizeWaypoints = false,
  avoidHighways = false,
  avoidTolls = false,
  showAlternatives = false,
  autoCalculate = true
}: RouteVisualizerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const { mapLoaded } = useGoogleMaps();

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: -34.6037, lng: -58.3816 },
      mapTypeId: window.google.maps.MapTypeId.ROADMAP
    });

    setMap(newMap);
    setDirectionsService(new window.google.maps.DirectionsService());
    setDirectionsRenderer(new window.google.maps.DirectionsRenderer({ draggable: true, map: newMap }));
  }, [mapLoaded, map]);

  // Obtener coordenadas
  const getCoordinates = useCallback((location: { lat: number; lng: number } | Site | undefined): { lat: number; lng: number } | null => {
    if (!location) return null;
    
    if ('coordenadas' in location) {
      return location.coordenadas;
    }
    
    return location;
  }, []);

  // Calcular ruta
  const calculateRoute = useCallback(async () => {
    const originCoords = getCoordinates(origin);
    const destinationCoords = getCoordinates(destination);

    if (!originCoords || !destinationCoords || !directionsService) {
      setError('Debe seleccionar origen y destino');
      return;
    }

    setLoading(true);
    setError('');

    const request: google.maps.DirectionsRequest = {
      origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
      destination: new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lng),
      waypoints: waypoints?.map(wp => ({
        location: new window.google.maps.LatLng(wp.location.lat, wp.location.lng),
        stopover: wp.stopover !== false
      })) || [],
      optimizeWaypoints,
      travelMode: window.google.maps.TravelMode[travelMode],
      avoidHighways,
      avoidTolls,
      provideRouteAlternatives: showAlternatives
    };

    directionsService.route(request, (result, status) => {
      setLoading(false);
      
      if (status === 'OK' && result) {
        directionsRenderer?.setDirections(result);
        
        notifications.show({
          title: 'Ruta calculada',
          message: `Distancia: ${result.routes[0].legs[0].distance?.text}`,
          color: 'green'
        });
      } else {
        setError('No se pudo calcular la ruta');
      }
    });
  }, [origin, destination, waypoints, directionsService, directionsRenderer,
      travelMode, optimizeWaypoints, avoidHighways, avoidTolls, showAlternatives, getCoordinates]);

  // Auto-calcular cuando cambian parámetros
  useEffect(() => {
    if (autoCalculate && origin && destination && directionsService) {
      const timer = setTimeout(calculateRoute, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCalculate, origin, destination, calculateRoute, directionsService]);


  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600} size="lg">Visualizador de Rutas</Text>
        <Button variant="light" leftSection={<IconRoute size={16} />} onClick={calculateRoute} loading={loading}>
          Calcular Ruta
        </Button>
      </Group>

      {error && <Alert color="red" title="Error">{error}</Alert>}

      <Paper withBorder>
        <div ref={mapRef} style={{ width: '100%', height, borderRadius: 8 }} />
      </Paper>
    </Stack>
  );
}

export default RouteVisualizer;