import { useState, useCallback } from 'react';
import { Site } from '../../../types';
import {
  RouteWaypoint,
  RouteResult,
  GoogleDirectionsService,
  GoogleDirectionsRenderer,
} from '../types';

interface UseRouteCalculationProps {
  directionsService: GoogleDirectionsService | null;
  directionsRenderer: GoogleDirectionsRenderer | null;
}

// Interface para configuración de cálculo de ruta
interface RouteCalculationConfig {
  origin: { lat: number; lng: number } | Site | undefined;
  destination: { lat: number; lng: number } | Site | undefined;
  waypoints: RouteWaypoint[];
  options: {
    travelMode: string;
    optimizeWaypoints: boolean;
    avoidHighways: boolean;
    avoidTolls: boolean;
    showAlternatives: boolean;
  };
}

export const useRouteCalculation = ({
  directionsService,
  directionsRenderer,
}: UseRouteCalculationProps) => {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Obtener coordenadas
  const getCoordinates = useCallback(
    (location: { lat: number; lng: number } | Site | undefined) => {
      if (!location) return null;

      if ('coordenadas' in location) {
        return location.coordenadas;
      }

      return location;
    },
    []
  );

  // Helper para obtener mensaje de error según status
  const getErrorMessage = useCallback((status: string): string => {
    switch (status) {
      case 'NOT_FOUND':
        return 'No se encontró una ruta entre los puntos especificados';
      case 'ZERO_RESULTS':
        return 'No se encontraron rutas entre origen y destino';
      case 'OVER_QUERY_LIMIT':
        return 'Se excedió el límite de consultas a la API';
      case 'REQUEST_DENIED':
        return 'Solicitud denegada por la API de Google Maps';
      case 'INVALID_REQUEST':
        return 'Solicitud inválida';
      default:
        return `Error: ${status}`;
    }
  }, []);

  // Helper para procesar resultado exitoso
  const processSuccessfulResult = useCallback(
    (result: RouteResult, showAlternatives: boolean) => {
      setRoute(result);
      directionsRenderer?.setDirections(result);

      // Manejar rutas alternativas si están habilitadas
      if (showAlternatives && Array.isArray(result)) {
        const [mainRoute, ...alternatives] = result as unknown as RouteResult[];
        setRoute(mainRoute);
        setAlternativeRoutes(alternatives || []);
      }

      setError('');
    },
    [directionsRenderer]
  );

  // Helper para procesar resultado de error
  const processErrorResult = useCallback(
    (status: string) => {
      const errorMessage = getErrorMessage(status);
      setError(errorMessage);
      setRoute(null);
      setAlternativeRoutes([]);
    },
    [getErrorMessage]
  );

  // Handler principal para el resultado de la ruta
  const handleRouteResult = useCallback(
    (result: RouteResult | null, status: string, showAlternatives?: boolean) => {
      setLoading(false);

      if (status === 'OK' && result) {
        processSuccessfulResult(result, showAlternatives || false);
      } else {
        processErrorResult(status);
      }
    },
    [processSuccessfulResult, processErrorResult]
  );

  // Calcular ruta
  const calculateRoute = useCallback(
    async (config: RouteCalculationConfig) => {
      const { origin, destination, waypoints, options } = config;
      const { travelMode, optimizeWaypoints, avoidHighways, avoidTolls, showAlternatives } =
        options;
      const originCoords = getCoordinates(origin);
      const destinationCoords = getCoordinates(destination);

      if (!originCoords || !destinationCoords || !directionsService) {
        setError('Debe seleccionar origen y destino');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const request = {
          origin: new window.google.maps.LatLng(originCoords.lat, originCoords.lng),
          destination: new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lng),
          waypoints: waypoints.map((wp) => ({
            location: new window.google.maps.LatLng(wp.location.lat, wp.location.lng),
            stopover: wp.stopover !== false,
          })),
          optimizeWaypoints,
          travelMode:
            window.google.maps.TravelMode[travelMode as keyof typeof window.google.maps.TravelMode],
          avoidHighways,
          avoidTolls,
          provideRouteAlternatives: showAlternatives,
        };

        directionsService.route(request, (result: RouteResult | null, status: string) => {
          handleRouteResult(result, status, showAlternatives);
        });
      } catch (err) {
        setLoading(false);
        setError('Error inesperado calculando la ruta');
        console.error('Error calculating route:', err);
      }
    },
    [directionsService, getCoordinates, handleRouteResult]
  );

  return {
    route,
    alternativeRoutes,
    loading,
    error,
    setError,
    calculateRoute,
  };
};
