import React, { useState } from 'react';
import { Stack, Alert, Card, Grid, Text } from '@mantine/core';

// Importar tipos y hooks
import { RouteVisualizerProps } from './RouteVisualizer/types';
import { useGoogleMaps } from './RouteVisualizer/hooks/useGoogleMaps';
import { useRouteCalculation } from './RouteVisualizer/hooks/useRouteCalculation';
import { useRouteHandlers } from './RouteVisualizer/hooks/useRouteHandlers';
import { useRouteEffects } from './RouteVisualizer/hooks/useRouteEffects';
import { RouteControls } from './RouteVisualizer/components/RouteControls';
import { RouteInstructions } from './RouteVisualizer/components/RouteInstructions';

function RouteVisualizer({
  origin,
  destination,
  waypoints = [],
  onWaypointsChange: _onWaypointsChange,
  sites: _sites = [],
  height = 500,
  travelMode = 'DRIVING',
  optimizeWaypoints = false,
  avoidHighways = false,
  avoidTolls = false,
  showSteps: _showSteps = true,
  showAlternatives = false,
  autoCalculate = true,
}: RouteVisualizerProps) {
  // Estados locales
  const [showInstructions, setShowInstructions] = useState(false);

  // Hooks personalizados
  const { mapRef, directionsService, directionsRenderer, mapLoaded } = useGoogleMaps();

  const { route, loading, error, calculateRoute } = useRouteCalculation({
    directionsService,
    directionsRenderer,
  });

  const { downloadGpx } = useRouteHandlers(route);

  // Efectos delegados a hook especializado
  useRouteEffects({
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
  });

  const handleCalculateRoute = () =>
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

  // Handlers delegados a hooks

  // Componente extraído

  const renderLoadingState = () => (
    <Card withBorder p="xl" ta="center">
      <Text>Cargando Google Maps...</Text>
    </Card>
  );

  if (!mapLoaded) {
    return renderLoadingState();
  }

  return (
    <Stack>
      <RouteControls
        route={route}
        loading={loading}
        travelMode={travelMode}
        optimizeWaypoints={optimizeWaypoints}
        avoidHighways={avoidHighways}
        avoidTolls={avoidTolls}
        showInstructions={showInstructions}
        origin={origin}
        destination={destination}
        onCalculateRoute={handleCalculateRoute}
        onDownloadGpx={downloadGpx}
        onToggleInstructions={() => setShowInstructions(!showInstructions)}
      />

      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={showInstructions ? 8 : 12}>
          <Card withBorder p={0}>
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: `${height}px`,
                borderRadius: '8px',
              }}
            />
          </Card>
        </Grid.Col>

        {showInstructions && route && (
          <Grid.Col span={4}>
            <RouteInstructions route={route} height={height} />
          </Grid.Col>
        )}
      </Grid>
    </Stack>
  );
}

export default RouteVisualizer;
