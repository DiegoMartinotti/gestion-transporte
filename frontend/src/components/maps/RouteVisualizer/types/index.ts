import { Site } from '../../../types';

export interface RouteWaypoint {
  location: { lat: number; lng: number };
  stopover?: boolean;
  site?: Site;
}

export interface RouteStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  instructions: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  travel_mode: string;
}

export interface RouteResult {
  overview_path: { lat: number; lng: number }[];
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_address: string;
    end_address: string;
    steps: RouteStep[];
  }>;
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

export interface RouteVisualizerProps {
  origin?: { lat: number; lng: number } | Site;
  destination?: { lat: number; lng: number } | Site;
  waypoints?: RouteWaypoint[];
  onWaypointsChange?: (waypoints: RouteWaypoint[]) => void;
  sites?: Site[];
  height?: number;
  travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';
  optimizeWaypoints?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  showSteps?: boolean;
  showAlternatives?: boolean;
  autoCalculate?: boolean;
}

// Tipos específicos para Google Maps API
export interface GoogleMap {
  setCenter: (location: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: unknown) => void;
}

export interface GoogleDirectionsService {
  route: (request: unknown, callback: (result: RouteResult | null, status: string) => void) => void;
}

export interface GoogleDirectionsRenderer {
  setDirections: (directions: RouteResult | null) => void;
  setMap: (map: GoogleMap | null) => void;
  setRouteIndex: (index: number) => void;
  addListener: (event: string, callback: () => void) => void;
  getDirections: () => RouteResult;
}
