import { useEffect } from 'react';
import { Site } from '../../../types';
import { RouteWaypoint, GoogleDirectionsRenderer } from '../types';

interface UseRouteEffectsProps {
  directionsRenderer: GoogleDirectionsRenderer | null;
  autoCalculate: boolean;
  mapLoaded: boolean;
  origin?: { lat: number; lng: number } | Site;
  destination?: { lat: number; lng: number } | Site;
  waypoints: RouteWaypoint[];
  travelMode: string;
  optimizeWaypoints: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
  showAlternatives: boolean;
  calculateRoute: (
    origin: { lat: number; lng: number } | Site | undefined,
    destination: { lat: number; lng: number } | Site | undefined,
    waypoints: RouteWaypoint[],
    travelMode: string,
    optimizeWaypoints: boolean,
    avoidHighways: boolean,
    avoidTolls: boolean,
    showAlternatives: boolean
  ) => void;
}

export const useRouteEffects = ({
  directionsRenderer,
  autoCalculate,
  mapLoaded,
  origin,
  destination,
  waypoints,
  travelMode,
  optimizeWaypoints,
  avoidHighways,
  avoidTolls,
  showAlternatives,
  calculateRoute,
}: UseRouteEffectsProps) => {
  // Configurar listeners cuando el renderer esté listo
  useEffect(() => {
    if (!directionsRenderer) return;

    // Listener para cambios en la ruta arrastrable
    directionsRenderer.addListener('directions_changed', () => {
      directionsRenderer.getDirections();
    });
  }, [directionsRenderer]);

  // Auto calcular cuando cambien los parámetros
  useEffect(() => {
    if (!autoCalculate || !mapLoaded) return;

    calculateRoute(
      origin,
      destination,
      waypoints,
      travelMode,
      optimizeWaypoints,
      avoidHighways,
      avoidTolls,
      showAlternatives
    );
  }, [
    origin,
    destination,
    waypoints,
    travelMode,
    optimizeWaypoints,
    avoidHighways,
    avoidTolls,
    showAlternatives,
    autoCalculate,
    mapLoaded,
    calculateRoute,
  ]);
};
