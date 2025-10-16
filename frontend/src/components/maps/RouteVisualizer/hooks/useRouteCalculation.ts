import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Site } from '../../../../types';
import {
  RouteWaypoint,
  RouteResult,
  GoogleDirectionsService,
  GoogleDirectionsRenderer,
} from '../types';

type LatLngConstructor = new (
  lat: number,
  lng: number
) => {
  lat: () => number;
  lng: () => number;
};

type GoogleMapsApi = {
  LatLng: LatLngConstructor;
  TravelMode?: Record<string, string>;
};

const getGoogleMapsApi = (): GoogleMapsApi | null => {
  const maps = window.google?.maps as unknown;
  if (!maps) {
    return null;
  }

  const { LatLng } = maps as Partial<GoogleMapsApi>;
  if (!LatLng) {
    return null;
  }

  return maps as GoogleMapsApi;
};

// Helper para obtener mensaje de error según status
const getErrorMessage = (status: string): string => {
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
};

interface UseRouteCalculationProps {
  directionsService: GoogleDirectionsService | null;
  directionsRenderer: GoogleDirectionsRenderer | null;
}

type LocationInput = { lat: number; lng: number } | Site | undefined;

// Interface para configuración de cálculo de ruta
interface RouteCalculationConfig {
  origin: LocationInput;
  destination: LocationInput;
  waypoints: RouteWaypoint[];
  options: {
    travelMode: string;
    optimizeWaypoints: boolean;
    avoidHighways: boolean;
    avoidTolls: boolean;
    showAlternatives: boolean;
  };
}

const resolveCoordinates = (location: LocationInput) => {
  if (!location) {
    return null;
  }

  if ('coordenadas' in location) {
    return location.coordenadas;
  }

  return location;
};

type RouteHandlerContext = {
  directionsRenderer: GoogleDirectionsRenderer | null;
  setRoute: Dispatch<SetStateAction<RouteResult | null>>;
  setAlternativeRoutes: Dispatch<SetStateAction<RouteResult[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

const useRouteResultHandler = ({
  directionsRenderer,
  setRoute,
  setAlternativeRoutes,
  setError,
  setLoading,
}: RouteHandlerContext) =>
  useCallback(
    (result: RouteResult | null, status: string, showAlternatives = false) => {
      setLoading(false);

      if (status === 'OK' && result) {
        directionsRenderer?.setDirections(result);
        if (showAlternatives && Array.isArray(result)) {
          const [mainRoute, ...alternatives] = result as unknown as RouteResult[];
          setRoute(mainRoute);
          setAlternativeRoutes(alternatives || []);
        } else {
          setRoute(result);
          setAlternativeRoutes([]);
        }
        setError('');
        return;
      }

      setRoute(null);
      setAlternativeRoutes([]);
      setError(getErrorMessage(status));
    },
    [directionsRenderer, setAlternativeRoutes, setError, setLoading, setRoute]
  );

export const useRouteCalculation = ({
  directionsService,
  directionsRenderer,
}: UseRouteCalculationProps) => {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRouteResult = useRouteResultHandler({
    directionsRenderer,
    setRoute,
    setAlternativeRoutes,
    setError,
    setLoading,
  });

  // Calcular ruta
  const calculateRoute = useCallback(
    async (config: RouteCalculationConfig) => {
      const { origin, destination, waypoints, options } = config;
      const { travelMode, optimizeWaypoints, avoidHighways, avoidTolls, showAlternatives } =
        options;
      const originCoords = resolveCoordinates(origin);
      const destinationCoords = resolveCoordinates(destination);

      if (!originCoords || !destinationCoords || !directionsService) {
        setError('Debe seleccionar origen y destino');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const maps = getGoogleMapsApi();
        if (!maps) {
          setError('Google Maps no está disponible');
          setLoading(false);
          return;
        }

        const travelModeKey = travelMode.toUpperCase();
        const request = {
          origin: new maps.LatLng(originCoords.lat, originCoords.lng),
          destination: new maps.LatLng(destinationCoords.lat, destinationCoords.lng),
          waypoints: waypoints.map((wp) => ({
            location: new maps.LatLng(wp.location.lat, wp.location.lng),
            stopover: wp.stopover !== false,
          })),
          optimizeWaypoints,
          travelMode: maps.TravelMode?.[travelModeKey] ?? travelModeKey,
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
    [directionsService, handleRouteResult]
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
