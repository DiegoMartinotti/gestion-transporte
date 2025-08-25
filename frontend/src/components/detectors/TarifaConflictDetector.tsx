import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Alert,
  Group,
  Stack,
  Table,
  Badge,
  Button,
  ActionIcon,
  Text,
  Card,
  Timeline,
  Modal,
  Select,
  Grid,
  Divider,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconEye,
  IconCalendar,
  IconExclamationMark,
  IconInfoCircle,
} from '@tabler/icons-react';
import { detectConflicts, TarifaConflict, TarifaVersion } from '../../services/tarifaService';

interface TarifaConflictDetectorProps {
  tramoId: string;
  versions: TarifaVersion[];
  newVersion?: Partial<TarifaVersion>;
  onConflictResolved?: (resolution: ConflictResolution) => void;
}

interface ConflictResolution {
  conflictId: string;
  action: 'adjust_dates' | 'deactivate_overlapping' | 'create_gap' | 'ignore';
  parameters?: {
    newStartDate?: string;
    newEndDate?: string;
    versionsToDeactivate?: string[];
  };
}

// Funciones auxiliares extraídas
const getConflictSeverity = (conflict: TarifaConflict) => {
  switch (conflict.tipo) {
    case 'superposicion':
      return { color: 'red', icon: IconAlertTriangle, label: 'Critico' };
    case 'gap':
      return { color: 'orange', icon: IconExclamationMark, label: 'Advertencia' };
    case 'duplicado':
      return { color: 'yellow', icon: IconInfoCircle, label: 'Información' };
    default:
      return { color: 'gray', icon: IconInfoCircle, label: 'Desconocido' };
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR');
};

const getConflictDescription = (conflict: TarifaConflict) => {
  switch (conflict.tipo) {
    case 'superposicion':
      return 'Las fechas de vigencia se superponen con otras versiones activas';
    case 'gap':
      return 'Existe un período sin tarifas vigentes entre versiones';
    case 'duplicado':
      return 'Ya existe una versión con las mismas fechas de vigencia';
    default:
      return conflict.mensaje;
  }
};

// Subcomponente para las tarjetas de resumen
interface ConflictSummaryCardsProps {
  conflicts: TarifaConflict[];
}

const ConflictSummaryCards: React.FC<ConflictSummaryCardsProps> = ({ conflicts }) => (
  <Grid mb="md">
    <Grid.Col span={4}>
      <Card withBorder p="sm" bg="red.0">
        <Group gap="xs">
          <IconAlertTriangle size={16} color="red" />
          <div>
            <Text fw={500} size="sm">
              Críticos
            </Text>
            <Text size="xs" c="dimmed">
              {conflicts.filter((c) => c.tipo === 'superposicion').length}
            </Text>
          </div>
        </Group>
      </Card>
    </Grid.Col>
    <Grid.Col span={4}>
      <Card withBorder p="sm" bg="orange.0">
        <Group gap="xs">
          <IconExclamationMark size={16} color="orange" />
          <div>
            <Text fw={500} size="sm">
              Advertencias
            </Text>
            <Text size="xs" c="dimmed">
              {conflicts.filter((c) => c.tipo === 'gap').length}
            </Text>
          </div>
        </Group>
      </Card>
    </Grid.Col>
    <Grid.Col span={4}>
      <Card withBorder p="sm" bg="yellow.0">
        <Group gap="xs">
          <IconInfoCircle size={16} color="yellow" />
          <div>
            <Text fw={500} size="sm">
              Información
            </Text>
            <Text size="xs" c="dimmed">
              {conflicts.filter((c) => c.tipo === 'duplicado').length}
            </Text>
          </div>
        </Group>
      </Card>
    </Grid.Col>
  </Grid>
);

// Subcomponente para la lista de conflictos
interface ConflictListProps {
  conflicts: TarifaConflict[];
  onResolveConflict: (conflict: TarifaConflict) => void;
}

const ConflictList: React.FC<ConflictListProps> = ({ conflicts, onResolveConflict }) => (
  <Stack gap="sm">
    {conflicts.map((conflict, index) => {
      const severity = getConflictSeverity(conflict);
      const SeverityIcon = severity.icon;

      return (
        <Alert key={index} color={severity.color} icon={<SeverityIcon size={16} />} variant="light">
          <Group justify="space-between">
            <div>
              <Text fw={500} size="sm">
                {conflict.tipo.toUpperCase()}: {getConflictDescription(conflict)}
              </Text>
              <Text size="xs" c="dimmed">
                Período: {formatDate(conflict.fechaInicio)}
                {conflict.fechaFin && ` - ${formatDate(conflict.fechaFin)}`}
              </Text>
              <Text size="xs" c="dimmed">
                Versiones afectadas: {conflict.versionesAfectadas.length}
              </Text>
            </div>
            <Group gap="xs">
              <ActionIcon variant="light" color="blue" onClick={() => onResolveConflict(conflict)}>
                <IconEye size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Alert>
      );
    })}
  </Stack>
);

// Subcomponente para el timeline
interface ConflictTimelineProps {
  conflicts: TarifaConflict[];
}

const ConflictTimeline: React.FC<ConflictTimelineProps> = ({ conflicts }) => (
  <Card withBorder mt="md">
    <Title order={6} mb="md">
      <Group gap="xs">
        <IconCalendar size={16} />
        Timeline de Conflictos
      </Group>
    </Title>

    <Timeline>
      {conflicts
        .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
        .map((conflict, index) => {
          const severity = getConflictSeverity(conflict);
          const SeverityIcon = severity.icon;

          return (
            <Timeline.Item key={index} bullet={<SeverityIcon size={12} />} color={severity.color}>
              <Text fw={500} size="sm">
                {conflict.tipo.toUpperCase()}
              </Text>
              <Text size="xs" c="dimmed">
                {formatDate(conflict.fechaInicio)}
                {conflict.fechaFin && ` - ${formatDate(conflict.fechaFin)}`}
              </Text>
              <Text size="xs">{conflict.mensaje}</Text>
            </Timeline.Item>
          );
        })}
    </Timeline>
  </Card>
);

// Subcomponente para el modal de resolución
interface ConflictResolutionModalProps {
  opened: boolean;
  onClose: () => void;
  selectedConflict: TarifaConflict | null;
  resolutionAction: ConflictResolution['action'];
  onActionChange: (action: ConflictResolution['action']) => void;
  versions: TarifaVersion[];
  onApply: () => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  opened,
  onClose,
  selectedConflict,
  resolutionAction,
  onActionChange,
  versions,
  onApply,
}) => (
  <Modal opened={opened} onClose={onClose} title="Resolver Conflicto" size="md">
    {selectedConflict && (
      <Stack gap="md">
        <Alert color="red" icon={<IconAlertTriangle size={16} />}>
          <Text fw={500}>{selectedConflict.tipo.toUpperCase()}</Text>
          <Text size="sm">{selectedConflict.mensaje}</Text>
          <Text size="xs" c="dimmed">
            Período: {formatDate(selectedConflict.fechaInicio)}
            {selectedConflict.fechaFin && ` - ${formatDate(selectedConflict.fechaFin)}`}
          </Text>
        </Alert>

        <Select
          label="Acción de Resolución"
          value={resolutionAction}
          onChange={(value) => onActionChange(value as ConflictResolution['action'])}
          data={[
            {
              value: 'adjust_dates',
              label: 'Ajustar fechas automáticamente',
            },
            {
              value: 'deactivate_overlapping',
              label: 'Desactivar versiones en conflicto',
            },
            {
              value: 'create_gap',
              label: 'Crear período de transición',
            },
            {
              value: 'ignore',
              label: 'Ignorar conflicto (no recomendado)',
            },
          ]}
        />

        <Divider />

        <Text size="sm" c="dimmed">
          <strong>Versiones afectadas:</strong>
        </Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Versión</Table.Th>
              <Table.Th>Fechas</Table.Th>
              <Table.Th>Estado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {selectedConflict.versionesAfectadas.map((versionId) => {
              const version = versions.find((v) => v._id === versionId);
              if (!version) return null;

              return (
                <Table.Tr key={versionId}>
                  <Table.Td>v{version.version}</Table.Td>
                  <Table.Td>
                    <Text size="xs">
                      {formatDate(version.fechaVigenciaInicio)}
                      {version.fechaVigenciaFin && ` - ${formatDate(version.fechaVigenciaFin)}`}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={version.activa ? 'green' : 'gray'}>
                      {version.activa ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="red" onClick={onApply}>
            Aplicar Resolución
          </Button>
        </Group>
      </Stack>
    )}
  </Modal>
);

// Componente principal refactorizado
export const TarifaConflictDetector: React.FC<TarifaConflictDetectorProps> = ({
  tramoId,
  versions,
  newVersion,
  onConflictResolved,
}) => {
  const [conflicts, setConflicts] = useState<TarifaConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<TarifaConflict | null>(null);
  const [resolutionModal, setResolutionModal] = useState(false);
  const [resolutionAction, setResolutionAction] =
    useState<ConflictResolution['action']>('adjust_dates');

  // Detectar conflictos cuando cambie la nueva versión
  useEffect(() => {
    if (newVersion && newVersion.fechaVigenciaInicio) {
      detectConflicts(tramoId, newVersion).then(setConflicts);
    }
  }, [tramoId, newVersion]);

  const handleResolveConflict = (conflict: TarifaConflict) => {
    setSelectedConflict(conflict);
    setResolutionModal(true);
  };

  const applyResolution = () => {
    if (!selectedConflict) return;

    const resolution: ConflictResolution = {
      conflictId: selectedConflict.tipo + '_' + selectedConflict.fechaInicio,
      action: resolutionAction,
      parameters: {},
    };

    onConflictResolved?.(resolution);
    setResolutionModal(false);
    setSelectedConflict(null);
  };

  if (conflicts.length === 0) {
    return (
      <Alert color="green" icon={<IconCheck size={16} />}>
        <Text>No se detectaron conflictos en las fechas de vigencia</Text>
      </Alert>
    );
  }

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={5}>
          <Group gap="xs">
            <IconAlertTriangle size={20} color="red" />
            Conflictos Detectados ({conflicts.length})
          </Group>
        </Title>
      </Group>

      <ConflictSummaryCards conflicts={conflicts} />
      <ConflictList conflicts={conflicts} onResolveConflict={handleResolveConflict} />
      <ConflictTimeline conflicts={conflicts} />

      <ConflictResolutionModal
        opened={resolutionModal}
        onClose={() => setResolutionModal(false)}
        selectedConflict={selectedConflict}
        resolutionAction={resolutionAction}
        onActionChange={setResolutionAction}
        versions={versions}
        onApply={applyResolution}
      />
    </Paper>
  );
};
