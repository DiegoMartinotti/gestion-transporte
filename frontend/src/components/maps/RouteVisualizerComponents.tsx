import React from 'react';
import {
  Stack,
  Group,
  Text,
  Select,
  Paper,
  Badge,
  Card,
  ActionIcon,
  Switch,
  Divider,
  Grid,
  ScrollArea,
} from '@mantine/core';
import { IconEyeOff, IconClock, IconRoad } from '@tabler/icons-react';

interface RouteStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  instructions: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  travel_mode: string;
}

interface RouteResult {
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

// Componentes auxiliares para reducir complejidad
export const RouteControls: React.FC<{
  travelMode: string;
  avoidHighways: boolean;
  avoidTolls: boolean;
  optimizeWaypoints: boolean;
  showAlternatives: boolean;
  showTraffic: boolean;
  showInstructions: boolean;
  toggleTrafficLayer: () => void;
  setShowInstructions: (value: boolean) => void;
}> = ({
  travelMode,
  avoidHighways,
  avoidTolls,
  optimizeWaypoints,
  showAlternatives,
  showTraffic,
  showInstructions,
  toggleTrafficLayer,
  setShowInstructions,
}) => (
  <Paper p="md" withBorder>
    <Grid>
      <Grid.Col span={6}>
        <Stack gap="sm">
          <Select
            label="Modo de viaje"
            data={[
              { value: 'DRIVING', label: 'Conduciendo' },
              { value: 'WALKING', label: 'Caminando' },
              { value: 'TRANSIT', label: 'Transporte público' },
              { value: 'BICYCLING', label: 'Bicicleta' },
            ]}
            value={travelMode}
            onChange={() => {
              /* Placeholder - functionality not implemented */
            }}
          />

          <Group>
            <Switch
              label="Evitar autopistas"
              checked={avoidHighways}
              onChange={() => {
                /* Placeholder - functionality not implemented */
              }}
            />
            <Switch
              label="Evitar peajes"
              checked={avoidTolls}
              onChange={() => {
                /* Placeholder - functionality not implemented */
              }}
            />
          </Group>
        </Stack>
      </Grid.Col>

      <Grid.Col span={6}>
        <Stack gap="sm">
          <Group>
            <Switch
              label="Optimizar waypoints"
              checked={optimizeWaypoints}
              onChange={() => {
                /* Placeholder - functionality not implemented */
              }}
            />
            <Switch
              label="Rutas alternativas"
              checked={showAlternatives}
              onChange={() => {
                /* Placeholder - functionality not implemented */
              }}
            />
          </Group>

          <Group>
            <Switch label="Mostrar tráfico" checked={showTraffic} onChange={toggleTrafficLayer} />
            <Switch
              label="Mostrar instrucciones"
              checked={showInstructions}
              onChange={(e) => setShowInstructions(e.currentTarget.checked)}
            />
          </Group>
        </Stack>
      </Grid.Col>
    </Grid>
  </Paper>
);

export const RouteInstructions: React.FC<{
  route: RouteResult;
  height: number;
  onClose: () => void;
}> = ({ route, height, onClose }) => {
  const totalDistance = route.legs.reduce((acc, leg) => acc + leg.distance.value, 0);
  const totalDuration = route.legs.reduce((acc, leg) => acc + leg.duration.value, 0);

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600}>Instrucciones</Text>
          <ActionIcon variant="subtle" onClick={onClose}>
            <IconEyeOff size={16} />
          </ActionIcon>
        </Group>

        {/* Resumen de la ruta */}
        <Card withBorder bg="blue.0">
          <Stack gap="xs">
            <Group justify="space-between">
              <Group>
                <IconRoad size={16} />
                <Text size="sm" fw={500}>
                  Distancia total
                </Text>
              </Group>
              <Text fw={600}>{(totalDistance / 1000).toFixed(1)} km</Text>
            </Group>

            <Group justify="space-between">
              <Group>
                <IconClock size={16} />
                <Text size="sm" fw={500}>
                  Tiempo estimado
                </Text>
              </Group>
              <Text fw={600}>{Math.round(totalDuration / 60)} min</Text>
            </Group>
          </Stack>
        </Card>

        {/* Pasos de la ruta */}
        <ScrollArea h={height - 200}>
          <Stack gap="sm">
            {route.legs.map((leg, legIndex) => (
              <div key={legIndex}>
                {legIndex > 0 && <Divider />}
                {leg.steps.map((step, stepIndex) => (
                  <Card key={stepIndex} p="sm" withBorder>
                    <Stack gap="xs">
                      <Text
                        size="sm"
                        dangerouslySetInnerHTML={{
                          __html: step.instructions.replace(/<[^>]*>/g, ''),
                        }}
                      />
                      <Group justify="space-between">
                        <Badge variant="light" size="sm">
                          {step.distance.text}
                        </Badge>
                        <Badge variant="light" size="sm" color="orange">
                          {step.duration.text}
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </div>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    </Paper>
  );
};

export const AlternativeRoutes: React.FC<{
  alternativeRoutes: RouteResult[];
}> = ({ alternativeRoutes }) => (
  <Paper p="md" withBorder>
    <Stack gap="md">
      <Text fw={600}>Rutas Alternativas</Text>
      <Grid>
        {alternativeRoutes.map((altRoute, index) => (
          <Grid.Col key={index} span={4}>
            <Card withBorder>
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  Ruta {index + 2}
                </Text>
                <Group justify="space-between">
                  <Text size="xs">
                    {(
                      altRoute.legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1000
                    ).toFixed(1)}{' '}
                    km
                  </Text>
                  <Text size="xs">
                    {Math.round(
                      altRoute.legs.reduce((acc, leg) => acc + leg.duration.value, 0) / 60
                    )}{' '}
                    min
                  </Text>
                </Group>
                {altRoute.summary && (
                  <Text size="xs" c="dimmed">
                    {altRoute.summary}
                  </Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  </Paper>
);
