import React from 'react';
import { Paper, Group, Text, Badge, Button, Select, Switch, ActionIcon } from '@mantine/core';
import { IconRoute, IconNavigation, IconDownload, IconEyeOff } from '@tabler/icons-react';
import { RouteResult } from '../types';

interface RouteControlsProps {
  route: RouteResult | null;
  loading: boolean;
  travelMode: string;
  optimizeWaypoints: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
  showInstructions: boolean;
  origin?: unknown;
  destination?: unknown;
  onCalculateRoute: () => void;
  onDownloadGpx: () => void;
  onToggleInstructions: () => void;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  route,
  loading,
  travelMode,
  optimizeWaypoints,
  avoidHighways,
  avoidTolls,
  showInstructions,
  origin,
  destination,
  onCalculateRoute,
  onDownloadGpx,
  onToggleInstructions,
}) => {
  return (
    <Paper withBorder p="md" mb="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconRoute size={20} />
          <Text fw={500} size="lg">
            Ruta
          </Text>
          {route && (
            <Badge color="blue" variant="light">
              {route.legs.reduce((acc, leg) => acc + leg.distance.value, 0) > 1000
                ? `${(route.legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1000).toFixed(1)} km`
                : `${route.legs.reduce((acc, leg) => acc + leg.distance.value, 0)} m`}
            </Badge>
          )}
        </Group>

        <Group>
          <Button
            variant="light"
            leftSection={<IconNavigation size={16} />}
            onClick={onCalculateRoute}
            loading={loading}
            disabled={!origin || !destination}
          >
            Calcular
          </Button>

          {route && (
            <ActionIcon variant="light" onClick={onDownloadGpx} title="Descargar GPX">
              <IconDownload size={16} />
            </ActionIcon>
          )}

          <ActionIcon
            variant={showInstructions ? 'filled' : 'light'}
            onClick={onToggleInstructions}
            title="Ver instrucciones"
          >
            <IconEyeOff size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Group>
        <Select
          label="Modo de viaje"
          value={travelMode}
          data={[
            { value: 'DRIVING', label: 'Conduciendo' },
            { value: 'WALKING', label: 'Caminando' },
            { value: 'TRANSIT', label: 'Transporte público' },
            { value: 'BICYCLING', label: 'Bicicleta' },
          ]}
          w={150}
        />

        <Switch label="Optimizar waypoints" checked={optimizeWaypoints} size="sm" />

        <Switch label="Evitar autopistas" checked={avoidHighways} size="sm" />

        <Switch label="Evitar peajes" checked={avoidTolls} size="sm" />
      </Group>
    </Paper>
  );
};
