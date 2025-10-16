// Helpers refactorizados para RouteVisualizer
export interface RouteWaypoint {
  location: string;
  stopover: boolean;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface RouteResult {
  distance: string;
  duration: string;
  steps: RouteStep[];
}

export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = reject;

    document.head.appendChild(script);
  });
};

type GoogleDirectionsWaypoint = {
  location: string;
  stopover?: boolean;
};

type GoogleDirectionsRequest = {
  origin: string;
  destination: string;
  waypoints: GoogleDirectionsWaypoint[];
  travelMode: string;
  optimizeWaypoints: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
};

type GoogleDirectionsStep = {
  instructions?: string;
  distance?: { text?: string };
  duration?: { text?: string };
};

type GoogleDirectionsLeg = {
  distance?: { text?: string };
  duration?: { text?: string };
  steps?: GoogleDirectionsStep[];
};

type GoogleDirectionsRoute = {
  legs: GoogleDirectionsLeg[];
};

type GoogleDirectionsResult = {
  routes: GoogleDirectionsRoute[];
};

type GoogleDirectionsService = {
  route: (
    request: GoogleDirectionsRequest,
    callback: (result: GoogleDirectionsResult, status: string) => void
  ) => void;
};

type GoogleDirectionsRenderer = {
  setDirections: (result: GoogleDirectionsResult | null) => void;
};

type GoogleMapsApi = {
  TravelMode?: Record<string, string>;
  DirectionsService?: new () => GoogleDirectionsService;
  DirectionsRenderer?: new (config?: unknown) => GoogleDirectionsRenderer;
};

const getGoogleMaps = (): GoogleMapsApi | null => {
  const maps = window.google?.maps as unknown;
  if (!maps) {
    return null;
  }

  return maps as GoogleMapsApi;
};

export const createRouteRequest = (
  origin: string,
  destination: string,
  waypoints: RouteWaypoint[]
): GoogleDirectionsRequest => {
  const maps = getGoogleMaps();
  const travelModes = maps?.TravelMode ?? {};
  const travelMode = travelModes.DRIVING ?? 'DRIVING';

  return {
    origin,
    destination,
    waypoints,
    travelMode,
    optimizeWaypoints: true,
    avoidHighways: false,
    avoidTolls: false,
  };
};

export const handleRouteCalculationSuccess = (
  response: GoogleDirectionsResult
): RouteResult | null => {
  if (response.routes.length === 0) return null;

  const route = response.routes[0];
  const leg = route.legs[0];

  if (!leg) return null;

  return {
    distance: leg.distance?.text || 'N/A',
    duration: leg.duration?.text || 'N/A',
    steps:
      leg.steps?.map((step) => ({
        instruction: step.instructions ?? 'N/A',
        distance: step.distance?.text ?? 'N/A',
        duration: step.duration?.text ?? 'N/A',
      })) || [],
  };
};

export const initializeMapServices = () => {
  const maps = getGoogleMaps();
  if (!maps || !maps.DirectionsService || !maps.DirectionsRenderer) {
    throw new Error('Google Maps not loaded');
  }

  return {
    directionsService: new maps.DirectionsService(),
    directionsRenderer: new maps.DirectionsRenderer(),
  };
};
