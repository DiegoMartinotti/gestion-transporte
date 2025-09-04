import { Group, Card, Text, ActionIcon, Divider, Alert, Stack, Collapse } from '@mantine/core';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
} from '@tabler/icons-react';

interface RisksSectionProps {
  riesgos: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    vehiculoId?: string;
  }>;
  expanded: boolean;
  onToggle: () => void;
}

export function RisksSection({ riesgos, expanded, onToggle }: RisksSectionProps) {
  const getRiskColor = (tipo: 'warning' | 'error' | 'info') => {
    switch (tipo) {
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getRiskIcon = (tipo: 'warning' | 'error' | 'info') => {
    switch (tipo) {
      case 'error':
        return IconAlertTriangle;
      case 'warning':
        return IconAlertTriangle;
      case 'info':
        return IconInfoCircle;
      default:
        return IconInfoCircle;
    }
  };

  if (riesgos.length === 0) return null;

  return (
    <Card withBorder>
      <Group justify="space-between" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <Group>
          <IconAlertTriangle size={20} color="orange" />
          <div>
            <Text fw={500}>Riesgos y Alertas</Text>
            <Text size="sm" c="dimmed">
              {riesgos.length} elemento(s) detectado(s)
            </Text>
          </div>
        </Group>
        <ActionIcon variant="transparent">
          {expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Divider my="md" />
        <Stack gap="xs">
          {riesgos.map((riesgo, index) => {
            const RiskIcon = getRiskIcon(riesgo.tipo);
            return (
              <Alert
                key={index}
                icon={<RiskIcon size={16} />}
                color={getRiskColor(riesgo.tipo)}
                variant="light"
              >
                {riesgo.mensaje}
              </Alert>
            );
          })}
        </Stack>
      </Collapse>
    </Card>
  );
}
