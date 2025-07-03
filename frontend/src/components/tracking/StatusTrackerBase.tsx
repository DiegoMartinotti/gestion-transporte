import React, { useState, useMemo } from 'react';
import {
  Paper,
  Title,
  Group,
  Card,
  Text,
  Badge,
  Timeline,
  Progress,
  Select,
  Button,
  Grid,
  Alert,
  Modal,
  Stack,
  Textarea,
  Tabs,
  RingProgress,
  Center,
  Box,
  SimpleGrid
} from '@mantine/core';
// import { DatePickerInput, DateInput, TimeInput } from '@mantine/dates';
import {
  IconClock,
  IconAlertTriangle,
  IconPlus,
  IconFlag,
  IconTruck,
  IconMapPin,
  IconUser,
  IconNote,
  IconCurrency,
  IconHistory,
  IconCreditCard,
  IconInfoCircle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// Tipos base para el tracker
export interface StatusEvent {
  id: string;
  fecha: Date;
  estado: string;
  descripcion: string;
  tipo: 'cambio_estado' | 'contacto' | 'pago' | 'ubicacion' | 'nota' | 'alerta';
  usuario?: string;
  datos?: Record<string, any>;
  observaciones?: string;
}

export interface StatusConfig {
  estados: Array<{
    value: string;
    label: string;
    color: string;
    icon: React.ReactNode;
    final?: boolean;
  }>;
  allowedTransitions?: Record<string, string[]>;
  requireObservation?: boolean;
}

export interface StatusTrackerItem {
  id: string;
  titulo: string;
  descripcion?: string;
  estadoActual: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  progreso?: number; // 0-100
  metadatos?: Record<string, any>;
  eventos: StatusEvent[];
  prioridad?: 'alta' | 'media' | 'baja';
  fechaVencimiento?: Date;
  responsable?: string;
  tags?: string[];
}

export interface StatusTrackerBaseProps {
  // Datos principales
  item: StatusTrackerItem;
  config: StatusConfig;
  
  // Configuración visual
  variant?: 'compact' | 'detailed' | 'timeline';
  showProgress?: boolean;
  showMetadata?: boolean;
  showEvents?: boolean;
  showActions?: boolean;
  
  // Callbacks
  onStatusChange?: (newStatus: string, observation?: string) => void;
  onAddEvent?: (event: Omit<StatusEvent, 'id'>) => void;
  onAddContact?: (contact: any) => void;
  onAddPayment?: (payment: any) => void;
  
  // Estados
  readonly?: boolean;
  loading?: boolean;
  
  // Personalización específica del dominio
  domain?: 'viajes' | 'pagos' | 'general';
  customActions?: React.ReactNode;
  customTabs?: Array<{ label: string; content: React.ReactNode }>;
}

const DOMAIN_ICONS = {
  viajes: IconTruck,
  pagos: IconCreditCard,
  general: IconFlag
};

const PRIORITY_COLORS = {
  alta: 'red',
  media: 'yellow',
  baja: 'green'
};

const EVENT_ICONS = {
  cambio_estado: IconFlag,
  contacto: IconUser,
  pago: IconCurrency,
  ubicacion: IconMapPin,
  nota: IconNote,
  alerta: IconAlertTriangle
};

export const StatusTrackerBase: React.FC<StatusTrackerBaseProps> = ({
  item,
  config,
  variant = 'detailed',
  showProgress = true,
  showMetadata = true,
  showEvents = true,
  showActions = true,
  onStatusChange,
  onAddEvent,
  onAddContact,
  onAddPayment,
  readonly = false,
  loading = false,
  domain = 'general',
  customActions,
  customTabs = []
}) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('timeline');
  const [newStatus, setNewStatus] = useState('');
  const [statusObservation, setStatusObservation] = useState('');
  const [newEvent, setNewEvent] = useState<Partial<StatusEvent>>({
    tipo: 'nota',
    descripcion: '',
    observaciones: ''
  });
  
  // Modales
  const [statusModalOpened, { open: openStatusModal, close: closeStatusModal }] = useDisclosure(false);
  const [eventModalOpened, { open: openEventModal, close: closeEventModal }] = useDisclosure(false);

  // Datos calculados
  const currentStatusConfig = useMemo(() => {
    return config.estados.find(e => e.value === item.estadoActual);
  }, [config.estados, item.estadoActual]);

  const allowedNextStates = useMemo(() => {
    if (!config.allowedTransitions) return config.estados;
    const allowed = config.allowedTransitions[item.estadoActual] || [];
    return config.estados.filter(e => allowed.includes(e.value));
  }, [config.allowedTransitions, config.estados, item.estadoActual]);

  const eventsGrouped = useMemo(() => {
    const groups = item.eventos.reduce((acc, event) => {
      const key = event.tipo;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {} as Record<string, StatusEvent[]>);
    
    return Object.entries(groups).map(([tipo, events]) => ({
      tipo,
      events: events.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    }));
  }, [item.eventos]);

  const getEventIcon = (tipo: StatusEvent['tipo']) => {
    const Icon = EVENT_ICONS[tipo] || IconInfoCircle;
    return <Icon size={16} />;
  };

  const getDaysFromDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getVencimientoStatus = () => {
    if (!item.fechaVencimiento) return null;
    
    const now = new Date();
    const diffTime = item.fechaVencimiento.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { status: 'vencido', days: Math.abs(daysUntil), color: 'red' };
    } else if (daysUntil <= 7) {
      return { status: 'proximo', days: daysUntil, color: 'orange' };
    } else {
      return { status: 'vigente', days: daysUntil, color: 'green' };
    }
  };

  // Handlers
  const handleStatusChange = () => {
    if (!newStatus) return;
    
    onStatusChange?.(newStatus, statusObservation);
    
    // Agregar evento de cambio de estado
    if (onAddEvent) {
      onAddEvent({
        fecha: new Date(),
        estado: newStatus,
        descripcion: `Estado cambiado a: ${config.estados.find(e => e.value === newStatus)?.label}`,
        tipo: 'cambio_estado',
        observaciones: statusObservation
      });
    }
    
    notifications.show({
      title: 'Estado Actualizado',
      message: `Estado cambiado a: ${config.estados.find(e => e.value === newStatus)?.label}`,
      color: 'green'
    });
    
    setNewStatus('');
    setStatusObservation('');
    closeStatusModal();
  };

  const handleAddEvent = () => {
    if (!newEvent.descripcion) return;
    
    const event: Omit<StatusEvent, 'id'> = {
      fecha: new Date(),
      estado: item.estadoActual,
      descripcion: newEvent.descripcion,
      tipo: newEvent.tipo || 'nota',
      observaciones: newEvent.observaciones
    };
    
    onAddEvent?.(event);
    
    notifications.show({
      title: 'Evento Agregado',
      message: 'Nuevo evento registrado correctamente',
      color: 'blue'
    });
    
    setNewEvent({ tipo: 'nota', descripcion: '', observaciones: '' });
    closeEventModal();
  };

  // Render components
  const renderProgress = () => {
    if (!showProgress) return null;
    
    const progressValue = item.progreso || 0;
    const isComplete = currentStatusConfig?.final || progressValue === 100;
    
    return (
      <Card withBorder p="sm">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>Progreso</Text>
          <Text size="sm" c="dimmed">{progressValue}%</Text>
        </Group>
        <Progress 
          value={progressValue} 
          color={isComplete ? 'green' : progressValue > 75 ? 'blue' : progressValue > 50 ? 'yellow' : 'red'}
          size="lg"
        />
      </Card>
    );
  };

  const renderMetadata = () => {
    if (!showMetadata) return null;
    
    const vencimiento = getVencimientoStatus();
    const Icon = DOMAIN_ICONS[domain];
    
    return (
      <Card withBorder p="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <Icon size={16} />
              <Text size="sm" fw={500}>Información</Text>
            </Group>
            {item.prioridad && (
              <Badge size="xs" color={PRIORITY_COLORS[item.prioridad]}>
                {item.prioridad.toUpperCase()}
              </Badge>
            )}
          </Group>
          
          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed">Creado</Text>
              <Text size="sm">{item.fechaCreacion.toLocaleDateString()}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Actualizado</Text>
              <Text size="sm">{item.fechaActualizacion.toLocaleDateString()}</Text>
            </Box>
          </SimpleGrid>
          
          {vencimiento && (
            <Alert 
              color={vencimiento.color} 
              variant="light" 
              icon={<IconClock size={14} />}
            >
              <Text size="xs">
                {vencimiento.status === 'vencido' 
                  ? `Vencido hace ${vencimiento.days} días`
                  : vencimiento.status === 'proximo'
                  ? `Vence en ${vencimiento.days} días`
                  : `${vencimiento.days} días restantes`
                }
              </Text>
            </Alert>
          )}
          
          {item.responsable && (
            <Group gap="xs">
              <IconUser size={14} />
              <Text size="xs">Responsable: {item.responsable}</Text>
            </Group>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <Group gap="xs">
              {item.tags.map(tag => (
                <Badge key={tag} size="xs" variant="light">{tag}</Badge>
              ))}
            </Group>
          )}
        </Stack>
      </Card>
    );
  };

  const renderTimeline = () => {
    if (!showEvents) return null;
    
    return (
      <Card withBorder p="md">
        <Title order={6} mb="md">Timeline de Eventos</Title>
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {item.eventos
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .map((evento) => (
              <Timeline.Item
                key={evento.id}
                bullet={getEventIcon(evento.tipo)}
                title={evento.descripcion}
              >
                <Group gap="xs" mb={4}>
                  <Badge size="xs" variant="light">{evento.tipo}</Badge>
                  <Text size="xs" c="dimmed">
                    {evento.fecha.toLocaleString()}
                  </Text>
                  {evento.usuario && (
                    <Text size="xs" c="dimmed">por {evento.usuario}</Text>
                  )}
                </Group>
                {evento.observaciones && (
                  <Text size="sm" c="dimmed" mt={4}>{evento.observaciones}</Text>
                )}
              </Timeline.Item>
            ))}
        </Timeline>
      </Card>
    );
  };

  const renderActions = () => {
    if (!showActions || readonly) return null;
    
    return (
      <Card withBorder p="sm">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Acciones</Text>
        </Group>
        
        <Group>
          <Button
            size="sm"
            variant="light"
            leftSection={<IconFlag size={16} />}
            onClick={openStatusModal}
            disabled={allowedNextStates.length === 0}
          >
            Cambiar Estado
          </Button>
          
          <Button
            size="sm"
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={openEventModal}
          >
            Agregar Evento
          </Button>
          
          {customActions}
        </Group>
      </Card>
    );
  };

  const renderCompactView = () => (
    <Card withBorder p="sm">
      <Group justify="space-between">
        <Group>
          {React.createElement(DOMAIN_ICONS[domain], { size: 20 })}
          <Box>
            <Text fw={500} size="sm">{item.titulo}</Text>
            <Text size="xs" c="dimmed">{item.descripcion}</Text>
          </Box>
        </Group>
        
        <Group gap="xs">
          {item.progreso !== undefined && (
            <RingProgress
              size={40}
              thickness={4}
              sections={[{ value: item.progreso, color: 'blue' }]}
              label={
                <Center>
                  <Text size="xs" fw={700}>{item.progreso}%</Text>
                </Center>
              }
            />
          )}
          
          <Badge color={currentStatusConfig?.color || 'gray'}>
            {currentStatusConfig?.label || item.estadoActual}
          </Badge>
        </Group>
      </Group>
    </Card>
  );

  const renderDetailedView = () => (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            {React.createElement(DOMAIN_ICONS[domain], { size: 24 })}
            <Box>
              <Title order={4}>{item.titulo}</Title>
              {item.descripcion && (
                <Text size="sm" c="dimmed">{item.descripcion}</Text>
              )}
            </Box>
          </Group>
          
          <Group gap="xs">
            <Badge 
              size="lg" 
              color={currentStatusConfig?.color || 'gray'}
              leftSection={currentStatusConfig?.icon}
            >
              {currentStatusConfig?.label || item.estadoActual}
            </Badge>
          </Group>
        </Group>
        
        <Grid>
          <Grid.Col span={6}>
            {renderProgress()}
          </Grid.Col>
          <Grid.Col span={6}>
            {renderMetadata()}
          </Grid.Col>
        </Grid>
      </Paper>
      
      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'timeline')}>
        <Tabs.List>
          <Tabs.Tab value="timeline" leftSection={<IconHistory size={16} />}>
            Timeline
          </Tabs.Tab>
          {customTabs.map(tab => (
            <Tabs.Tab key={tab.label} value={tab.label.toLowerCase()}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        
        <Tabs.Panel value="timeline" pt="md">
          {renderTimeline()}
        </Tabs.Panel>
        
        {customTabs.map(tab => (
          <Tabs.Panel key={tab.label} value={tab.label.toLowerCase()} pt="md">
            {tab.content}
          </Tabs.Panel>
        ))}
      </Tabs>
      
      {renderActions()}
    </Stack>
  );

  // Render principal
  if (variant === 'compact') {
    return renderCompactView();
  }

  return (
    <>
      {renderDetailedView()}
      
      {/* Modal cambio de estado */}
      <Modal
        opened={statusModalOpened}
        onClose={closeStatusModal}
        title="Cambiar Estado"
        size="md"
      >
        <Stack>
          <Select
            label="Nuevo Estado"
            value={newStatus}
            onChange={(value) => setNewStatus(value || '')}
            data={allowedNextStates.map(state => ({
              value: state.value,
              label: state.label
            }))}
            required
          />
          
          {config.requireObservation && (
            <Textarea
              label="Observación"
              value={statusObservation}
              onChange={(e) => setStatusObservation(e.target.value)}
              placeholder="Describe el motivo del cambio de estado..."
            />
          )}
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closeStatusModal}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus}>
              Confirmar Cambio
            </Button>
          </Group>
        </Stack>
      </Modal>
      
      {/* Modal agregar evento */}
      <Modal
        opened={eventModalOpened}
        onClose={closeEventModal}
        title="Agregar Evento"
        size="md"
      >
        <Stack>
          <Select
            label="Tipo de Evento"
            value={newEvent.tipo}
            onChange={(value) => setNewEvent(prev => ({ ...prev, tipo: value as any }))}
            data={[
              { value: 'nota', label: 'Nota' },
              { value: 'contacto', label: 'Contacto' },
              { value: 'alerta', label: 'Alerta' },
              { value: 'ubicacion', label: 'Ubicación' }
            ]}
          />
          
          <Textarea
            label="Descripción"
            value={newEvent.descripcion}
            onChange={(e) => setNewEvent(prev => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Describe el evento..."
            required
          />
          
          <Textarea
            label="Observaciones"
            value={newEvent.observaciones}
            onChange={(e) => setNewEvent(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales..."
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closeEventModal}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.descripcion}>
              Agregar Evento
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default StatusTrackerBase;