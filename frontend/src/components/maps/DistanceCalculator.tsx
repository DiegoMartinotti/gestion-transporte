import React, { useState, useEffect, useCallback } from 'react';
import { Site } from '../../types';
import {
  DistanceResult,
  CostCalculation,
  getCoordinatesFromLocation,
  validateCoordinates,
  calculateTravelCosts,
  createDistanceMatrixRequest,
  DistanceCalculatorUI
} from './DistanceCalculatorHelpers';

interface DistanceCalculatorProps {
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
}

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
    result, setResult,
    loading, setLoading,
    error, setError,
    selectedOriginSite, setSelectedOriginSite,
    selectedDestinationSite, setSelectedDestinationSite,
    manualOrigin, setManualOrigin,
    manualDestination, setManualDestination,
    mode, setMode,
    fuelPrice, setFuelPrice,
    fuelConsumption, setFuelConsumption,
    tollCosts, setTollCosts,
    driverCost, setDriverCost
  };
};

// Hook personalizado para la lógica de cálculo de distancia
const useDistanceCalculation = (
  state: ReturnType<typeof useDistanceCalculatorState>,
  props: DistanceCalculatorProps
) => {
  const { origin, destination, sites, travelMode, avoidHighways, avoidTolls, autoCalculate } = props;

  // Helper para obtener coordenadas según el modo
  const getCurrentCoordinates = useCallback(() => {
    const originCoords = state.mode === 'sites' 
      ? (state.selectedOriginSite ? sites.find(s => s._id === state.selectedOriginSite)?.coordenadas : getCoordinatesFromLocation(origin))
      : state.manualOrigin;
      
    const destinationCoords = state.mode === 'sites'
      ? (state.selectedDestinationSite ? sites.find(s => s._id === state.selectedDestinationSite)?.coordenadas : getCoordinatesFromLocation(destination))
      : state.manualDestination;

    return { originCoords, destinationCoords };
  }, [state.mode, state.selectedOriginSite, state.selectedDestinationSite, state.manualOrigin, state.manualDestination, origin, destination, sites]);

  // Procesar respuesta de Google Maps
  const processDistanceResponse = useCallback((
    response: google.maps.DistanceMatrixResponse, 
    status: google.maps.DistanceMatrixStatus
  ) => {
    state.setLoading(false);
    
    if (status !== 'OK') {
      state.setError('Error en el servicio de Google Maps');
      return;
    }

    const element = response.rows[0].elements[0];
    
    if (element.status === 'OK' && element.distance && element.duration) {
      state.setResult({
        distance: element.distance,
        duration: element.duration,
        status: element.status
      });
      state.setError('');
    } else {
      state.setError('No se pudo calcular la ruta entre los puntos seleccionados');
    }
  }, [state]);

  // Calcular distancia usando Google Maps API
  const calculateDistance = useCallback(async () => {
    const { originCoords, destinationCoords } = getCurrentCoordinates();

    if (!originCoords || !destinationCoords) {
      state.setError('Debe seleccionar origen y destino');
      return;
    }

    if (!validateCoordinates(originCoords) || !validateCoordinates(destinationCoords)) {
      state.setError('Coordenadas inválidas');
      return;
    }

    if (!window.google?.maps) {
      state.setError('Google Maps no está disponible');
      return;
    }

    state.setLoading(true);
    state.setError('');

    try {
      const service = new window.google.maps.DistanceMatrixService();
      const request = createDistanceMatrixRequest({
        originCoords, 
        destinationCoords, 
        travelMode: travelMode || 'DRIVING', 
        avoidHighways: avoidHighways || false, 
        avoidTolls: avoidTolls || false
      });

      service.getDistanceMatrix(request, processDistanceResponse);
    } catch {
      state.setLoading(false);
      state.setError('Error al calcular la distancia');
    }
  }, [getCurrentCoordinates, travelMode, avoidHighways, avoidTolls, processDistanceResponse, state]);

  // Auto-calcular cuando cambian origen/destino
  useEffect(() => {
    if (!autoCalculate) return;

    const shouldCalculate = state.mode === 'sites' 
      ? state.selectedOriginSite && state.selectedDestinationSite
      : state.manualOrigin.lat !== 0 && state.manualDestination.lat !== 0;

    if (shouldCalculate) {
      const timer = setTimeout(calculateDistance, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCalculate, state.mode, state.selectedOriginSite, state.selectedDestinationSite, 
      state.manualOrigin, state.manualDestination, calculateDistance]);

  // Calcular costos estimados
  const calculateCosts = useCallback((): CostCalculation | null => {
    if (!state.result) return null;
    return calculateTravelCosts(state.result, { 
      fuelPrice: state.fuelPrice, 
      fuelConsumption: state.fuelConsumption, 
      tollCosts: state.tollCosts, 
      driverCost: state.driverCost 
    });
  }, [state.result, state.fuelPrice, state.fuelConsumption, state.tollCosts, state.driverCost]);

  // Abrir en Google Maps
  const openInGoogleMaps = useCallback(() => {
    const { originCoords, destinationCoords } = getCurrentCoordinates();
    if (!originCoords || !destinationCoords) return;

    const url = `https://maps.google.com/maps?saddr=${originCoords.lat},${originCoords.lng}&daddr=${destinationCoords.lat},${destinationCoords.lng}&dirflg=d`;
    window.open(url, '_blank');
  }, [getCurrentCoordinates]);

  return { calculateDistance, calculateCosts, openInGoogleMaps };
};

export default function DistanceCalculator(props: DistanceCalculatorProps) {
  const state = useDistanceCalculatorState();
  const { calculateDistance, calculateCosts, openInGoogleMaps } = useDistanceCalculation(state, props);
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