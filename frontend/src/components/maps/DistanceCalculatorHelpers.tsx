// Helpers para DistanceCalculator
import React from 'react';
import { Group, Text, Select, Paper, Stack, Button, Alert } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { Site } from '../../types';
import {
  DistanceResult,
  CostCalculation,
  SiteSelector,
  ManualCoordinatesInput,
  DistanceResults,
  CostCalculator,
} from './DistanceCalculatorComponents';

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

// Helper functions
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

export const createDistanceMatrixRequest = (config: RequestConfig) => ({
  origins: [
    new (window as any).google.maps.LatLng(config.originCoords.lat, config.originCoords.lng),
  ],
  destinations: [
    new (window as any).google.maps.LatLng(
      config.destinationCoords.lat,
      config.destinationCoords.lng
    ),
  ],
  travelMode: (window as any).google.maps.TravelMode[config.travelMode],
  unitSystem: (window as any).google.maps.UnitSystem.METRIC,
  avoidHighways: config.avoidHighways,
  avoidTolls: config.avoidTolls,
});

// Interfaces para el componente UI
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

// Componente para el header
const CalculatorHeader = ({
  showSiteSelector,
  showManualInput,
  state,
}: {
  showSiteSelector: boolean;
  showManualInput: boolean;
  state: DistanceCalculatorState;
}) => (
  <Group justify="space-between">
    <Text fw={600} size="lg">
      Calculadora de Distancias
    </Text>
    {showSiteSelector && showManualInput && (
      <Button.Group>
        <Button
          variant={state.mode === 'sites' ? 'filled' : 'light'}
          onClick={() => state.setMode('sites')}
          size="sm"
        >
          Sites
        </Button>
        <Button
          variant={state.mode === 'manual' ? 'filled' : 'light'}
          onClick={() => state.setMode('manual')}
          size="sm"
        >
          Manual
        </Button>
      </Button.Group>
    )}
  </Group>
);

// Componente para la sección de entrada
const InputSection = ({
  state,
  props,
}: {
  state: DistanceCalculatorState;
  props: DistanceCalculatorUIProps;
}) => {
  const { sites = [], showSiteSelector = true, onOriginChange, onDestinationChange } = props;

  if (state.mode === 'sites' && showSiteSelector) {
    return (
      <SiteSelector
        sites={sites}
        selectedOriginSite={state.selectedOriginSite}
        selectedDestinationSite={state.selectedDestinationSite}
        setSelectedOriginSite={state.setSelectedOriginSite}
        setSelectedDestinationSite={state.setSelectedDestinationSite}
        onOriginChange={onOriginChange}
        onDestinationChange={onDestinationChange}
      />
    );
  }

  return (
    <ManualCoordinatesInput
      manualOrigin={state.manualOrigin}
      manualDestination={state.manualDestination}
      setManualOrigin={state.setManualOrigin}
      setManualDestination={state.setManualDestination}
    />
  );
};

// Componente para la sección de cálculo
const CalculationSection = ({
  travelMode,
  calculateDistance,
  loading,
}: {
  travelMode: string;
  calculateDistance: () => void;
  loading: boolean;
}) => (
  <Group justify="space-between">
    <Select
      label="Modo de viaje"
      data={[
        { value: 'DRIVING', label: 'Conduciendo' },
        { value: 'WALKING', label: 'Caminando' },
        { value: 'TRANSIT', label: 'Transporte público' },
        { value: 'BICYCLING', label: 'Bicicleta' },
      ]}
      value={travelMode}
      size="sm"
      w={150}
    />
    <Button
      variant="light"
      leftSection={<IconCalculator size={16} />}
      onClick={calculateDistance}
      loading={loading}
    >
      Calcular
    </Button>
  </Group>
);

// Componente UI principal simplificado
export const DistanceCalculatorUI = ({
  state,
  props,
  calculateDistance,
  openInGoogleMaps,
  costs,
}: {
  state: DistanceCalculatorState;
  props: DistanceCalculatorUIProps;
  calculateDistance: () => void;
  openInGoogleMaps: () => void;
  costs: CostCalculation | null;
}) => {
  const {
    showSiteSelector = true,
    showManualInput = true,
    showCostCalculator = false,
    travelMode = 'DRIVING',
  } = props;

  return (
    <Stack gap="md">
      <CalculatorHeader
        showSiteSelector={showSiteSelector}
        showManualInput={showManualInput}
        state={state}
      />

      <Paper p="md" withBorder>
        <Stack gap="md">
          <InputSection state={state} props={props} />
          <CalculationSection
            travelMode={travelMode}
            calculateDistance={calculateDistance}
            loading={state.loading}
          />
        </Stack>
      </Paper>

      {state.error && (
        <Alert color="red" title="Error">
          {state.error}
        </Alert>
      )}

      {state.result && (
        <DistanceResults
          result={state.result}
          loading={state.loading}
          calculateDistance={calculateDistance}
          openInGoogleMaps={openInGoogleMaps}
        />
      )}

      {showCostCalculator && state.result && costs && (
        <Paper p="md" withBorder>
          <CostCalculator
            costs={costs}
            fuelPrice={state.fuelPrice}
            fuelConsumption={state.fuelConsumption}
            driverCost={state.driverCost}
            tollCosts={state.tollCosts}
            setFuelPrice={state.setFuelPrice}
            setFuelConsumption={state.setFuelConsumption}
            setDriverCost={state.setDriverCost}
            setTollCosts={state.setTollCosts}
          />
        </Paper>
      )}
    </Stack>
  );
};
