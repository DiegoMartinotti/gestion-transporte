import React from 'react';
import { Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { DocumentStats } from './hooks/useDocumentStats';

interface AlertsSectionProps {
  stats: DocumentStats;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ stats }) => {
  return (
    <>
      {/* Alerts for critical issues */}
      {stats.expired > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="Documentos Vencidos" color="red">
          Hay {stats.expired} documento{stats.expired > 1 ? 's' : ''} vencido
          {stats.expired > 1 ? 's' : ''} que requieren atención inmediata.
        </Alert>
      )}

      {stats.expiring > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="Documentos Por Vencer" color="yellow">
          Hay {stats.expiring} documento{stats.expiring > 1 ? 's' : ''} que vence
          {stats.expiring > 1 ? 'n' : ''} en los próximos 30 días.
        </Alert>
      )}
    </>
  );
};
