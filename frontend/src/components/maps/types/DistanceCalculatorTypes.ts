import { Site } from '../../../types';
import { DistanceResult } from '../DistanceCalculatorComponents';

export interface CostParams {
  fuelPrice: number;
  fuelConsumption: number;
  tollCosts: number;
  driverCost: number;
}

export interface RequestConfig {
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  travelMode: string;
  avoidHighways: boolean;
  avoidTolls: boolean;
}

export interface DistanceCalculatorState {
  mode: 'sites' | 'manual';
  selectedOriginSite: string;
  selectedDestinationSite: string;
  manualOrigin: { lat: number; lng: number };
  manualDestination: { lat: number; lng: number };
  setMode: (mode: 'sites' | 'manual') => void;
  setSelectedOriginSite: (site: string) => void;
  setSelectedDestinationSite: (site: string) => void;
  setManualOrigin: (coords: { lat: number; lng: number }) => void;
  setManualDestination: (coords: { lat: number; lng: number }) => void;
  error: string;
  result: DistanceResult | null;
  loading: boolean;
  fuelPrice: number;
  fuelConsumption: number;
  driverCost: number;
  tollCosts: number;
  setFuelPrice: (price: number) => void;
  setFuelConsumption: (consumption: number) => void;
  setDriverCost: (cost: number) => void;
  setTollCosts: (costs: number) => void;
}

export interface DistanceCalculatorUIProps {
  sites?: Site[];
  showSiteSelector?: boolean;
  showManualInput?: boolean;
  showCostCalculator?: boolean;
  travelMode?: string;
  onOriginChange?: (location: { lat: number; lng: number } | Site | null) => void;
  onDestinationChange?: (location: { lat: number; lng: number } | Site | null) => void;
}
