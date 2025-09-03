import React from 'react';
import {
  Grid,
  Group,
  Text,
  Select,
  NumberInput,
  Paper,
  Stack,
  Badge,
  ActionIcon,
  Tooltip,
  Card,
  Divider,
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconClock,
  IconGasStation,
  IconRefresh,
  IconNavigation,
} from '@tabler/icons-react';
import { Site } from '../../types';

export interface DistanceResult {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
}

export interface CostCalculation {
  distance: number;
  duration: number;
  fuelCost: number;
  driverCost: number;
  tollCosts: number;
  totalCost: number;
}

// Componente para seleccionar sites
export const SiteSelector = ({
  sites,
  selectedOriginSite,
  selectedDestinationSite,
  setSelectedOriginSite,
  setSelectedDestinationSite,
  onOriginChange,
  onDestinationChange,
}: {
  sites: Site[];
  selectedOriginSite: string;
  selectedDestinationSite: string;
  setSelectedOriginSite: (value: string) => void;
  setSelectedDestinationSite: (value: string) => void;
  onOriginChange?: (location: { lat: number; lng: number } | Site | null) => void;
  onDestinationChange?: (location: { lat: number; lng: number } | Site | null) => void;
}) => (
  <Grid>
    <Grid.Col span={6}>
      <Select
        label="Origen"
        placeholder="Seleccionar site de origen"
        data={sites.map((site) => ({
          value: site._id,
          label: `${site.nombre} - ${site.localidad || site.ciudad || ''}`,
        }))}
        value={selectedOriginSite}
        onChange={(value) => {
          setSelectedOriginSite(value || '');
          const site = sites.find((s) => s._id === value);
          if (site && onOriginChange) {
            onOriginChange(site);
          }
        }}
        leftSection={<IconMapPin size={16} />}
        searchable
      />
    </Grid.Col>
    <Grid.Col span={6}>
      <Select
        label="Destino"
        placeholder="Seleccionar site de destino"
        data={sites.map((site) => ({
          value: site._id,
          label: `${site.nombre} - ${site.localidad || site.ciudad || ''}`,
        }))}
        value={selectedDestinationSite}
        onChange={(value) => {
          setSelectedDestinationSite(value || '');
          const site = sites.find((s) => s._id === value);
          if (site && onDestinationChange) {
            onDestinationChange(site);
          }
        }}
        leftSection={<IconMapPin size={16} />}
        searchable
      />
    </Grid.Col>
  </Grid>
);

// Componente para coordenadas manuales
export const ManualCoordinatesInput = ({
  manualOrigin,
  manualDestination,
  setManualOrigin,
  setManualDestination,
}: {
  manualOrigin: { lat: number; lng: number };
  manualDestination: { lat: number; lng: number };
  setManualOrigin: (coords: { lat: number; lng: number }) => void;
  setManualDestination: (coords: { lat: number; lng: number }) => void;
}) => (
  <Grid>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Origen
        </Text>
        <Group>
          <NumberInput
            placeholder="Latitud"
            value={manualOrigin.lat || ''}
            onChange={(val) =>
              setManualOrigin({
                ...manualOrigin,
                lat: typeof val === 'number' ? val : 0,
              })
            }
            decimalScale={6}
            step={0.000001}
            style={{ flex: 1 }}
          />
          <NumberInput
            placeholder="Longitud"
            value={manualOrigin.lng || ''}
            onChange={(val) =>
              setManualOrigin({
                ...manualOrigin,
                lng: typeof val === 'number' ? val : 0,
              })
            }
            decimalScale={6}
            step={0.000001}
            style={{ flex: 1 }}
          />
        </Group>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Destino
        </Text>
        <Group>
          <NumberInput
            placeholder="Latitud"
            value={manualDestination.lat || ''}
            onChange={(val) =>
              setManualDestination({
                ...manualDestination,
                lat: typeof val === 'number' ? val : 0,
              })
            }
            decimalScale={6}
            step={0.000001}
            style={{ flex: 1 }}
          />
          <NumberInput
            placeholder="Longitud"
            value={manualDestination.lng || ''}
            onChange={(val) =>
              setManualDestination({
                ...manualDestination,
                lng: typeof val === 'number' ? val : 0,
              })
            }
            decimalScale={6}
            step={0.000001}
            style={{ flex: 1 }}
          />
        </Group>
      </Stack>
    </Grid.Col>
  </Grid>
);

// Componente para mostrar resultados
export const DistanceResults = ({
  result,
  loading,
  calculateDistance,
  openInGoogleMaps,
}: {
  result: DistanceResult;
  loading: boolean;
  calculateDistance: () => void;
  openInGoogleMaps: () => void;
}) => (
  <Paper p="md" withBorder>
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600} size="lg">
          Resultados
        </Text>
        <Group>
          <Badge color="green" variant="light">
            Calculado
          </Badge>
          <ActionIcon variant="subtle" onClick={calculateDistance} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
          <Tooltip label="Abrir en Google Maps">
            <ActionIcon variant="light" color="blue" onClick={openInGoogleMaps}>
              <IconNavigation size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Card withBorder>
            <Group>
              <IconRoute size={24} color="blue" />
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  Distancia
                </Text>
                <Text fw={600}>{result.distance.text}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card withBorder>
            <Group>
              <IconClock size={24} color="orange" />
              <Stack gap={2}>
                <Text size="sm" c="dimmed">
                  Tiempo estimado
                </Text>
                <Text fw={600}>{result.duration.text}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  </Paper>
);

// Componente para la calculadora de costos
export const CostCalculator = ({
  costs,
  fuelPrice,
  fuelConsumption,
  driverCost,
  tollCosts,
  setFuelPrice,
  setFuelConsumption,
  setDriverCost,
  setTollCosts,
}: {
  costs: CostCalculation;
  fuelPrice: number;
  fuelConsumption: number;
  driverCost: number;
  tollCosts: number;
  setFuelPrice: (value: number) => void;
  setFuelConsumption: (value: number) => void;
  setDriverCost: (value: number) => void;
  setTollCosts: (value: number) => void;
}) => (
  <>
    <Divider label="Calculadora de Costos" labelPosition="center" />

    <Grid>
      <Grid.Col span={6}>
        <Stack gap="sm">
          <NumberInput
            label="Precio combustible ($/litro)"
            value={fuelPrice}
            onChange={(val) => setFuelPrice(typeof val === 'number' ? val : 0)}
            leftSection={<IconGasStation size={16} />}
          />
          <NumberInput
            label="Consumo (L/100km)"
            value={fuelConsumption}
            onChange={(val) => setFuelConsumption(typeof val === 'number' ? val : 0)}
            decimalScale={1}
          />
        </Stack>
      </Grid.Col>

      <Grid.Col span={6}>
        <Stack gap="sm">
          <NumberInput
            label="Costo conductor ($/hora)"
            value={driverCost}
            onChange={(val) => setDriverCost(typeof val === 'number' ? val : 0)}
          />
          <NumberInput
            label="Costos de peajes ($)"
            value={tollCosts}
            onChange={(val) => setTollCosts(typeof val === 'number' ? val : 0)}
          />
        </Stack>
      </Grid.Col>
    </Grid>

    <Card withBorder bg="blue.0">
      <Stack gap="sm">
        <Text fw={600}>Costos Estimados</Text>
        <Group justify="space-between">
          <Text size="sm">Combustible:</Text>
          <Text fw={500}>${costs.fuelCost.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Conductor:</Text>
          <Text fw={500}>${costs.driverCost.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Peajes:</Text>
          <Text fw={500}>${costs.tollCosts.toFixed(2)}</Text>
        </Group>
        <Divider />
        <Group justify="space-between">
          <Text fw={600}>Total:</Text>
          <Text fw={600} size="lg" c="blue">
            ${costs.totalCost.toFixed(2)}
          </Text>
        </Group>
      </Stack>
    </Card>
  </>
);
