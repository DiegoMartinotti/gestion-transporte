import React from 'react';
import { Alert, Grid } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { ExpirationStatistics } from './ExpirationStatistics';
import { ExpirationAlerts } from './ExpirationAlerts';
import { ExpirationCalendar } from './ExpirationCalendar';
import { ExpirationConfigModal } from './ExpirationConfigModal';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';
import { ENTITY_TYPE_VEHICULO, ENTITY_TYPE_PERSONAL } from '../helpers/expirationHelpers';

interface ExpirationMainContentProps {
  mapRef: React.RefObject<HTMLDivElement>;
  selectedTab: string;
  selectedDate: Date | null;
  filtroEntidad: string;
  filtroEstado: string;
  tempConfig: ExpirationConfig;
  configModalOpened: boolean;
  setSelectedDate: (date: Date | null) => void;
  setTempConfig: React.Dispatch<React.SetStateAction<ExpirationConfig>>;
  closeConfigModal: () => void;
  effectiveConfig: ExpirationConfig;
  documentosFiltrados: DocumentoVencimiento[];
  estadisticas: {
    vencidos: number;
    criticos: number;
    proximos: number;
    vigentes: number;
  };
  documentosPorFecha: Record<string, DocumentoVencimiento[]>;
  onEditEntity?: (
    entidadId: string,
    entidadTipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL
  ) => void;
  onConfigSave: () => void;
  error?: string;
}

export const ExpirationMainContent: React.FC<ExpirationMainContentProps> = ({
  selectedTab,
  selectedDate,
  tempConfig,
  configModalOpened,
  setSelectedDate,
  setTempConfig,
  closeConfigModal,
  effectiveConfig,
  documentosFiltrados,
  estadisticas,
  documentosPorFecha,
  onEditEntity,
  onConfigSave,
  error,
}) => {
  return (
    <>
      <ExpirationStatistics estadisticas={estadisticas} config={effectiveConfig} />

      {error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          {error}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={12}>
          {selectedTab === 'alerts' && (
            <ExpirationAlerts
              documentosFiltrados={documentosFiltrados}
              estadisticas={estadisticas}
              config={effectiveConfig}
              onEditEntity={onEditEntity}
            />
          )}

          {selectedTab === 'calendar' && (
            <ExpirationCalendar
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              documentosPorFecha={documentosPorFecha}
              config={effectiveConfig}
            />
          )}
        </Grid.Col>
      </Grid>

      <ExpirationConfigModal
        opened={configModalOpened}
        onClose={closeConfigModal}
        tempConfig={tempConfig}
        onTempConfigChange={setTempConfig}
        onSave={onConfigSave}
      />
    </>
  );
};
