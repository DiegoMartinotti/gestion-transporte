import React from 'react';
import { Card, Group, Text, Badge, Stack, Alert } from '@mantine/core';
import { IconCalendar, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ExpirationStatistics } from '../components/ExpirationStatistics';
import { ExpirationAlerts } from '../components/ExpirationAlerts';
import { ExpirationCalendar } from '../components/ExpirationCalendar';
import { ExpirationFullView } from '../components/ExpirationFullView';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';
import { ENTITY_TYPE_VEHICULO, ENTITY_TYPE_PERSONAL } from '../helpers/expirationHelpers';

interface UseExpirationRendererProps {
  selectedTab: string;
  selectedDate: Date | null;
  filtroEntidad: string;
  filtroEstado: string;
  tempConfig: ExpirationConfig;
  configModalOpened: boolean;
  setSelectedTab: (tab: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setFiltroEntidad: (filtro: string) => void;
  setFiltroEstado: (filtro: string) => void;
  setTempConfig: React.Dispatch<React.SetStateAction<ExpirationConfig>>;
  openConfigModal: () => void;
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
  onRefresh?: () => void;
  onConfigChange?: (config: ExpirationConfig) => void;
  loading?: boolean;
  error?: string;
}

// Helper para obtener color del badge basado en estadísticas
const getBadgeColor = (estadisticas: { vencidos: number; criticos: number }) => {
  if (estadisticas.vencidos > 0) return 'red';
  if (estadisticas.criticos > 0) return 'orange';
  return 'green';
};

// Helper para manejar configuración guardada
const createConfigSaveHandler =
  (
    tempConfig: ExpirationConfig,
    onConfigChange: ((config: ExpirationConfig) => void) | undefined,
    closeConfigModal: () => void
  ) =>
  () => {
    onConfigChange?.(tempConfig);
    closeConfigModal();

    notifications.show({
      title: 'Configuración Guardada',
      message: 'La configuración de vencimientos se ha actualizado',
      color: 'green',
    });
  };

// Helper para renderizar vista compacta
const createCompactView = (estadisticas: { vencidos: number; criticos: number }) => {
  const CompactView = () => (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendar size={18} />
          <Text fw={500}>Vencimientos</Text>
        </Group>
        <Badge color={getBadgeColor(estadisticas)}>
          {estadisticas.vencidos + estadisticas.criticos} alertas
        </Badge>
      </Group>

      {estadisticas.vencidos > 0 && (
        <Alert icon={<IconX />} color="red" variant="light">
          <Text size="sm">
            {estadisticas.vencidos} vencido{estadisticas.vencidos > 1 ? 's' : ''}
          </Text>
        </Alert>
      )}
    </Card>
  );

  CompactView.displayName = 'CompactView';
  return CompactView;
};

export const useExpirationRenderer = (props: UseExpirationRendererProps) => {
  const {
    tempConfig,
    closeConfigModal,
    effectiveConfig,
    documentosFiltrados,
    estadisticas,
    documentosPorFecha,
    onEditEntity,
    onRefresh,
    onConfigChange,
    selectedDate,
    setSelectedDate,
    loading,
    error,
    ...restProps
  } = props;

  const handleConfigSave = createConfigSaveHandler(tempConfig, onConfigChange, closeConfigModal);

  const renderCompactView = createCompactView(estadisticas);

  const renderAlertsOnlyView = () => (
    <Stack gap="md">
      <ExpirationStatistics estadisticas={estadisticas} config={effectiveConfig} />
      <ExpirationAlerts
        documentosFiltrados={documentosFiltrados}
        estadisticas={estadisticas}
        config={effectiveConfig}
        onEditEntity={onEditEntity}
      />
    </Stack>
  );

  const renderCalendarOnlyView = () => (
    <ExpirationCalendar
      selectedDate={selectedDate}
      onSelectedDateChange={setSelectedDate}
      documentosPorFecha={documentosPorFecha}
      config={effectiveConfig}
    />
  );

  const renderFullView = () => (
    <ExpirationFullView
      {...restProps}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      tempConfig={tempConfig}
      closeConfigModal={closeConfigModal}
      effectiveConfig={effectiveConfig}
      documentosFiltrados={documentosFiltrados}
      estadisticas={estadisticas}
      documentosPorFecha={documentosPorFecha}
      onEditEntity={onEditEntity}
      onRefresh={onRefresh}
      onConfigSave={handleConfigSave}
      loading={loading}
      error={error}
    />
  );

  return {
    handleConfigSave,
    renderCompactView,
    renderAlertsOnlyView,
    renderCalendarOnlyView,
    renderFullView,
  };
};
