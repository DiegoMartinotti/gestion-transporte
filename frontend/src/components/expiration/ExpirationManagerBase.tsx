import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Select,
  Paper,
  Title,
  Modal,
  Alert,
  Tabs,
  Button,
  SimpleGrid,
  Timeline,
  NumberInput,
  Switch
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCalendar,
  IconTruck,
  IconUser,
  IconAlertTriangle,
  IconEye,
  IconRefresh,
  IconBell,
  IconSettings,
  IconX,
  IconHistory
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

// Constantes para strings duplicados
const ENTITY_TYPE_VEHICULO = 'vehiculo';
const ENTITY_TYPE_PERSONAL = 'personal';
const DATE_FORMAT_ISO = 'YYYY-MM-DD';

// Interfaces unificadas
export interface DocumentoVencimiento {
  _id: string;
  tipo: string;
  numero?: string;
  fechaVencimiento: Date;
  fechaEmision?: Date;
  observaciones?: string;
  entidadTipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL;
  entidadId: string;
  entidadNombre: string;
  entidadDetalle: string; // Patente para vehículos, DNI para personal
  empresa?: string;
  diasRestantes?: number;
  estado?: 'vencido' | 'critico' | 'proximo' | 'vigente';
}

export interface ExpirationConfig {
  // Configuración de alertas
  diasCritico?: number; // Default: 7
  diasProximo?: number; // Default: 30
  diasVigente?: number; // Default: 90
  
  // Notificaciones automáticas
  notificacionesActivas?: boolean;
  frecuenciaNotificaciones?: 'diaria' | 'semanal' | 'personalizada';
  
  // Filtros permitidos
  entidadesPermitidas?: (typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL)[];
  tiposDocumento?: string[];
  
  // Configuración visual
  mostrarCalendario?: boolean;
  mostrarAlertas?: boolean;
  mostrarEstadisticas?: boolean;
  mostrarTimeline?: boolean;
  
  // Colores personalizados
  colores?: {
    vencido: string;
    critico: string;
    proximo: string;
    vigente: string;
  };
}

export interface ExpirationManagerProps {
  // Datos
  documentos: DocumentoVencimiento[];
  
  // Configuración
  config?: ExpirationConfig;
  
  // Vista
  variant?: 'complete' | 'alerts-only' | 'calendar-only' | 'compact';
  
  // Callbacks
  onEditEntity?: (entidadId: string, entidadTipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL) => void;
  onRefresh?: () => void;
  onConfigChange?: (config: ExpirationConfig) => void;
  
  // Estados
  loading?: boolean;
  error?: string;
}

const DEFAULT_CONFIG: ExpirationConfig = {
  diasCritico: 7,
  diasProximo: 30,
  diasVigente: 90,
  notificacionesActivas: true,
  frecuenciaNotificaciones: 'diaria',
  entidadesPermitidas: [ENTITY_TYPE_VEHICULO, ENTITY_TYPE_PERSONAL],
  mostrarCalendario: true,
  mostrarAlertas: true,
  mostrarEstadisticas: true,
  mostrarTimeline: true,
  colores: {
    vencido: 'red',
    critico: 'red',
    proximo: 'orange',
    vigente: 'green'
  }
};

const TIPOS_DOCUMENTO_LABELS: Record<string, string> = {
  vtv: 'VTV',
  seguro: 'Seguro',
  ruta: 'RUTA',
  senasa: 'SENASA',
  licenciaConducir: 'Licencia de Conducir',
  aptitudPsicofisica: 'Aptitud Psicofísica',
  cargaPeligrosa: 'Carga Peligrosa',
  cursoDefensivo: 'Curso Defensivo'
};

export const ExpirationManagerBase: React.FC<ExpirationManagerProps> = ({
  documentos,
  config = DEFAULT_CONFIG,
  variant = 'complete',
  onEditEntity,
  onRefresh,
  onConfigChange,
  loading = false,
  error
}) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('alerts');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] = useDisclosure(false);
  const [tempConfig, setTempConfig] = useState<ExpirationConfig>(config);
  
  // Configuración efectiva
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config };

  // Calcular estados de documentos
  const documentosConEstado = useMemo(() => {
    const hoy = new Date();
    
    return documentos.map(doc => {
      const diasRestantes = dayjs(doc.fechaVencimiento).diff(dayjs(hoy), 'day');
      
      let estado: DocumentoVencimiento['estado'];
      if (diasRestantes < 0) {
        estado = 'vencido';
      } else if (diasRestantes <= effectiveConfig.diasCritico!) {
        estado = 'critico';
      } else if (diasRestantes <= effectiveConfig.diasProximo!) {
        estado = 'proximo';
      } else {
        estado = 'vigente';
      }
      
      return {
        ...doc,
        diasRestantes,
        estado
      };
    });
  }, [documentos, effectiveConfig.diasCritico, effectiveConfig.diasProximo]);

  // Filtrar documentos
  const documentosFiltrados = useMemo(() => {
    return documentosConEstado.filter(doc => {
      // Filtro por entidad
      if (filtroEntidad !== 'todos' && doc.entidadTipo !== filtroEntidad) return false;
      
      // Filtro por estado
      if (filtroEstado !== 'todos' && doc.estado !== filtroEstado) return false;
      
      // Filtro por entidades permitidas
      if (!effectiveConfig.entidadesPermitidas?.includes(doc.entidadTipo)) return false;
      
      // Filtro por tipos de documento
      if (effectiveConfig.tiposDocumento && !effectiveConfig.tiposDocumento.includes(doc.tipo)) return false;
      
      return true;
    });
  }, [documentosConEstado, filtroEntidad, filtroEstado, effectiveConfig]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = documentosFiltrados.length;
    const vencidos = documentosFiltrados.filter(d => d.estado === 'vencido').length;
    const criticos = documentosFiltrados.filter(d => d.estado === 'critico').length;
    const proximos = documentosFiltrados.filter(d => d.estado === 'proximo').length;
    const vigentes = documentosFiltrados.filter(d => d.estado === 'vigente').length;
    
    return { total, vencidos, criticos, proximos, vigentes };
  }, [documentosFiltrados]);

  // Documentos por fecha (para calendario)
  const documentosPorFecha = useMemo(() => {
    const grupos: Record<string, DocumentoVencimiento[]> = {};
    
    documentosFiltrados.forEach(doc => {
      const fecha = dayjs(doc.fechaVencimiento).format(DATE_FORMAT_ISO);
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(doc);
    });
    
    return grupos;
  }, [documentosFiltrados]);

  // Funciones auxiliares
  const getEstadoColor = (estado: DocumentoVencimiento['estado']) => {
    return effectiveConfig.colores?.[estado || 'vigente'] || 'gray';
  };

  const getEntidadIcon = (tipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL) => {
    return tipo === ENTITY_TYPE_VEHICULO ? <IconTruck size={16} /> : <IconUser size={16} />;
  };

  const handleConfigSave = () => {
    onConfigChange?.(tempConfig);
    closeConfigModal();
    
    notifications.show({
      title: 'Configuración Guardada',
      message: 'La configuración de vencimientos se ha actualizado',
      color: 'green'
    });
  };

  // Render de estadísticas
  const renderEstadisticas = () => {
    if (!effectiveConfig.mostrarEstadisticas) return null;

    return (
      <SimpleGrid cols={4} spacing="md" mb="md">
        <Card withBorder p="sm" bg={`${effectiveConfig.colores?.vencido}.0`}>
          <Text ta="center" fw={700} size="xl" c={effectiveConfig.colores?.vencido}>
            {estadisticas.vencidos}
          </Text>
          <Text ta="center" size="sm" c={effectiveConfig.colores?.vencido}>
            Vencidos
          </Text>
        </Card>
        
        <Card withBorder p="sm" bg={`${effectiveConfig.colores?.critico}.0`}>
          <Text ta="center" fw={700} size="xl" c={effectiveConfig.colores?.critico}>
            {estadisticas.criticos}
          </Text>
          <Text ta="center" size="sm" c={effectiveConfig.colores?.critico}>
            Críticos (≤{effectiveConfig.diasCritico} días)
          </Text>
        </Card>
        
        <Card withBorder p="sm" bg={`${effectiveConfig.colores?.proximo}.0`}>
          <Text ta="center" fw={700} size="xl" c="orange">
            {estadisticas.proximos}
          </Text>
          <Text ta="center" size="sm" c="orange">
            Próximos (≤{effectiveConfig.diasProximo} días)
          </Text>
        </Card>
        
        <Card withBorder p="sm" bg={`${effectiveConfig.colores?.vigente}.0`}>
          <Text ta="center" fw={700} size="xl" c={effectiveConfig.colores?.vigente}>
            {estadisticas.vigentes}
          </Text>
          <Text ta="center" size="sm" c={effectiveConfig.colores?.vigente}>
            Vigentes
          </Text>
        </Card>
      </SimpleGrid>
    );
  };

  // Render de alertas
  const renderAlertas = () => {
    const alertas = documentosFiltrados
      .filter(doc => doc.estado === 'vencido' || doc.estado === 'critico' || doc.estado === 'proximo')
      .sort((a, b) => (a.diasRestantes || 0) - (b.diasRestantes || 0));

    return (
      <Stack gap="md">
        {/* Alertas críticas */}
        {estadisticas.vencidos > 0 && (
          <Alert
            icon={<IconX size={16} />}
            color="red"
            title="Documentos Vencidos"
          >
            <Text size="sm">
              {estadisticas.vencidos} documento{estadisticas.vencidos > 1 ? 's' : ''} vencido{estadisticas.vencidos > 1 ? 's' : ''} que requieren atención inmediata
            </Text>
          </Alert>
        )}
        
        {estadisticas.criticos > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            title="Documentos Críticos"
          >
            <Text size="sm">
              {estadisticas.criticos} documento{estadisticas.criticos > 1 ? 's' : ''} vence{estadisticas.criticos > 1 ? 'n' : ''} en {effectiveConfig.diasCritico} días o menos
            </Text>
          </Alert>
        )}

        {/* Lista de documentos con alertas */}
        <Card withBorder>
          <Timeline active={-1} bulletSize={20}>
            {alertas.slice(0, 10).map((doc) => (
              <Timeline.Item
                key={doc._id}
                bullet={getEntidadIcon(doc.entidadTipo)}
                color={getEstadoColor(doc.estado)}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Text fw={500} size="sm">{doc.entidadNombre}</Text>
                    <Badge size="xs" variant="light">
                      {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo}
                    </Badge>
                  </Group>
                  
                  <Group gap="xs">
                    <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                      {doc.estado === 'vencido' 
                        ? `Vencido hace ${Math.abs(doc.diasRestantes || 0)} días`
                        : `${doc.diasRestantes} días restantes`
                      }
                    </Badge>
                    
                    {onEditEntity && (
                      <ActionIcon
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={() => onEditEntity(doc.entidadId, doc.entidadTipo)}
                      >
                        <IconEye size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
                
                <Text size="xs" c="dimmed">
                  Vence: {dayjs(doc.fechaVencimiento).format('DD/MM/YYYY')}
                </Text>
                
                {doc.numero && (
                  <Text size="xs" c="dimmed">
                    Número: {doc.numero}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
          
          {alertas.length > 10 && (
            <Text size="xs" c="dimmed" ta="center" mt="md">
              Y {alertas.length - 10} documento{alertas.length - 10 > 1 ? 's' : ''} más...
            </Text>
          )}
        </Card>
      </Stack>
    );
  };

  // Render de calendario
  const renderCalendario = () => {
    return (
      <Stack gap="md">
        <DatePickerInput
          label="Seleccionar fecha"
          value={selectedDate}
          onChange={(value) => setSelectedDate(value ? new Date(value) : null)}
          leftSection={<IconCalendar size={16} />}
        />
        
        {selectedDate && documentosPorFecha[dayjs(selectedDate).format(DATE_FORMAT_ISO)] && (
          <Card withBorder mt="md">
            <Title order={6} mb="sm">
              Vencimientos del {dayjs(selectedDate).format('DD/MM/YYYY')}
            </Title>
            <Stack gap="xs">
              {documentosPorFecha[dayjs(selectedDate).format(DATE_FORMAT_ISO)].map(doc => (
                <Group key={doc._id} justify="space-between">
                  <Group gap="xs">
                    {getEntidadIcon(doc.entidadTipo)}
                    <Text size="sm">{doc.entidadNombre}</Text>
                    <Badge size="xs" variant="light">
                      {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo}
                    </Badge>
                  </Group>
                  <Badge color={getEstadoColor(doc.estado)} size="xs">
                    {doc.estado?.toUpperCase()}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    );
  };

  // Render de configuración
  const renderModalConfiguracion = () => (
    <Modal
      opened={configModalOpened}
      onClose={closeConfigModal}
      title="Configuración de Vencimientos"
      size="md"
    >
      <Stack>
        <NumberInput
          label="Días para alerta crítica"
          value={tempConfig.diasCritico}
          onChange={(value) => setTempConfig(prev => ({ ...prev, diasCritico: Number(value) }))}
          min={1}
          max={30}
        />
        
        <NumberInput
          label="Días para alerta próxima"
          value={tempConfig.diasProximo}
          onChange={(value) => setTempConfig(prev => ({ ...prev, diasProximo: Number(value) }))}
          min={1}
          max={90}
        />
        
        <Switch
          label="Notificaciones automáticas"
          checked={tempConfig.notificacionesActivas}
          onChange={(event) => setTempConfig(prev => ({ 
            ...prev, 
            notificacionesActivas: event.currentTarget.checked 
          }))}
        />
        
        <Select
          label="Frecuencia de notificaciones"
          value={tempConfig.frecuenciaNotificaciones}
          onChange={(value) => setTempConfig(prev => ({ 
            ...prev, 
            frecuenciaNotificaciones: value as any 
          }))}
          data={[
            { value: 'diaria', label: 'Diaria' },
            { value: 'semanal', label: 'Semanal' },
            { value: 'personalizada', label: 'Personalizada' }
          ]}
          disabled={!tempConfig.notificacionesActivas}
        />
        
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={closeConfigModal}>
            Cancelar
          </Button>
          <Button onClick={handleConfigSave}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  // Render según variante
  if (variant === 'compact') {
    return (
      <Card withBorder p="sm">
        <Group justify="space-between" mb="md">
          <Group>
            <IconCalendar size={18} />
            <Text fw={500}>Vencimientos</Text>
          </Group>
          <Badge color={estadisticas.vencidos > 0 ? 'red' : estadisticas.criticos > 0 ? 'orange' : 'green'}>
            {estadisticas.vencidos + estadisticas.criticos} alertas
          </Badge>
        </Group>
        
        {estadisticas.vencidos > 0 && (
          <Alert icon={<IconX />} color="red" variant="light">
            <Text size="sm">{estadisticas.vencidos} vencido{estadisticas.vencidos > 1 ? 's' : ''}</Text>
          </Alert>
        )}
      </Card>
    );
  }

  if (variant === 'alerts-only') {
    return (
      <Stack gap="md">
        {renderEstadisticas()}
        {renderAlertas()}
      </Stack>
    );
  }

  if (variant === 'calendar-only') {
    return renderCalendario();
  }

  // Vista completa
  return (
    <Stack gap="md">
      {/* Header con controles */}
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

        {/* Filtros */}
        <Group>
          <Select
            placeholder="Tipo de entidad"
            value={filtroEntidad}
            onChange={(value) => setFiltroEntidad(value || 'todos')}
            data={[
              { value: 'todos', label: 'Todas las entidades' },
              { value: ENTITY_TYPE_VEHICULO, label: 'Vehículos' },
              { value: ENTITY_TYPE_PERSONAL, label: 'Personal' }
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
              { value: 'vigente', label: 'Vigentes' }
            ]}
            style={{ minWidth: 150 }}
          />
        </Group>
      </Paper>

      {/* Estadísticas */}
      {renderEstadisticas()}

      {/* Error handling */}
      {error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          {error}
        </Alert>
      )}

      {/* Tabs principales */}
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
          {renderAlertas()}
        </Tabs.Panel>
        
        <Tabs.Panel value="calendar" pt="md">
          {renderCalendario()}
        </Tabs.Panel>
        
        <Tabs.Panel value="timeline" pt="md">
          <Timeline active={-1}>
            {documentosFiltrados
              .sort((a, b) => dayjs(a.fechaVencimiento).unix() - dayjs(b.fechaVencimiento).unix())
              .slice(0, 20)
              .map(doc => (
                <Timeline.Item
                  key={doc._id}
                  bullet={getEntidadIcon(doc.entidadTipo)}
                  color={getEstadoColor(doc.estado)}
                >
                  <Group justify="space-between">
                    <Box>
                      <Text fw={500} size="sm">{doc.entidadNombre}</Text>
                      <Text size="xs" c="dimmed">
                        {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo} - {dayjs(doc.fechaVencimiento).format('DD/MM/YYYY')}
                      </Text>
                    </Box>
                    <Badge color={getEstadoColor(doc.estado)} size="xs">
                      {doc.estado}
                    </Badge>
                  </Group>
                </Timeline.Item>
              ))}
          </Timeline>
        </Tabs.Panel>
      </Tabs>

      {/* Modal de configuración */}
      {renderModalConfiguracion()}
    </Stack>
  );
};

export default ExpirationManagerBase;