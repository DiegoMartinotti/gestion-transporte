import React, { useState, useMemo, useCallback } from 'react';
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
  ThemeIcon,
  Modal,
  ScrollArea,
  Alert,
  Tabs,
  Button,
  SimpleGrid,
  Progress,
  Timeline,
  Collapse,
  TextInput,
  NumberInput,
  Switch
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconTruck,
  IconUser,
  IconFileText,
  IconAlertTriangle,
  IconEye,
  IconRefresh,
  IconBell,
  IconBellOff,
  IconChevronDown,
  IconChevronUp,
  IconSettings,
  IconCheck,
  IconX,
  IconClock,
  IconHistory
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

// Interfaces unificadas para cualquier tipo de alerta
export interface AlertData {
  _id: string;
  tipo: string;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  entidadTipo: 'vehiculo' | 'personal' | 'empresa' | 'cliente';
  entidadId: string;
  entidadNombre: string;
  entidadDetalle: string; // Patente, DNI, etc.
  empresa?: string;
  diasRestantes?: number;
  estado?: 'vencido' | 'critico' | 'proximo' | 'vigente';
  prioridad?: 'alta' | 'media' | 'baja';
  categoria?: string; // Para agrupar diferentes tipos de alertas
}

export interface AlertSystemConfig {
  // Configuración de alertas
  diasCritico?: number; // Default: 7
  diasProximo?: number; // Default: 30
  diasVigente?: number; // Default: 90
  
  // Notificaciones automáticas
  notificacionesActivas?: boolean;
  frecuenciaNotificaciones?: 'diaria' | 'semanal' | 'personalizada';
  
  // Filtros permitidos
  entidadesPermitidas?: ('vehiculo' | 'personal' | 'empresa' | 'cliente')[];
  tiposAlerta?: string[];
  categoriasPermitidas?: string[];
  
  // Configuración visual
  mostrarCalendario?: boolean;
  mostrarAlertas?: boolean;
  mostrarEstadisticas?: boolean;
  mostrarTimeline?: boolean;
  
  // Acciones disponibles
  allowEdit?: boolean;
  allowRefresh?: boolean;
  allowNotificationToggle?: boolean;
  
  // Colores personalizados
  colores?: {
    vencido: string;
    critico: string;
    proximo: string;
    vigente: string;
  };
}

export interface AlertSystemProps {
  // Datos
  alertas: AlertData[];
  
  // Configuración
  config?: AlertSystemConfig;
  
  // Vista
  variant?: 'complete' | 'alerts-only' | 'calendar-only' | 'compact' | 'summary';
  categoria?: string; // Para filtrar por categoría específica
  
  // Callbacks
  onEditEntity?: (entidadId: string, entidadTipo: AlertData['entidadTipo']) => void;
  onRefresh?: () => void;
  onConfigChange?: (config: AlertSystemConfig) => void;
  onAlertAction?: (alertId: string, action: string) => void;
  
  // Estados
  loading?: boolean;
  error?: string;
}

const DEFAULT_CONFIG: AlertSystemConfig = {
  diasCritico: 7,
  diasProximo: 30,
  diasVigente: 90,
  notificacionesActivas: true,
  frecuenciaNotificaciones: 'diaria',
  entidadesPermitidas: ['vehiculo', 'personal', 'empresa', 'cliente'],
  mostrarCalendario: true,
  mostrarAlertas: true,
  mostrarEstadisticas: true,
  mostrarTimeline: true,
  allowEdit: true,
  allowRefresh: true,
  allowNotificationToggle: true,
  colores: {
    vencido: 'red',
    critico: 'red',
    proximo: 'orange',
    vigente: 'green'
  }
};

const TIPOS_LABELS: Record<string, string> = {
  // Documentación vehicular
  vtv: 'VTV',
  seguro: 'Seguro',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  patente: 'Patente',
  
  // Documentación personal
  licenciaConducir: 'Licencia de Conducir',
  aptitudPsicofisica: 'Aptitud Psicofísica',
  cargaPeligrosa: 'Carga Peligrosa',
  cursoDefensivo: 'Curso Defensivo',
  
  // Otros
  contrato: 'Contrato',
  habilitacion: 'Habilitación',
  certificado: 'Certificado'
};

const CATEGORIA_LABELS: Record<string, string> = {
  documentacion: 'Documentación',
  vencimientos: 'Vencimientos',
  contratos: 'Contratos',
  habilitaciones: 'Habilitaciones',
  seguros: 'Seguros',
  otros: 'Otros'
};

export const AlertSystemUnified: React.FC<AlertSystemProps> = ({
  alertas,
  config = DEFAULT_CONFIG,
  variant = 'complete',
  categoria,
  onEditEntity,
  onRefresh,
  onConfigChange,
  onAlertAction,
  loading = false,
  error
}) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('alerts');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>(categoria || 'todos');
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] = useDisclosure(false);
  const [tempConfig, setTempConfig] = useState<AlertSystemConfig>(config);
  
  // Configuración efectiva
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config };

  // Calcular estados de alertas
  const alertasConEstado = useMemo(() => {
    const hoy = new Date();
    
    return alertas.map(alerta => {
      if (!alerta.fechaVencimiento) return alerta;
      
      const diasRestantes = dayjs(alerta.fechaVencimiento).diff(dayjs(hoy), 'day');
      
      let estado: AlertData['estado'];
      let prioridad: AlertData['prioridad'];
      
      if (diasRestantes < 0) {
        estado = 'vencido';
        prioridad = 'alta';
      } else if (diasRestantes <= effectiveConfig.diasCritico!) {
        estado = 'critico';
        prioridad = 'alta';
      } else if (diasRestantes <= effectiveConfig.diasProximo!) {
        estado = 'proximo';
        prioridad = 'media';
      } else {
        estado = 'vigente';
        prioridad = 'baja';
      }
      
      return {
        ...alerta,
        diasRestantes,
        estado,
        prioridad
      };
    });
  }, [alertas, effectiveConfig.diasCritico, effectiveConfig.diasProximo]);

  // Filtrar alertas
  const alertasFiltradas = useMemo(() => {
    return alertasConEstado.filter(alerta => {
      // Filtro por entidad
      if (filtroEntidad !== 'todos' && alerta.entidadTipo !== filtroEntidad) return false;
      
      // Filtro por estado
      if (filtroEstado !== 'todos' && alerta.estado !== filtroEstado) return false;
      
      // Filtro por categoría
      if (filtroCategoria !== 'todos' && alerta.categoria !== filtroCategoria) return false;
      
      // Filtro por entidades permitidas
      if (!effectiveConfig.entidadesPermitidas?.includes(alerta.entidadTipo)) return false;
      
      // Filtro por tipos de alerta
      if (effectiveConfig.tiposAlerta && !effectiveConfig.tiposAlerta.includes(alerta.tipo)) return false;
      
      return true;
    });
  }, [alertasConEstado, filtroEntidad, filtroEstado, filtroCategoria, effectiveConfig]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = alertasFiltradas.length;
    const vencidos = alertasFiltradas.filter(a => a.estado === 'vencido').length;
    const criticos = alertasFiltradas.filter(a => a.estado === 'critico').length;
    const proximos = alertasFiltradas.filter(a => a.estado === 'proximo').length;
    const vigentes = alertasFiltradas.filter(a => a.estado === 'vigente').length;
    
    return { total, vencidos, criticos, proximos, vigentes };
  }, [alertasFiltradas]);

  // Alertas por fecha (para calendario)
  const alertasPorFecha = useMemo(() => {
    const grupos: Record<string, AlertData[]> = {};
    
    alertasFiltradas.forEach(alerta => {
      if (!alerta.fechaVencimiento) return;
      const fecha = dayjs(alerta.fechaVencimiento).format('YYYY-MM-DD');
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(alerta);
    });
    
    return grupos;
  }, [alertasFiltradas]);

  // Funciones auxiliares
  const getEstadoColor = (estado: AlertData['estado']) => {
    return effectiveConfig.colores?.[estado || 'vigente'] || 'gray';
  };

  const getEntidadIcon = (tipo: AlertData['entidadTipo']) => {
    switch (tipo) {
      case 'vehiculo': return <IconTruck size={16} />;
      case 'personal': return <IconUser size={16} />;
      default: return <IconFileText size={16} />;
    }
  };

  const handleConfigSave = () => {
    onConfigChange?.(tempConfig);
    closeConfigModal();
    
    notifications.show({
      title: 'Configuración Guardada',
      message: 'La configuración de alertas se ha actualizado',
      color: 'green'
    });
  };

  const handleAlertClick = useCallback((alerta: AlertData) => {
    if (onEditEntity) {
      onEditEntity(alerta.entidadId, alerta.entidadTipo);
    }
  }, [onEditEntity]);

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
    const alertasUrgentes = alertasFiltradas
      .filter(alerta => alerta.estado === 'vencido' || alerta.estado === 'critico' || alerta.estado === 'proximo')
      .sort((a, b) => (a.diasRestantes || 0) - (b.diasRestantes || 0));

    return (
      <Stack gap="md">
        {/* Alertas críticas */}
        {estadisticas.vencidos > 0 && (
          <Alert
            icon={<IconX size={16} />}
            color="red"
            title="Alertas Vencidas"
          >
            <Text size="sm">
              {estadisticas.vencidos} alerta{estadisticas.vencidos > 1 ? 's' : ''} vencida{estadisticas.vencidos > 1 ? 's' : ''} que requieren atención inmediata
            </Text>
          </Alert>
        )}
        
        {estadisticas.criticos > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            title="Alertas Críticas"
          >
            <Text size="sm">
              {estadisticas.criticos} alerta{estadisticas.criticos > 1 ? 's' : ''} crítica{estadisticas.criticos > 1 ? 's' : ''} (≤{effectiveConfig.diasCritico} días)
            </Text>
          </Alert>
        )}

        {/* Lista de alertas urgentes */}
        <Card withBorder>
          <Timeline active={-1} bulletSize={20}>
            {alertasUrgentes.slice(0, 10).map((alerta) => (
              <Timeline.Item
                key={alerta._id}
                bullet={getEntidadIcon(alerta.entidadTipo)}
                color={getEstadoColor(alerta.estado)}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Text fw={500} size="sm">{alerta.entidadNombre}</Text>
                    <Badge size="xs" variant="light">
                      {TIPOS_LABELS[alerta.tipo] || alerta.tipo}
                    </Badge>
                    {alerta.categoria && (
                      <Badge size="xs" variant="outline" color="gray">
                        {CATEGORIA_LABELS[alerta.categoria] || alerta.categoria}
                      </Badge>
                    )}
                  </Group>
                  
                  <Group gap="xs">
                    <Badge color={getEstadoColor(alerta.estado)} variant="light" size="xs">
                      {alerta.estado === 'vencido' 
                        ? `Vencido hace ${Math.abs(alerta.diasRestantes || 0)} días`
                        : `${alerta.diasRestantes} días restantes`
                      }
                    </Badge>
                    
                    {effectiveConfig.allowEdit && onEditEntity && (
                      <ActionIcon
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={() => handleAlertClick(alerta)}
                      >
                        <IconEye size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
                
                <Text size="xs" c="dimmed">
                  {alerta.fechaVencimiento && `Vence: ${dayjs(alerta.fechaVencimiento).format('DD/MM/YYYY')}`}
                </Text>
                
                {alerta.numero && (
                  <Text size="xs" c="dimmed">
                    Número: {alerta.numero}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
          
          {alertasUrgentes.length > 10 && (
            <Text size="xs" c="dimmed" ta="center" mt="md">
              Y {alertasUrgentes.length - 10} alerta{alertasUrgentes.length - 10 > 1 ? 's' : ''} más...
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
        
        {selectedDate && alertasPorFecha[dayjs(selectedDate).format('YYYY-MM-DD')] && (
          <Card withBorder mt="md">
            <Title order={6} mb="sm">
              Alertas del {dayjs(selectedDate).format('DD/MM/YYYY')}
            </Title>
            <Stack gap="xs">
              {alertasPorFecha[dayjs(selectedDate).format('YYYY-MM-DD')].map(alerta => (
                <Group key={alerta._id} justify="space-between">
                  <Group gap="xs">
                    {getEntidadIcon(alerta.entidadTipo)}
                    <Text size="sm">{alerta.entidadNombre}</Text>
                    <Badge size="xs" variant="light">
                      {TIPOS_LABELS[alerta.tipo] || alerta.tipo}
                    </Badge>
                  </Group>
                  <Badge color={getEstadoColor(alerta.estado)} size="xs">
                    {alerta.estado?.toUpperCase()}
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
      title="Configuración de Alertas"
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
            <IconBell size={18} />
            <Text fw={500}>Alertas</Text>
          </Group>
          <Badge color={estadisticas.vencidos > 0 ? 'red' : estadisticas.criticos > 0 ? 'orange' : 'green'}>
            {estadisticas.vencidos + estadisticas.criticos} críticas
          </Badge>
        </Group>
        
        {estadisticas.vencidos > 0 && (
          <Alert icon={<IconX />} color="red" variant="light">
            <Text size="sm">{estadisticas.vencidos} vencida{estadisticas.vencidos > 1 ? 's' : ''}</Text>
          </Alert>
        )}
      </Card>
    );
  }

  if (variant === 'summary') {
    return (
      <Stack gap="md">
        {renderEstadisticas()}
        {estadisticas.total > 0 ? (
          <Alert 
            icon={<IconAlertTriangle />} 
            color={estadisticas.vencidos > 0 ? 'red' : estadisticas.criticos > 0 ? 'orange' : 'blue'}
          >
            <Text fw={500}>
              {estadisticas.total} alerta{estadisticas.total > 1 ? 's' : ''} activa{estadisticas.total > 1 ? 's' : ''}
            </Text>
            <Text size="sm">
              {estadisticas.vencidos > 0 && `${estadisticas.vencidos} vencida${estadisticas.vencidos > 1 ? 's' : ''}`}
              {estadisticas.criticos > 0 && `, ${estadisticas.criticos} crítica${estadisticas.criticos > 1 ? 's' : ''}`}
            </Text>
          </Alert>
        ) : (
          <Alert icon={<IconCheck />} color="green">
            <Text fw={500}>✅ Sin alertas críticas</Text>
            <Text size="sm">Todas las alertas están bajo control</Text>
          </Alert>
        )}
      </Stack>
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
            <IconBell size={24} />
            <Title order={3}>Sistema de Alertas</Title>
            {categoria && (
              <Badge color="blue" variant="light">
                {CATEGORIA_LABELS[categoria] || categoria}
              </Badge>
            )}
          </Group>
          
          <Group gap="xs">
            {effectiveConfig.allowNotificationToggle && (
              <ActionIcon variant="light" color={effectiveConfig.notificacionesActivas ? 'blue' : 'gray'}>
                {effectiveConfig.notificacionesActivas ? <IconBell size={16} /> : <IconBellOff size={16} />}
              </ActionIcon>
            )}
            
            <ActionIcon variant="light" onClick={openConfigModal}>
              <IconSettings size={16} />
            </ActionIcon>
            
            {effectiveConfig.allowRefresh && onRefresh && (
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
              { value: 'vehiculo', label: 'Vehículos' },
              { value: 'personal', label: 'Personal' },
              { value: 'empresa', label: 'Empresas' },
              { value: 'cliente', label: 'Clientes' }
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

          {!categoria && (
            <Select
              placeholder="Categoría"
              value={filtroCategoria}
              onChange={(value) => setFiltroCategoria(value || 'todos')}
              data={[
                { value: 'todos', label: 'Todas las categorías' },
                ...Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              style={{ minWidth: 150 }}
            />
          )}
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
          {effectiveConfig.mostrarCalendario && (
            <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
              Calendario
            </Tabs.Tab>
          )}
          {effectiveConfig.mostrarTimeline && (
            <Tabs.Tab value="timeline" leftSection={<IconHistory size={16} />}>
              Timeline
            </Tabs.Tab>
          )}
        </Tabs.List>
        
        <Tabs.Panel value="alerts" pt="md">
          {renderAlertas()}
        </Tabs.Panel>
        
        {effectiveConfig.mostrarCalendario && (
          <Tabs.Panel value="calendar" pt="md">
            {renderCalendario()}
          </Tabs.Panel>
        )}
        
        {effectiveConfig.mostrarTimeline && (
          <Tabs.Panel value="timeline" pt="md">
            <Timeline active={-1}>
              {alertasFiltradas
                .sort((a, b) => dayjs(a.fechaVencimiento || 0).unix() - dayjs(b.fechaVencimiento || 0).unix())
                .slice(0, 20)
                .map(alerta => (
                  <Timeline.Item
                    key={alerta._id}
                    bullet={getEntidadIcon(alerta.entidadTipo)}
                    color={getEstadoColor(alerta.estado)}
                  >
                    <Group justify="space-between">
                      <Box>
                        <Text fw={500} size="sm">{alerta.entidadNombre}</Text>
                        <Text size="xs" c="dimmed">
                          {TIPOS_LABELS[alerta.tipo] || alerta.tipo} - {alerta.fechaVencimiento && dayjs(alerta.fechaVencimiento).format('DD/MM/YYYY')}
                        </Text>
                      </Box>
                      <Badge color={getEstadoColor(alerta.estado)} size="xs">
                        {alerta.estado}
                      </Badge>
                    </Group>
                  </Timeline.Item>
                ))}
            </Timeline>
          </Tabs.Panel>
        )}
      </Tabs>

      {/* Modal de configuración */}
      {renderModalConfiguracion()}
    </Stack>
  );
};

export default AlertSystemUnified;