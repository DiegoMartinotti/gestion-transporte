// Componentes refactorizados para ImportProgress
import React from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Progress,
  Button,
  ActionIcon,
  RingProgress,
  Center,
  SimpleGrid,
  Card,
  ThemeIcon,
  Collapse,
  Alert,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconFileImport,
  IconTrendingUp,
  IconActivity,
} from '@tabler/icons-react';

export interface ProcessingStats {
  speed: number;
  successRate: number;
  estimatedCompletion: Date | null;
  elapsedTime: number;
}

// Utilidades separadas
export const calculateProcessingStats = (
  processed: number,
  total: number,
  startTime: Date,
  successRate: number
): ProcessingStats => {
  const now = new Date();
  const elapsedTime = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const speed = elapsedTime > 0 ? processed / elapsedTime : 0;

  const remaining = total - processed;
  const estimatedCompletion =
    speed > 0 ? new Date(now.getTime() + (remaining / speed) * 1000) : null;

  return {
    speed,
    successRate,
    estimatedCompletion,
    elapsedTime,
  };
};

export const getStatusColor = (errors: number, warnings: number): string => {
  if (errors > 0) return 'red';
  if (warnings > 0) return 'yellow';
  return 'green';
};

export const getStatusIcon = (errors: number, warnings: number) => {
  if (errors > 0) return <IconX size={14} />;
  if (warnings > 0) return <IconAlertTriangle size={14} />;
  return <IconCheck size={14} />;
};

// Componente principal de progreso
interface MainProgressProps {
  total: number;
  processed: number;
  errors: number;
  warnings: number;
  progress: number;
  isProcessing: boolean;
  currentBatch: number;
  totalBatches: number;
  onToggleDetails: () => void;
  showDetails: boolean;
}

export const MainProgressSection: React.FC<MainProgressProps> = ({
  total,
  processed,
  errors,
  warnings,
  progress,
  isProcessing,
  currentBatch,
  totalBatches,
  onToggleDetails,
  showDetails,
}) => (
  <Paper p="md" withBorder>
    <Stack gap="sm">
      <Group justify="space-between">
        <Group>
          <Text fw={500}>Progreso de importación</Text>
          <Badge
            color={getStatusColor(errors, warnings)}
            leftSection={getStatusIcon(errors, warnings)}
          >
            {processed} / {total}
          </Badge>
        </Group>
        <ActionIcon variant="light" onClick={onToggleDetails} size="sm">
          {showDetails ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </ActionIcon>
      </Group>

      <Progress
        value={progress}
        color={getStatusColor(errors, warnings)}
        size="lg"
        radius="md"
        striped={isProcessing}
        animated={isProcessing}
      />

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {Math.round(progress)}% completado
        </Text>
        {totalBatches > 1 && (
          <Text size="sm" c="dimmed">
            Lote {currentBatch} de {totalBatches}
          </Text>
        )}
      </Group>
    </Stack>
  </Paper>
);

// Componente de estadísticas circulares
interface StatsRingProps {
  successRate: number;
  processed: number;
  errors: number;
  warnings: number;
}

export const StatsRing: React.FC<StatsRingProps> = ({
  successRate,
  processed,
  errors,
  warnings,
}) => {
  const successful = processed - errors;

  return (
    <Center>
      <RingProgress
        size={120}
        thickness={12}
        roundCaps
        sections={[
          { value: successRate, color: 'green', tooltip: `${successful} exitosos` },
          { value: (errors / processed) * 100, color: 'red', tooltip: `${errors} errores` },
          {
            value: (warnings / processed) * 100,
            color: 'yellow',
            tooltip: `${warnings} advertencias`,
          },
        ]}
        label={
          <Text ta="center" fw={700} size="lg">
            {Math.round(successRate)}%
          </Text>
        }
      />
    </Center>
  );
};

// Componente de tarjetas de estadísticas
interface StatsCardsProps {
  stats: ProcessingStats;
  isProcessing: boolean;
  successful: number;
  errors: number;
  warnings: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  isProcessing: _isProcessing,
  successful,
  errors,
  warnings,
}) => (
  <SimpleGrid cols={4} spacing="sm">
    <Card withBorder p="xs">
      <Group gap="xs">
        <ThemeIcon color="green" size="sm" variant="light">
          <IconCheck size={14} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {successful}
          </Text>
          <Text size="xs" c="dimmed">
            Exitosos
          </Text>
        </div>
      </Group>
    </Card>

    <Card withBorder p="xs">
      <Group gap="xs">
        <ThemeIcon color="red" size="sm" variant="light">
          <IconX size={14} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {errors}
          </Text>
          <Text size="xs" c="dimmed">
            Errores
          </Text>
        </div>
      </Group>
    </Card>

    <Card withBorder p="xs">
      <Group gap="xs">
        <ThemeIcon color="yellow" size="sm" variant="light">
          <IconAlertTriangle size={14} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {warnings}
          </Text>
          <Text size="xs" c="dimmed">
            Advertencias
          </Text>
        </div>
      </Group>
    </Card>

    <Card withBorder p="xs">
      <Group gap="xs">
        <ThemeIcon color="blue" size="sm" variant="light">
          <IconTrendingUp size={14} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {Math.round(stats.speed)}/s
          </Text>
          <Text size="xs" c="dimmed">
            Velocidad
          </Text>
        </div>
      </Group>
    </Card>
  </SimpleGrid>
);

// Componente de información de tiempo
interface TimeInfoProps {
  stats: ProcessingStats;
  isProcessing: boolean;
}

export const TimeInfo: React.FC<TimeInfoProps> = ({ stats, isProcessing }) => (
  <Group justify="center" gap="xl">
    <Group gap="xs">
      <ThemeIcon color="gray" size="sm" variant="light">
        <IconActivity size={14} />
      </ThemeIcon>
      <div>
        <Text size="sm" fw={500}>
          {Math.floor(stats.elapsedTime / 60)}:
          {(stats.elapsedTime % 60).toString().padStart(2, '0')}
        </Text>
        <Text size="xs" c="dimmed">
          Transcurrido
        </Text>
      </div>
    </Group>

    {isProcessing && stats.estimatedCompletion && (
      <Group gap="xs">
        <ThemeIcon color="blue" size="sm" variant="light">
          <IconClock size={14} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {stats.estimatedCompletion.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Text>
          <Text size="xs" c="dimmed">
            Estimado
          </Text>
        </div>
      </Group>
    )}
  </Group>
);

// Componente de sección de detalles colapsable
interface DetailsCollapsedProps {
  showDetails: boolean;
  stats: ProcessingStats;
  isProcessing: boolean;
  successful: number;
  errors: number;
  warnings: number;
  successRate: number;
  processed: number;
}

export const DetailsCollapsed: React.FC<DetailsCollapsedProps> = ({
  showDetails,
  stats,
  isProcessing,
  successful,
  errors,
  warnings,
  successRate,
  processed,
}) => (
  <Collapse in={showDetails}>
    <Stack gap="md" mt="md">
      <Group justify="center">
        <StatsRing
          successRate={successRate}
          processed={processed}
          errors={errors}
          warnings={warnings}
        />
      </Group>

      <StatsCards
        stats={stats}
        isProcessing={isProcessing}
        successful={successful}
        errors={errors}
        warnings={warnings}
      />

      <TimeInfo stats={stats} isProcessing={isProcessing} />
    </Stack>
  </Collapse>
);

// Componente de alertas de estado
interface StatusAlertsProps {
  errors: number;
  warnings: number;
  onRetry?: () => void;
  isProcessing: boolean;
}

export const StatusAlerts: React.FC<StatusAlertsProps> = ({
  errors,
  warnings,
  onRetry,
  isProcessing,
}) => (
  <Stack gap="sm">
    {errors > 0 && (
      <Alert
        icon={<IconX size={16} />}
        color="red"
        variant="light"
        title={`${errors} error${errors !== 1 ? 'es' : ''} encontrado${errors !== 1 ? 's' : ''}`}
      >
        <Group justify="space-between" align="center">
          <span>
            Se encontraron errores durante el procesamiento. Revisa los detalles para más
            información.
          </span>
          {onRetry && !isProcessing && (
            <Button
              variant="light"
              color="red"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={onRetry}
            >
              Reintentar
            </Button>
          )}
        </Group>
      </Alert>
    )}

    {warnings > 0 && (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color="yellow"
        variant="light"
        title={`${warnings} advertencia${warnings !== 1 ? 's' : ''}`}
      >
        Se encontraron advertencias durante el procesamiento.
      </Alert>
    )}

    {isProcessing && (
      <Alert
        icon={<IconFileImport size={16} />}
        color="blue"
        variant="light"
        title="Procesando datos..."
      >
        La importación está en progreso. Por favor espera.
      </Alert>
    )}
  </Stack>
);
