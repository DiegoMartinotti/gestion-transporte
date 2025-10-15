import React, { useState, useEffect, useCallback } from 'react';
import type { Site } from '../../types';
import {
  getCoordinatesFromLocation,
  validateCoordinates,
  calculateTravelCosts,
  createDistanceMatrixRequest,
  DistanceCalculatorUI,
  type DistanceResult,
  type CostCalculation,
} from './DistanceCalculatorHelpers';

type DistanceCalculatorProps = Readonly<{
  origin?: { lat: number; lng: number } | Site;
  destination?: { lat: number; lng: number } | Site;
  onOriginChange?: (location: { lat: number; lng: number } | Site | null) => void;
  onDestinationChange?: (location: { lat: number; lng: number } | Site | null) => void;
  sites?: Site[];
  showSiteSelector?: boolean;
  showManualInput?: boolean;
  showCostCalculator?: boolean;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  autoCalculate?: boolean;
}>;

type DistanceMatrixElement = {
  status?: string;
  distance?: { text: string; value: number };
  duration?: { text: string; value: number };
};

type DistanceMatrixResponse = {
  rows?: Array<{ elements?: DistanceMatrixElement[] }>;
};

type DistanceMatrixServiceLike = {
  getDistanceMatrix: (
    request: Record<string, unknown>,
    callback: (response: DistanceMatrixResponse, status: string) => void
  ) => void;
};

// Hook personalizado para manejar el estado
const useDistanceCalculatorState = () => {
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedOriginSite, setSelectedOriginSite] = useState<string>('');
  const [selectedDestinationSite, setSelectedDestinationSite] = useState<string>('');
  const [manualOrigin, setManualOrigin] = useState({ lat: 0, lng: 0 });
  const [manualDestination, setManualDestination] = useState({ lat: 0, lng: 0 });
  const [mode, setMode] = useState<'sites' | 'manual'>('sites');
  const [fuelPrice, setFuelPrice] = useState(150);
  const [fuelConsumption, setFuelConsumption] = useState(35);
  const [tollCosts, setTollCosts] = useState(0);
  const [driverCost, setDriverCost] = useState(2000);

  return {
    result,
    setResult,
    loading,
    setLoading,
    error,
    setError,
    selectedOriginSite,
    setSelectedOriginSite,
    selectedDestinationSite,
    setSelectedDestinationSite,
    manualOrigin,
    setManualOrigin,
    manualDestination,
    setManualDestination,
    mode,
    setMode,
    fuelPrice,
    setFuelPrice,
    fuelConsumption,
    setFuelConsumption,
    tollCosts,
    setTollCosts,
    driverCost,
    setDriverCost,
  };
};

const useCurrentCoordinates = (
  state: ReturnType<typeof useDistanceCalculatorState>,
  origin: DistanceCalculatorProps['origin'],
  destination: DistanceCalculatorProps['destination'],
  sites: Site[]
) =>
  useCallback(() => {
    if (state.mode === 'sites') {
      const originSite = state.selectedOriginSite
        ? sites.find((siteItem) => siteItem._id === state.selectedOriginSite)
        : undefined;
      const destinationSite = state.selectedDestinationSite
        ? sites.find((siteItem) => siteItem._id === state.selectedDestinationSite)
        : undefined;

      return {
        originCoords: originSite?.coordenadas ?? getCoordinatesFromLocation(origin),
        destinationCoords: destinationSite?.coordenadas ?? getCoordinatesFromLocation(destination),
      };
    }

    return { originCoords: state.manualOrigin, destinationCoords: state.manualDestination };
  }, [
    state.mode,
    state.selectedOriginSite,
    state.selectedDestinationSite,
    state.manualOrigin,
    state.manualDestination,
    origin,
    destination,
    sites,
  ]);

const useProcessDistanceResponse = (state: ReturnType<typeof useDistanceCalculatorState>) =>
  useCallback(
    (response: DistanceMatrixResponse, status: string) => {
      state.setLoading(false);

      if (status !== 'OK') {
        state.setError('Error en el servicio de Google Maps');
        return;
      }

      const element = response.rows?.[0]?.elements?.[0];

      if (element?.status === 'OK' && element.distance && element.duration) {
        state.setResult({
          distance: element.distance,
          duration: element.duration,
          status: element.status,
        });
        state.setError('');
      } else {
        state.setError('No se pudo calcular la ruta entre los puntos seleccionados');
      }
    },
    [state]
  );

const useDistanceMatrixCalculation = ({
  getCurrentCoordinates,
  state,
  travelMode,
  avoidHighways,
  avoidTolls,
  processDistanceResponse,
}: {
  getCurrentCoordinates: ReturnType<typeof useCurrentCoordinates>;
  state: ReturnType<typeof useDistanceCalculatorState>;
  travelMode: DistanceCalculatorProps['travelMode'];
  avoidHighways: DistanceCalculatorProps['avoidHighways'];
  avoidTolls: DistanceCalculatorProps['avoidTolls'];
  processDistanceResponse: ReturnType<typeof useProcessDistanceResponse>;
}) =>
  useCallback(async () => {
    const { originCoords, destinationCoords } = getCurrentCoordinates();

    if (!originCoords || !destinationCoords) {
      state.setError('Debe seleccionar origen y destino');
      return;
    }

    if (!validateCoordinates(originCoords) || !validateCoordinates(destinationCoords)) {
      state.setError('Coordenadas inválidas');
      return;
    }

    const maps = window.google?.maps as
      | {
          DistanceMatrixService?: new () => DistanceMatrixServiceLike;
        }
      | undefined;
    if (!maps?.DistanceMatrixService) {
      state.setError('Google Maps no está disponible');
      return;
    }

    state.setLoading(true);
    state.setError('');

    try {
      const service = new maps.DistanceMatrixService();
      const request = createDistanceMatrixRequest({
        originCoords,
        destinationCoords,
        travelMode: travelMode || 'DRIVING',
        avoidHighways: avoidHighways || false,
        avoidTolls: avoidTolls || false,
      });

      service.getDistanceMatrix(request, processDistanceResponse);
    } catch {
      state.setLoading(false);
      state.setError('Error al calcular la distancia');
    }
  }, [
    avoidHighways,
    avoidTolls,
    getCurrentCoordinates,
    processDistanceResponse,
    state,
    travelMode,
  ]);

const useAutoCalculation = (
  autoCalculate: DistanceCalculatorProps['autoCalculate'],
  state: ReturnType<typeof useDistanceCalculatorState>,
  calculateDistance: ReturnType<typeof useDistanceMatrixCalculation>
) => {
  useEffect(() => {
    if (!autoCalculate) return;

    const shouldCalculate =
      state.mode === 'sites'
        ? state.selectedOriginSite && state.selectedDestinationSite
        : state.manualOrigin.lat !== 0 && state.manualDestination.lat !== 0;

    if (shouldCalculate) {
      const timer = setTimeout(calculateDistance, 500);
      return () => clearTimeout(timer);
    }
  }, [
    autoCalculate,
    calculateDistance,
    state.manualDestination,
    state.manualOrigin,
    state.mode,
    state.selectedDestinationSite,
    state.selectedOriginSite,
  ]);
};

const useCostCalculation = (state: ReturnType<typeof useDistanceCalculatorState>) =>
  useCallback((): CostCalculation | null => {
    if (!state.result) return null;
    return calculateTravelCosts(state.result, {
      fuelPrice: state.fuelPrice,
      fuelConsumption: state.fuelConsumption,
      tollCosts: state.tollCosts,
      driverCost: state.driverCost,
    });
  }, [state.driverCost, state.fuelConsumption, state.fuelPrice, state.result, state.tollCosts]);

const useGoogleMapsOpener = (getCurrentCoordinates: ReturnType<typeof useCurrentCoordinates>) =>
  useCallback(() => {
    const { originCoords, destinationCoords } = getCurrentCoordinates();
    if (!originCoords || !destinationCoords) return;

    const url = `https://maps.google.com/maps?saddr=${originCoords.lat},${originCoords.lng}&daddr=${destinationCoords.lat},${destinationCoords.lng}&dirflg=d`;
    window.open(url, '_blank');
  }, [getCurrentCoordinates]);

// Hook personalizado para la lógica de cálculo de distancia
const useDistanceCalculation = (
  state: ReturnType<typeof useDistanceCalculatorState>,
  props: DistanceCalculatorProps
) => {
  const {
    origin,
    destination,
    sites = [],
    travelMode,
    avoidHighways,
    avoidTolls,
    autoCalculate,
  } = props;

  const getCurrentCoordinates = useCurrentCoordinates(state, origin, destination, sites);
  const processDistanceResponse = useProcessDistanceResponse(state);
  const calculateDistance = useDistanceMatrixCalculation({
    getCurrentCoordinates,
    state,
    travelMode,
    avoidHighways,
    avoidTolls,
    processDistanceResponse,
  });
  useAutoCalculation(autoCalculate, state, calculateDistance);
  const calculateCosts = useCostCalculation(state);
  const openInGoogleMaps = useGoogleMapsOpener(getCurrentCoordinates);

  return { calculateDistance, calculateCosts, openInGoogleMaps };
};

export default function DistanceCalculator(props: Readonly<DistanceCalculatorProps>) {
  const state = useDistanceCalculatorState();
  const { calculateDistance, calculateCosts, openInGoogleMaps } = useDistanceCalculation(
    state,
    props
  );
  const costs = calculateCosts();

  return (
    <DistanceCalculatorUI
      state={state}
      props={props}
      calculateDistance={calculateDistance}
      openInGoogleMaps={openInGoogleMaps}
      costs={costs}
    />
  );
}
