import { Site } from '../../../types';
import { DistanceResult, CostCalculation } from '../DistanceCalculatorComponents';
import { CostParams, RequestConfig } from '../types/DistanceCalculatorTypes';

type GoogleMapsApi = {
  LatLng: new (lat: number, lng: number) => unknown;
  TravelMode?: Record<string, string>;
  UnitSystem?: {
    METRIC?: unknown;
  };
};

const getGoogleMaps = (): GoogleMapsApi | null => {
  const maps = window.google?.maps as unknown;
  if (!maps) {
    return null;
  }

  return maps as GoogleMapsApi;
};

export const getCoordinatesFromLocation = (
  location: { lat: number; lng: number } | Site | undefined
) => {
  if (!location) return null;

  if ('coordenadas' in location) {
    return location.coordenadas;
  }

  return location;
};

export const validateCoordinates = (coords: { lat: number; lng: number } | null) => {
  return coords && coords.lat !== 0 && coords.lng !== 0;
};

export const calculateTravelCosts = (
  result: DistanceResult,
  params: CostParams
): CostCalculation => {
  const distanceKm = result.distance.value / 1000;
  const durationHours = result.duration.value / 3600;

  const fuelCost = ((distanceKm * params.fuelConsumption) / 100) * params.fuelPrice;
  const driverTotalCost = durationHours * params.driverCost;
  const totalCost = fuelCost + params.tollCosts + driverTotalCost;

  return {
    distance: distanceKm,
    duration: durationHours,
    fuelCost,
    driverCost: driverTotalCost,
    tollCosts: params.tollCosts,
    totalCost,
  };
};

export const createDistanceMatrixRequest = (config: RequestConfig) => {
  const maps = getGoogleMaps();
  if (!maps || !maps.LatLng) {
    throw new Error('Google Maps no está disponible');
  }

  const travelModeMap = maps.TravelMode ?? {};
  const travelModeKey = config.travelMode.toUpperCase();

  return {
    origins: [new maps.LatLng(config.originCoords.lat, config.originCoords.lng)],
    destinations: [new maps.LatLng(config.destinationCoords.lat, config.destinationCoords.lng)],
    travelMode: travelModeMap[travelModeKey] ?? travelModeKey,
    unitSystem: maps.UnitSystem?.METRIC ?? 'METRIC',
    avoidHighways: config.avoidHighways,
    avoidTolls: config.avoidTolls,
  };
};
