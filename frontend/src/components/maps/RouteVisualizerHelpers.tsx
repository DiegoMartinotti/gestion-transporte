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

export const createRouteRequest = (
  origin: string,
  destination: string,
  waypoints: RouteWaypoint[]
): google.maps.DirectionsRequest => {
  return {
    origin,
    destination,
    waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeWaypoints: true,
    avoidHighways: false,
    avoidTolls: false,
  };
};

export const handleRouteCalculationSuccess = (
  response: google.maps.DirectionsResult
): RouteResult | null => {
  if (response.routes.length === 0) return null;

  const route = response.routes[0];
  const leg = route.legs[0];

  if (!leg) return null;

  return {
    distance: leg.distance?.text || 'N/A',
    duration: leg.duration?.text || 'N/A',
    steps:
      leg.steps?.map((step, _index) => ({
        instruction: step.instructions,
        distance: step.distance?.text || 'N/A',
        duration: step.duration?.text || 'N/A',
      })) || [],
  };
};

export const initializeMapServices = () => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps not loaded');
  }

  return {
    directionsService: new google.maps.DirectionsService(),
    directionsRenderer: new google.maps.DirectionsRenderer(),
  };
};
