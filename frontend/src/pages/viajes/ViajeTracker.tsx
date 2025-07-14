import { useState } from 'react';
import {
  Stack, Timeline, Text, Button, Group, Badge, Paper,
  Modal, Select, Textarea, ActionIcon, Alert, Progress,
  Grid, Card, RingProgress, Center, Tooltip
} from '@mantine/core';
import {
  IconFlag, IconTruck, IconCheck, IconClock, IconX,
  IconAlertCircle, IconInfoCircle, IconEdit, IconPlus,
  IconMapPin, IconUser, IconCalendar, IconNote
} from '@tabler/icons-react';
import { DateInput, TimeInput } from '@mantine/dates';
import { Viaje } from '../../types/viaje';
import { notifications } from '@mantine/notifications';

interface ViajeTrackerProps {
  viaje: Viaje;
  onUpdateEstado?: (nuevoEstado: string, observacion?: string) => void;
}

interface EventoSeguimiento {
  id: string;
  fecha: Date;
  estado: string;
  descripcion: string;
  usuario?: string;
  ubicacion?: {
    lat: number;
    lng: number;
    direccion: string;
  };
  observaciones?: string;
}

export function ViajeTracker({ viaje, onUpdateEstado }: ViajeTrackerProps) {
  const [showChangeEstado, setShowChangeEstado] = useState(false);
  const [showAddEvento, setShowAddEvento] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observacionCambio, setObservacionCambio] = useState('');
  const [nuevoEvento, setNuevoEvento] = useState({
    descripcion: '',
    fecha: new Date(),
    observaciones: ''
  });

  // Eventos simulados de seguimiento
  const [eventos, setEventos] = useState<EventoSeguimiento[]>([
    {
      id: '1',
      fecha: new Date(viaje.fecha),
      estado: 'Pendiente',
      descripcion: 'Viaje creado y programado',
      usuario: 'Sistema',
      observaciones: 'Viaje registrado en el sistema'
    },
    ...(viaje.estado !== 'Pendiente' ? [{
      id: '2',
      fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estado: 'En Progreso',
      descripcion: 'Viaje iniciado',
      usuario: 'Juan Pérez',
      ubicacion: {
        lat: -34.6037,
        lng: -58.3816,
        direccion: viaje.tramo?.origen?.direccion || 'Origen'
      },
      observaciones: 'Carga verificada y documentación completa'
    }] : []),
    ...(viaje.estado === 'Completado' || viaje.estado === 'Facturado' ? [{
      id: '3',
      fecha: new Date(Date.now() - 30 * 60 * 1000),
      estado: 'Completado',
      descripcion: 'Viaje completado',
      usuario: 'Juan Pérez',
      ubicacion: {
        lat: -34.6118,
        lng: -58.3960,
        direccion: viaje.tramo?.destino?.direccion || 'Destino'
      },
      observaciones: 'Entrega realizada sin inconvenientes'
    }] : []),
    ...(viaje.estado === 'Facturado' ? [{
      id: '4',
      fecha: new Date(),
      estado: 'Facturado',
      descripcion: 'Viaje facturado',
      usuario: 'Sistema',
      observaciones: 'Factura generada automáticamente'
    }] : [])
  ]);

  const estadoOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_PROGRESO', label: 'En Progreso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'FACTURADO', label: 'Facturado' }
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'blue';
      case 'EN_PROGRESO': return 'yellow';
      case 'COMPLETADO': return 'green';
      case 'CANCELADO': return 'red';
      case 'FACTURADO': return 'violet';
      default: return 'gray';
    }
  };

  const getProgressValue = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 20;
      case 'EN_PROGRESO': return 60;
      case 'COMPLETADO': return 100;
      case 'CANCELADO': return 0;
      case 'FACTURADO': return 100;
      default: return 0;
    }
  };

  const getTimelineIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <IconClock size={16} />;
      case 'EN_PROGRESO': return <IconTruck size={16} />;
      case 'COMPLETADO': return <IconCheck size={16} />;
      case 'CANCELADO': return <IconX size={16} />;
      case 'FACTURADO': return <IconFlag size={16} />;
      default: return <IconInfoCircle size={16} />;
    }
  };

  const handleChangeEstado = async () => {
    if (!nuevoEstado) {
      notifications.show({
        title: 'Error',
        message: 'Selecciona un estado',
        color: 'red'
      });
      return;
    }

    try {
      if (onUpdateEstado) {
        await onUpdateEstado(nuevoEstado, observacionCambio);
      }

      // Agregar evento al timeline
      const nuevoEventoSeguimiento: EventoSeguimiento = {
        id: Date.now().toString(),
        fecha: new Date(),
        estado: nuevoEstado,
        descripcion: `Estado cambiado a ${nuevoEstado}`,
        usuario: 'Usuario Actual',
        observaciones: observacionCambio
      };

      setEventos(prev => [...prev, nuevoEventoSeguimiento]);
      
      notifications.show({
        title: 'Estado actualizado',
        message: `El viaje cambió a ${nuevoEstado}`,
        color: 'green'
      });

      setShowChangeEstado(false);
      setNuevoEstado('');
      setObservacionCambio('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado',
        color: 'red'
      });
    }
  };

  const handleAddEvento = () => {
    const evento: EventoSeguimiento = {
      id: Date.now().toString(),
      fecha: nuevoEvento.fecha,
      estado: 'NOTA',
      descripcion: nuevoEvento.descripcion,
      usuario: 'Usuario Actual',
      observaciones: nuevoEvento.observaciones
    };

    setEventos(prev => [...prev, evento].sort((a, b) => a.fecha.getTime() - b.fecha.getTime()));
    
    notifications.show({
      title: 'Evento agregado',
      message: 'El evento se registró correctamente',
      color: 'green'
    });

    setShowAddEvento(false);
    setNuevoEvento({
      descripcion: '',
      fecha: new Date(),
      observaciones: ''
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Stack>
      <Grid>
        <Grid.Col span={8}>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={600}>Seguimiento del Viaje</Text>
            <Group>
              <Button
                variant="light"
                leftSection={<IconPlus />}
                onClick={() => setShowAddEvento(true)}
              >
                Agregar Evento
              </Button>
              <Button
                leftSection={<IconEdit />}
                onClick={() => setShowChangeEstado(true)}
              >
                Cambiar Estado
              </Button>
            </Group>
          </Group>

          <Timeline active={eventos.length - 1} bulletSize={24} lineWidth={2}>
            {eventos.map((evento, index) => (
              <Timeline.Item
                key={evento.id}
                bullet={getTimelineIcon(evento.estado)}
                title={
                  <Group gap="xs">
                    <Text fw={600}>{evento.descripcion}</Text>
                    {evento.estado !== 'NOTA' && (
                      <Badge 
                        color={getEstadoBadgeColor(evento.estado)} 
                        size="sm"
                      >
                        {evento.estado}
                      </Badge>
                    )}
                  </Group>
                }
              >
                <Text size="sm" c="dimmed" mb="xs">
                  {formatDateTime(evento.fecha)}
                  {evento.usuario && ` • ${evento.usuario}`}
                </Text>
                
                {evento.ubicacion && (
                  <Group gap="xs" mb="xs">
                    <IconMapPin size={14} color="gray" />
                    <Text size="sm" c="dimmed">
                      {evento.ubicacion.direccion}
                    </Text>
                  </Group>
                )}

                {evento.observaciones && (
                  <Paper p="xs" bg="gray.0" radius="sm">
                    <Text size="sm">{evento.observaciones}</Text>
                  </Paper>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack>
            <Card>
              <Stack align="center">
                <RingProgress
                  size={100}
                  thickness={10}
                  sections={[
                    { 
                      value: getProgressValue(viaje.estado), 
                      color: getEstadoBadgeColor(viaje.estado) 
                    }
                  ]}
                  label={
                    <Center>
                      <Text size="xs" fw={700}>
                        {getProgressValue(viaje.estado)}%
                      </Text>
                    </Center>
                  }
                />
                <Text size="sm" c="dimmed" ta="center">
                  Progreso del viaje
                </Text>
                <Badge 
                  color={getEstadoBadgeColor(viaje.estado)} 
                  variant="filled"
                  size="lg"
                >
                  {viaje.estado}
                </Badge>
              </Stack>
            </Card>

            <Card>
              <Text size="sm" fw={600} mb="md">INFORMACIÓN DE RUTA</Text>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconFlag size={14} color="green" />
                  <div>
                    <Text size="sm" fw={500}>Origen</Text>
                    <Text size="xs" c="dimmed">
                      {viaje.tramo?.origen?.denominacion}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconFlag size={14} color="red" />
                  <div>
                    <Text size="sm" fw={500}>Destino</Text>
                    <Text size="xs" c="dimmed">
                      {viaje.tramo?.destino?.denominacion}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconMapPin size={14} color="gray" />
                  <div>
                    <Text size="sm" fw={500}>Distancia</Text>
                    <Text size="xs" c="dimmed">
                      {viaje.distanciaKm} km
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <IconClock size={14} color="gray" />
                  <div>
                    <Text size="sm" fw={500}>Tiempo Estimado</Text>
                    <Text size="xs" c="dimmed">
                      {viaje.tiempoEstimadoHoras} horas
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Card>

            {viaje.estado === 'Cancelado' && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                <Text size="sm" fw={500}>Viaje Cancelado</Text>
                <Text size="xs">
                  Este viaje fue cancelado y no continuará el seguimiento.
                </Text>
              </Alert>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Modal para cambiar estado */}
      <Modal
        opened={showChangeEstado}
        onClose={() => setShowChangeEstado(false)}
        title="Cambiar Estado del Viaje"
      >
        <Stack>
          <Select
            label="Nuevo Estado"
            placeholder="Selecciona el nuevo estado"
            data={estadoOptions.filter(option => option.value !== viaje.estado)}
            value={nuevoEstado}
            onChange={(value) => setNuevoEstado(value || '')}
            required
          />

          <Textarea
            label="Observaciones"
            placeholder="Agrega una observación sobre el cambio de estado..."
            value={observacionCambio}
            onChange={(e) => setObservacionCambio(e.target.value)}
            minRows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button 
              variant="light" 
              onClick={() => setShowChangeEstado(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangeEstado}>
              Actualizar Estado
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal para agregar evento */}
      <Modal
        opened={showAddEvento}
        onClose={() => setShowAddEvento(false)}
        title="Agregar Evento de Seguimiento"
      >
        <Stack>
          <DateInput
            label="Fecha del Evento"
            placeholder="Selecciona la fecha"
            value={nuevoEvento.fecha}
            onChange={(date) => setNuevoEvento(prev => ({ 
              ...prev, 
              fecha: date ? new Date(date) : new Date() 
            }))}
            required
          />

          <Textarea
            label="Descripción del Evento"
            placeholder="Describe qué ocurrió..."
            value={nuevoEvento.descripcion}
            onChange={(e) => setNuevoEvento(prev => ({ ...prev, descripcion: e.target.value }))}
            required
            minRows={2}
          />

          <Textarea
            label="Observaciones Adicionales"
            placeholder="Información adicional sobre el evento..."
            value={nuevoEvento.observaciones}
            onChange={(e) => setNuevoEvento(prev => ({ ...prev, observaciones: e.target.value }))}
            minRows={2}
          />

          <Group justify="flex-end" mt="md">
            <Button 
              variant="light" 
              onClick={() => setShowAddEvento(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddEvento}
              disabled={!nuevoEvento.descripcion}
            >
              Agregar Evento
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}