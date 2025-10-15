import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stack, Group, Text, Button, Paper, Alert } from '@mantine/core';
import { IconRoute } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { Site } from '../../types';

type LatLngLiteral = { lat: number; lng: number };

type DirectionsLegLike = {
  distance?: { text?: string };
};

type DirectionsRouteLike = {
  legs: DirectionsLegLike[];
};

type DirectionsResultLike = {
  routes: DirectionsRouteLike[];
};

type DirectionsServiceLike = {
  route: (
    request: Record<string, unknown>,
    callback: (result: DirectionsResultLike | null, status: string) => void
  ) => void;
};

type DirectionsRendererLike = {
  setDirections: (result: DirectionsResultLike) => void;
};

type RouteWaypoint = Readonly<{
  location: LatLngLiteral;
  stopover?: boolean;
  site?: Site;
}>;

type GoogleMapsNamespace = {
  Map?: new (
    element: HTMLElement,
    options: { zoom: number; center: LatLngLiteral; mapTypeId?: unknown }
  ) => unknown;
  MapTypeId?: Record<string, unknown>;
  DirectionsService?: new () => DirectionsServiceLike;
  DirectionsRenderer?: new (options: {
    draggable: boolean;
    map: unknown;
  }) => DirectionsRendererLike;
  LatLng?: new (lat: number, lng: number) => unknown;
  TravelMode?: Record<string, string>;
};

type RouteVisualizerProps = Readonly<{
  origin?: LatLngLiteral | Site;
  destination?: LatLngLiteral | Site;
  waypoints?: RouteWaypoint[];
  height?: number;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  optimizeWaypoints?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  showAlternatives?: boolean;
  autoCalculate?: boolean;
}>;

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

type RouteVisualizerLogicProps = Omit<RouteVisualizerProps, 'height'>;

const resolveCoordinates = (location: { lat: number; lng: number } | Site | undefined) => {
  if (!location) return null;
  if ('coordenadas' in location) {
    return location.coordenadas;
  }
  return location;
};

const useRouteServices = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<unknown>(null);
  const [directionsService, setDirectionsService] = useState<DirectionsServiceLike | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<DirectionsRendererLike | null>(null);
  const [error, setError] = useState<string>('');
  const { mapLoaded } = useGoogleMaps();

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || map) return;

    const maps = window.google?.maps as GoogleMapsNamespace | undefined;
    if (!maps?.Map || !maps.LatLng) {
      setError('Google Maps no está disponible');
      return;
    }

    const newMap = new maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: -34.6037, lng: -58.3816 },
      mapTypeId: maps.MapTypeId?.ROADMAP ?? 'ROADMAP',
    });

    setMap(newMap);
    if (maps.DirectionsService) {
      setDirectionsService(new maps.DirectionsService() as DirectionsServiceLike);
    }
    if (maps.DirectionsRenderer) {
      setDirectionsRenderer(
        new maps.DirectionsRenderer({ draggable: true, map: newMap }) as DirectionsRendererLike
      );
    }
  }, [mapLoaded, map]);

  return { mapRef, directionsService, directionsRenderer, error, setError };
};

const useRouteVisualizerLogic = ({
  origin,
  destination,
  waypoints = [],
  travelMode = 'DRIVING',
  optimizeWaypoints = false,
  avoidHighways = false,
  avoidTolls = false,
  showAlternatives = false,
  autoCalculate = true,
}: RouteVisualizerLogicProps) => {
  const { mapRef, directionsService, directionsRenderer, error, setError } = useRouteServices();
  const [loading, setLoading] = useState(false);

  // Calcular ruta
  const calculateRoute = useCallback(async () => {
    const originCoords = resolveCoordinates(origin);
    const destinationCoords = resolveCoordinates(destination);

    if (!originCoords || !destinationCoords || !directionsService) {
      setError('Debe seleccionar origen y destino');
      return;
    }

    const maps = window.google?.maps as GoogleMapsNamespace | undefined;
    if (!maps?.LatLng) {
      setError('Google Maps no está disponible');
      return;
    }

    setLoading(true);
    setError('');

    const request = {
      origin: new maps.LatLng(originCoords.lat, originCoords.lng),
      destination: new maps.LatLng(destinationCoords.lat, destinationCoords.lng),
      waypoints:
        waypoints?.map((wp) => ({
          location: new maps.LatLng(wp.location.lat, wp.location.lng),
          stopover: wp.stopover !== false,
        })) || [],
      optimizeWaypoints,
      travelMode: maps.TravelMode?.[travelMode] ?? travelMode,
      avoidHighways,
      avoidTolls,
      provideRouteAlternatives: showAlternatives,
    };

    directionsService.route(request, (result, status) => {
      setLoading(false);

      if (status === 'OK' && result) {
        directionsRenderer?.setDirections(result);

        notifications.show({
          title: 'Ruta calculada',
          message: `Distancia: ${result.routes?.[0]?.legs?.[0]?.distance?.text ?? 'N/A'}`,
          color: 'green',
        });
      } else {
        setError('No se pudo calcular la ruta');
      }
    });
  }, [
    origin,
    destination,
    directionsService,
    directionsRenderer,
    setError,
    waypoints,
    optimizeWaypoints,
    travelMode,
    avoidHighways,
    avoidTolls,
    showAlternatives,
  ]);

  // Auto-calcular cuando cambian parámetros
  useEffect(() => {
    if (autoCalculate && origin && destination && directionsService) {
      const timer = setTimeout(calculateRoute, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCalculate, origin, destination, calculateRoute, directionsService]);

  return { mapRef, loading, error, calculateRoute };
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
  autoCalculate = true,
}: RouteVisualizerProps) {
  const { mapRef, loading, error, calculateRoute } = useRouteVisualizerLogic({
    origin,
    destination,
    waypoints,
    travelMode,
    optimizeWaypoints,
    avoidHighways,
    avoidTolls,
    showAlternatives,
    autoCalculate,
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600} size="lg">
          Visualizador de Rutas
        </Text>
        <Button
          variant="light"
          leftSection={<IconRoute size={16} />}
          onClick={calculateRoute}
          loading={loading}
        >
          Calcular Ruta
        </Button>
      </Group>

      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      <Paper withBorder>
        <div ref={mapRef} style={{ width: '100%', height, borderRadius: 8 }} />
      </Paper>
    </Stack>
  );
}

export default RouteVisualizer;
