// Helpers para DistanceCalculator
import React from 'react';
import { Group, Text, Select, Paper, Stack, Button, Alert } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import {
  SiteSelector,
  ManualCoordinatesInput,
  DistanceResults,
  CostCalculator,
} from './DistanceCalculatorComponents';
import {
  CostParams,
  RequestConfig,
  DistanceCalculatorState,
  DistanceCalculatorUIProps,
} from './types/DistanceCalculatorTypes';
import {
  getCoordinatesFromLocation,
  validateCoordinates,
  calculateTravelCosts,
  createDistanceMatrixRequest,
} from './utils/distanceCalculatorUtils';

// Re-export for compatibility
export type { CostParams, RequestConfig, DistanceCalculatorState, DistanceCalculatorUIProps };
export {
  getCoordinatesFromLocation,
  validateCoordinates,
  calculateTravelCosts,
  createDistanceMatrixRequest,
};

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
