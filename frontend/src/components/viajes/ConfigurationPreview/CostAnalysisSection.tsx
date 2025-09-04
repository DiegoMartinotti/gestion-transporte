import {
  Group,
  Card,
  Text,
  ActionIcon,
  Divider,
  Grid,
  Stack,
  Collapse,
  NumberFormatter,
} from '@mantine/core';
import {
  IconCurrencyDollar,
  IconChevronDown,
  IconChevronUp,
  IconRoute,
  IconGasStation,
  IconClock,
} from '@tabler/icons-react';

interface CostAnalysisSectionProps {
  summary: {
    totalCamiones: number;
    costoEstimado: number;
  };
  viajeData?: {
    distanciaTotal?: number;
  };
  expanded: boolean;
  onToggle: () => void;
}

export function CostAnalysisSection({
  summary,
  viajeData,
  expanded,
  onToggle,
}: CostAnalysisSectionProps) {
  return (
    <Card withBorder>
      <Group justify="space-between" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <Group>
          <IconCurrencyDollar size={20} />
          <div>
            <Text fw={500}>Análisis de Costos</Text>
            <Text size="sm" c="dimmed">
              Estimación de costos del viaje
            </Text>
          </div>
        </Group>
        <ActionIcon variant="transparent">
          {expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Divider my="md" />
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Costo Base</Text>
                <Text size="sm" fw={500}>
                  <NumberFormatter
                    value={summary.totalCamiones * 50000}
                    prefix="$"
                    thousandSeparator
                  />
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Costo por Distancia</Text>
                <Text size="sm" fw={500}>
                  <NumberFormatter
                    value={(viajeData?.distanciaTotal || 0) * 150 * summary.totalCamiones}
                    prefix="$"
                    thousandSeparator
                  />
                </Text>
              </Group>
              <Divider />
              <Group justify="space-between">
                <Text fw={500}>Total Estimado</Text>
                <Text fw={600} c="blue">
                  <NumberFormatter value={summary.costoEstimado} prefix="$" thousandSeparator />
                </Text>
              </Group>
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap="xs">
              <Group>
                <IconRoute size={16} />
                <Text size="sm">{viajeData?.distanciaTotal || 0} km total</Text>
              </Group>
              <Group>
                <IconGasStation size={16} />
                <Text size="sm">
                  Combustible estimado: {Math.round((viajeData?.distanciaTotal || 0) * 0.35)} L
                </Text>
              </Group>
              <Group>
                <IconClock size={16} />
                <Text size="sm">
                  Tiempo estimado: {Math.round((viajeData?.distanciaTotal || 0) / 80)} horas
                </Text>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Collapse>
    </Card>
  );
}
