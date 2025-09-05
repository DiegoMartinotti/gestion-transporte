import { Site } from '../../../types';
import { DistanceResult, CostCalculation } from '../DistanceCalculatorComponents';
import { CostParams, RequestConfig } from '../types/DistanceCalculatorTypes';

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

declare global {
  interface Window {
    google: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown;
        TravelMode: Record<string, unknown>;
        UnitSystem: {
          METRIC: unknown;
        };
      };
    };
  }
}

export const createDistanceMatrixRequest = (config: RequestConfig) => ({
  origins: [new window.google.maps.LatLng(config.originCoords.lat, config.originCoords.lng)],
  destinations: [
    new window.google.maps.LatLng(config.destinationCoords.lat, config.destinationCoords.lng),
  ],
  travelMode: window.google.maps.TravelMode[config.travelMode],
  unitSystem: window.google.maps.UnitSystem.METRIC,
  avoidHighways: config.avoidHighways,
  avoidTolls: config.avoidTolls,
});
