import React from 'react';
import { Alert, Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { ImportStats } from '../ExcelImportProgress';

interface StatusAlertsProps {
  hasErrors: boolean;
  isCompleted: boolean;
  stats: ImportStats;
  elapsedTime: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const StatusAlerts: React.FC<StatusAlertsProps> = ({
  hasErrors,
  isCompleted,
  stats,
  elapsedTime,
}) => {
  if (hasErrors) {
    return (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color="red"
        title="Se encontraron errores durante la importación"
      >
        <Text size="sm">
          Algunos pasos fallaron durante el proceso de importación. Revisa los detalles de cada paso
          y usa el botón &quot;Reintentar&quot; para continuar.
        </Text>
      </Alert>
    );
  }

  if (isCompleted && !hasErrors) {
    return (
      <Alert
        icon={<IconCheck size={16} />}
        color="green"
        title="Importación completada exitosamente"
      >
        <Text size="sm">
          Se importaron {stats.successfulRecords} registros correctamente en{' '}
          {formatTime(elapsedTime)}.
          {stats.skippedRecords > 0 && ` Se omitieron ${stats.skippedRecords} registros.`}
        </Text>
      </Alert>
    );
  }

  return null;
};
