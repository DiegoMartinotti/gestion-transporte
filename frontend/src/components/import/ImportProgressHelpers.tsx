import React from 'react';
import { Text, Alert, Timeline, Group, Button } from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDatabase,
  IconListCheck,
  IconRefresh,
} from '@tabler/icons-react';

export const getStatusColor = (errors: number, warnings: number): string => {
  if (errors > 0) return 'red';
  if (warnings > 0) return 'yellow';
  return 'green';
};

export const getStatusIcon = (errors: number, warnings: number): React.ReactNode => {
  if (errors > 0) return <IconX size={16} />;
  if (warnings > 0) return <IconAlertCircle size={16} />;
  return <IconCheck size={16} />;
};

interface ProcessTimelineProps {
  total: number;
  startTime: Date;
  currentBatch: number;
  totalBatches: number;
  warnings: number;
  errors: number;
  isProcessing: boolean;
  processed: number;
  elapsedTime: number;
}

export const ProcessTimeline: React.FC<ProcessTimelineProps> = ({
  total,
  startTime,
  currentBatch,
  totalBatches,
  warnings,
  errors,
  isProcessing,
  processed,
  elapsedTime,
}) => (
  <Timeline active={-1} bulletSize={24} lineWidth={2}>
    <Timeline.Item bullet={<IconDatabase size={12} />} title="Inicio del proceso">
      <Text c="dimmed" size="sm">
        {startTime.toLocaleTimeString()} - Iniciando importación de {total} registros
      </Text>
    </Timeline.Item>

    {currentBatch > 1 && (
      <Timeline.Item
        bullet={<IconListCheck size={12} />}
        title={`Lotes procesados: ${currentBatch - 1}`}
      >
        <Text c="dimmed" size="sm">
          Completados {(currentBatch - 1) * Math.floor(total / totalBatches)} registros
        </Text>
      </Timeline.Item>
    )}

    {warnings > 0 && (
      <Timeline.Item
        bullet={<IconAlertCircle size={12} />}
        title="Advertencias detectadas"
        c="yellow"
      >
        <Text c="dimmed" size="sm">
          Se encontraron {warnings} advertencias durante el proceso
        </Text>
      </Timeline.Item>
    )}

    {errors > 0 && (
      <Timeline.Item bullet={<IconX size={12} />} title="Errores encontrados" c="red">
        <Text c="dimmed" size="sm">
          {errors} registros no pudieron ser importados
        </Text>
      </Timeline.Item>
    )}

    {!isProcessing && processed === total && (
      <Timeline.Item bullet={<IconCheck size={12} />} title="Proceso completado" c="green">
        <Text c="dimmed" size="sm">
          Importación finalizada en {Math.floor(elapsedTime / 60)}m {Math.floor(elapsedTime % 60)}s
        </Text>
      </Timeline.Item>
    )}
  </Timeline>
);

interface StatusAlertsProps {
  errors: number;
  warnings: number;
  processed: number;
  total: number;
  isProcessing: boolean;
  onRetry?: () => void;
}

const renderErrorAlert = (errors: number, onRetry?: () => void) => (
  <Alert icon={<IconAlertCircle size={16} />} title="Errores en la importación" color="red">
    <Text size="sm" mb="sm">
      Se encontraron {errors} errores durante la importación. Puede revisar el detalle de los
      errores y corregirlos manualmente.
    </Text>

    {onRetry && (
      <Group>
        <Button
          size="sm"
          variant="light"
          c="red"
          leftSection={<IconRefresh size={16} />}
          onClick={onRetry}
        >
          Reintentar importación
        </Button>
      </Group>
    )}
  </Alert>
);

const renderWarningAlert = (warnings: number) => (
  <Alert
    icon={<IconAlertCircle size={16} />}
    title="Importación completada con advertencias"
    color="yellow"
  >
    <Text size="sm">
      La importación se completó exitosamente, pero se encontraron {warnings} advertencias. Los
      registros fueron importados pero podrían requerir revisión.
    </Text>
  </Alert>
);

const renderSuccessAlert = () => (
  <Alert icon={<IconCheck size={16} />} title="Importación exitosa" color="green">
    <Text size="sm">
      Todos los registros fueron importados correctamente sin errores ni advertencias.
    </Text>
  </Alert>
);

export const StatusAlerts: React.FC<StatusAlertsProps> = ({
  errors,
  warnings,
  processed,
  total,
  isProcessing,
  onRetry,
}) => {
  if (errors > 0 && !isProcessing) {
    return renderErrorAlert(errors, onRetry);
  }

  if (warnings > 0 && errors === 0 && !isProcessing) {
    return renderWarningAlert(warnings);
  }

  if (processed === total && errors === 0 && warnings === 0 && !isProcessing) {
    return renderSuccessAlert();
  }

  return null;
};

export const formatElapsedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};
