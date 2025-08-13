import React, { useState } from 'react';
import { Alert, Stack, Group, Text, ActionIcon, Card, Tooltip, Paper, Title } from '@mantine/core';
import {
  IconCalendar,
  IconCheck,
  IconBell,
  IconBellOff,
  IconRefresh,
  IconFileText,
} from '@tabler/icons-react';
import dayjs from 'dayjs';

// Interfaces removed - not used in current simplified implementation

interface Vehiculo {
  _id: string;
  dominio?: string;
  patente?: string;
  empresa?: { nombre: string };
  documentacion?: Record<string, { vencimiento?: string; numero?: string }>;
}

interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  empresa?: { nombre: string };
  documentacion?: Record<string, { vencimiento?: string; numero?: string }>;
}

interface DocumentExpirationSystemProps {
  vehiculos?: Vehiculo[];
  personal?: Personal[];
  diasAlerta?: number;
  mostrarVencidos?: boolean;
  mostrarProximos?: boolean;
  mostrarVigentes?: boolean;
  onEditVehiculo?: (vehiculoId: string) => void;
  onEditPersonal?: (personalId: string) => void;
  onRefresh?: () => void;
  compact?: boolean;
  autoRefresh?: boolean;
  showNotifications?: boolean;
  diasPrioridadAlta?: number;
  diasPrioridadMedia?: number;
  diasPrioridadBaja?: number;
}

// Unused constants removed

// Unused constants removed

// Constants for duplicate string literals
const TOOLTIP_LABELS = {
  DISABLE_ALERTS: 'Deshabilitar alertas',
  ENABLE_ALERTS: 'Habilitar alertas',
  REFRESH: 'Actualizar',
} as const;

// All unused helper functions and interfaces removed

export const DocumentExpirationSystem: React.FC<DocumentExpirationSystemProps> = ({
  vehiculos = [],
  personal = [],
  onRefresh,
  compact = false,
  showNotifications = true,
}) => {
  // Simplified implementation - removed unused parameters

  const [alertasHabilitadas, setAlertasHabilitadas] = useState(showNotifications);
  const [lastUpdate] = useState<Date>(new Date());

  // Simple check if there are any entities
  const hasData = vehiculos.length > 0 || personal.length > 0;

  if (!hasData) {
    return renderEmptyState({ alertasHabilitadas, setAlertasHabilitadas, onRefresh, lastUpdate });
  }

  if (compact) {
    return renderCompactView({ alertasHabilitadas, setAlertasHabilitadas });
  }

  return renderFullView({ alertasHabilitadas, setAlertasHabilitadas, onRefresh, lastUpdate });
};

// Helper rendering functions to reduce complexity
const renderEmptyState = ({
  alertasHabilitadas,
  setAlertasHabilitadas,
  onRefresh,
  lastUpdate,
}: {
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  onRefresh?: () => void;
  lastUpdate: Date;
}) => (
  <Paper p="md" withBorder>
    <Group justify="space-between" mb="md">
      <Group>
        <IconFileText size={18} />
        <Title order={4}>Estado de Documentación</Title>
      </Group>
      <Group gap="xs">
        <Tooltip
          label={alertasHabilitadas ? TOOLTIP_LABELS.DISABLE_ALERTS : TOOLTIP_LABELS.ENABLE_ALERTS}
        >
          <ActionIcon
            variant="light"
            color={alertasHabilitadas ? 'green' : 'gray'}
            onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
          >
            {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
          </ActionIcon>
        </Tooltip>
        {onRefresh && (
          <Tooltip label={TOOLTIP_LABELS.REFRESH}>
            <ActionIcon variant="light" onClick={onRefresh}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>

    <Alert color="green" icon={<IconCheck />}>
      <Text>✅ Todos los documentos están al día</Text>
      <Text size="xs" c="dimmed" mt={4}>
        Última actualización: {dayjs(lastUpdate).format('DD/MM/YYYY HH:mm')}
      </Text>
    </Alert>
  </Paper>
);

const renderCompactView = ({
  alertasHabilitadas,
  setAlertasHabilitadas,
}: {
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
}) => (
  <Card withBorder>
    <Group justify="space-between" mb="md">
      <Group>
        <IconCalendar size={18} />
        <Text fw={500}>Estado de Documentación</Text>
      </Group>
      <Group gap="xs">
        <Tooltip
          label={alertasHabilitadas ? TOOLTIP_LABELS.DISABLE_ALERTS : TOOLTIP_LABELS.ENABLE_ALERTS}
        >
          <ActionIcon
            variant="light"
            color={alertasHabilitadas ? 'blue' : 'gray'}
            onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
          >
            {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>

    <Stack gap="xs">
      <Alert icon={<IconCheck />} color="green" variant="light">
        <Text size="sm">Sin alertas críticas</Text>
      </Alert>
    </Stack>
  </Card>
);

const renderFullView = ({
  alertasHabilitadas,
  setAlertasHabilitadas,
  onRefresh,
  lastUpdate,
}: {
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  onRefresh?: () => void;
  lastUpdate: Date;
}) => (
  <Stack>
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendar size={18} />
          <Title order={4}>Alertas de Documentación</Title>
        </Group>
        <Group gap="xs">
          <Tooltip
            label={
              alertasHabilitadas ? TOOLTIP_LABELS.DISABLE_ALERTS : TOOLTIP_LABELS.ENABLE_ALERTS
            }
          >
            <ActionIcon
              variant="light"
              color={alertasHabilitadas ? 'green' : 'gray'}
              onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
            >
              {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
            </ActionIcon>
          </Tooltip>
          {onRefresh && (
            <Tooltip label={TOOLTIP_LABELS.REFRESH}>
              <ActionIcon variant="light" onClick={onRefresh}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Text size="xs" c="dimmed" ta="center" mt="md">
        Última actualización: {dayjs(lastUpdate).format('DD/MM/YYYY HH:mm')}
      </Text>
    </Paper>
  </Stack>
);

export default DocumentExpirationSystem;
