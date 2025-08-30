import React from 'react';
import {
  Stack,
  Paper,
  Group,
  Title,
  ActionIcon,
  Select,
  Alert,
  Tabs,
  Timeline,
  Box,
  Text,
  Badge,
} from '@mantine/core';
import {
  IconCalendar,
  IconSettings,
  IconRefresh,
  IconAlertTriangle,
  IconBell,
  IconHistory,
  IconTruck,
  IconUser,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';
import { ExpirationStatistics } from './ExpirationStatistics';
import { ExpirationAlerts } from './ExpirationAlerts';
import { ExpirationCalendar } from './ExpirationCalendar';
import { ExpirationConfigModal } from './ExpirationConfigModal';
import {
  ENTITY_TYPE_VEHICULO,
  ENTITY_TYPE_PERSONAL,
  DATE_FORMAT_DISPLAY,
  TIPOS_DOCUMENTO_LABELS,
  getEstadoColor,
} from '../helpers/expirationHelpers';

interface ExpirationFullViewProps {
  // Estados
  selectedTab: string;
  selectedDate: Date | null;
  filtroEntidad: string;
  filtroEstado: string;
  tempConfig: ExpirationConfig;
  configModalOpened: boolean;

  // Setters
  setSelectedTab: (tab: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setFiltroEntidad: (filtro: string) => void;
  setFiltroEstado: (filtro: string) => void;
  setTempConfig: React.Dispatch<React.SetStateAction<ExpirationConfig>>;
  openConfigModal: () => void;
  closeConfigModal: () => void;

  // Datos
  effectiveConfig: ExpirationConfig;
  documentosFiltrados: DocumentoVencimiento[];
  estadisticas: {
    vencidos: number;
    criticos: number;
    proximos: number;
    vigentes: number;
  };
  documentosPorFecha: Record<string, DocumentoVencimiento[]>;

  // Callbacks
  onEditEntity?: (
    entidadId: string,
    entidadTipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL
  ) => void;
  onRefresh?: () => void;
  onConfigSave: () => void;

  // Estados
  loading?: boolean;
  error?: string;
}

// Helper para iconos de entidad
const getEntidadIcon = (tipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL) => {
  return tipo === ENTITY_TYPE_VEHICULO ? <IconTruck size={16} /> : <IconUser size={16} />;
};

// Helper para renderizar header con controles
const renderHeader = (openConfigModal: () => void, onRefresh?: () => void, loading?: boolean) => (
  <Paper withBorder p="md">
    <Group justify="space-between" mb="md">
      <Group>
        <IconCalendar size={24} />
        <Title order={3}>Gestión de Vencimientos</Title>
      </Group>

      <Group gap="xs">
        <ActionIcon variant="light" onClick={openConfigModal}>
          <IconSettings size={16} />
        </ActionIcon>

        {onRefresh && (
          <ActionIcon variant="light" onClick={onRefresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  </Paper>
);

// Helper para renderizar filtros
const renderFilters = (
  filtroEntidad: string,
  filtroEstado: string,
  setFiltroEntidad: (filtro: string) => void,
  setFiltroEstado: (filtro: string) => void
) => (
  <Group>
    <Select
      placeholder="Tipo de entidad"
      value={filtroEntidad}
      onChange={(value) => setFiltroEntidad(value || 'todos')}
      data={[
        { value: 'todos', label: 'Todas las entidades' },
        { value: ENTITY_TYPE_VEHICULO, label: 'Vehículos' },
        { value: ENTITY_TYPE_PERSONAL, label: 'Personal' },
      ]}
      style={{ minWidth: 150 }}
    />

    <Select
      placeholder="Estado"
      value={filtroEstado}
      onChange={(value) => setFiltroEstado(value || 'todos')}
      data={[
        { value: 'todos', label: 'Todos los estados' },
        { value: 'vencido', label: 'Vencidos' },
        { value: 'critico', label: 'Críticos' },
        { value: 'proximo', label: 'Próximos' },
        { value: 'vigente', label: 'Vigentes' },
      ]}
      style={{ minWidth: 150 }}
    />
  </Group>
);

// Helper para renderizar timeline
const renderTimeline = (
  documentosFiltrados: DocumentoVencimiento[],
  effectiveConfig: ExpirationConfig
) => (
  <Timeline active={-1}>
    {documentosFiltrados
      .sort((a, b) => dayjs(a.fechaVencimiento).unix() - dayjs(b.fechaVencimiento).unix())
      .slice(0, 20)
      .map((doc) => (
        <Timeline.Item
          key={doc._id}
          bullet={getEntidadIcon(doc.entidadTipo)}
          color={getEstadoColor(doc.estado, effectiveConfig)}
        >
          <Group justify="space-between">
            <Box>
              <Text fw={500} size="sm">
                {doc.entidadNombre}
              </Text>
              <Text size="xs" c="dimmed">
                {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo} -{' '}
                {dayjs(doc.fechaVencimiento).format(DATE_FORMAT_DISPLAY)}
              </Text>
            </Box>
            <Badge color={getEstadoColor(doc.estado, effectiveConfig)} size="xs">
              {doc.estado}
            </Badge>
          </Group>
        </Timeline.Item>
      ))}
  </Timeline>
);

export const ExpirationFullView: React.FC<ExpirationFullViewProps> = ({
  selectedTab,
  selectedDate,
  filtroEntidad,
  filtroEstado,
  tempConfig,
  configModalOpened,
  setSelectedTab,
  setSelectedDate,
  setFiltroEntidad,
  setFiltroEstado,
  setTempConfig,
  openConfigModal,
  closeConfigModal,
  effectiveConfig,
  documentosFiltrados,
  estadisticas,
  documentosPorFecha,
  onEditEntity,
  onRefresh,
  onConfigSave,
  loading = false,
  error,
}) => {
  return (
    <Stack gap="md">
      {renderHeader(openConfigModal, onRefresh, loading)}

      <Paper withBorder p="md">
        {renderFilters(filtroEntidad, filtroEstado, setFiltroEntidad, setFiltroEstado)}
      </Paper>

      <ExpirationStatistics estadisticas={estadisticas} config={effectiveConfig} />

      {error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          {error}
        </Alert>
      )}

      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'alerts')}>
        <Tabs.List>
          <Tabs.Tab value="alerts" leftSection={<IconBell size={16} />}>
            Alertas ({estadisticas.vencidos + estadisticas.criticos + estadisticas.proximos})
          </Tabs.Tab>
          <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
            Calendario
          </Tabs.Tab>
          <Tabs.Tab value="timeline" leftSection={<IconHistory size={16} />}>
            Timeline
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="alerts" pt="md">
          <ExpirationAlerts
            documentosFiltrados={documentosFiltrados}
            estadisticas={estadisticas}
            config={effectiveConfig}
            onEditEntity={onEditEntity}
          />
        </Tabs.Panel>

        <Tabs.Panel value="calendar" pt="md">
          <ExpirationCalendar
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            documentosPorFecha={documentosPorFecha}
            config={effectiveConfig}
          />
        </Tabs.Panel>

        <Tabs.Panel value="timeline" pt="md">
          {renderTimeline(documentosFiltrados, effectiveConfig)}
        </Tabs.Panel>
      </Tabs>

      <ExpirationConfigModal
        opened={configModalOpened}
        onClose={closeConfigModal}
        tempConfig={tempConfig}
        onTempConfigChange={setTempConfig}
        onSave={onConfigSave}
      />
    </Stack>
  );
};
