import React, { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  Collapse,
  Divider,
  Paper,
  Progress,
  Anchor,
  Tooltip,
  Notification,
  List,
  ThemeIcon
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconBell,
  IconBellOff,
  IconFileText,
  IconTruck,
  IconUser,
  IconSettings,
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

// Interfaces para los diferentes tipos de entidades con documentos
interface DocumentoBase {
  _id: string;
  tipo: string;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  activo: boolean;
}

interface VehiculoConDocumentos {
  _id: string;
  patente: string;
  marca: string;
  modelo: string;
  documentacion?: DocumentoBase[];
}

interface PersonalConDocumentos {
  _id: string;
  nombre: string;
  apellido: string;
  tipoPersonal: string;
  documentacion?: DocumentoBase[];
}

interface AlertaVencimiento {
  id: string;
  tipo: 'vehiculo' | 'personal';
  entidad: VehiculoConDocumentos | PersonalConDocumentos;
  documento: DocumentoBase;
  diasRestantes: number;
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'vencido' | 'por-vencer' | 'vigente';
}

interface ExpirationAlertsProps {
  vehiculos?: VehiculoConDocumentos[];
  personal?: PersonalConDocumentos[];
  onRefresh?: () => void;
  autoRefresh?: boolean;
  showNotifications?: boolean;
}

const DIAS_ALERTA = {
  alta: 7,    // Alerta crítica
  media: 15,  // Alerta importante
  baja: 30    // Alerta preventiva
};

const TIPOS_DOCUMENTO_LABELS: Record<string, string> = {
  licencia_conducir: 'Licencia de Conducir',
  carnet_conducir: 'Carnet de Conducir',
  vtv: 'VTV',
  seguro: 'Seguro',
  patente: 'Patente',
  habilitacion_municipal: 'Habilitación Municipal',
  habilitacion_provincial: 'Habilitación Provincial',
  habilitacion_nacional: 'Habilitación Nacional',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  otros: 'Otros'
};

export const ExpirationAlerts: React.FC<ExpirationAlertsProps> = ({
  vehiculos = [],
  personal = [],
  onRefresh,
  autoRefresh = false,
  showNotifications = true
}) => {
  const [alertas, setAlertas] = useState<AlertaVencimiento[]>([]);
  const [alertasVencidas, setAlertasVencidas] = useState<AlertaVencimiento[]>([]);
  const [alertasPorVencer, setAlertasPorVencer] = useState<AlertaVencimiento[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(showNotifications);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const [openedVencidas, { toggle: toggleVencidas }] = useDisclosure(true);
  const [openedPorVencer, { toggle: togglePorVencer }] = useDisclosure(true);

  // Función para calcular alertas
  const calcularAlertas = React.useCallback(() => {
    const nuevasAlertas: AlertaVencimiento[] = [];
    const hoy = dayjs();

    // Procesar vehículos
    vehiculos.forEach(vehiculo => {
      vehiculo.documentacion?.forEach(doc => {
        if (!doc.fechaVencimiento || !doc.activo) return;

        const vencimiento = dayjs(doc.fechaVencimiento);
        const diasRestantes = vencimiento.diff(hoy, 'day');

        let prioridad: 'alta' | 'media' | 'baja' = 'baja';
        let estado: 'vencido' | 'por-vencer' | 'vigente' = 'vigente';

        if (diasRestantes < 0) {
          estado = 'vencido';
          prioridad = 'alta';
        } else if (diasRestantes <= DIAS_ALERTA.alta) {
          estado = 'por-vencer';
          prioridad = 'alta';
        } else if (diasRestantes <= DIAS_ALERTA.media) {
          estado = 'por-vencer';
          prioridad = 'media';
        } else if (diasRestantes <= DIAS_ALERTA.baja) {
          estado = 'por-vencer';
          prioridad = 'baja';
        }

        if (estado !== 'vigente') {
          nuevasAlertas.push({
            id: `vehiculo_${vehiculo._id}_${doc._id}`,
            tipo: 'vehiculo',
            entidad: vehiculo,
            documento: doc,
            diasRestantes,
            prioridad,
            estado
          });
        }
      });
    });

    // Procesar personal
    personal.forEach(persona => {
      persona.documentacion?.forEach(doc => {
        if (!doc.fechaVencimiento || !doc.activo) return;

        const vencimiento = dayjs(doc.fechaVencimiento);
        const diasRestantes = vencimiento.diff(hoy, 'day');

        let prioridad: 'alta' | 'media' | 'baja' = 'baja';
        let estado: 'vencido' | 'por-vencer' | 'vigente' = 'vigente';

        if (diasRestantes < 0) {
          estado = 'vencido';
          prioridad = 'alta';
        } else if (diasRestantes <= DIAS_ALERTA.alta) {
          estado = 'por-vencer';
          prioridad = 'alta';
        } else if (diasRestantes <= DIAS_ALERTA.media) {
          estado = 'por-vencer';
          prioridad = 'media';
        } else if (diasRestantes <= DIAS_ALERTA.baja) {
          estado = 'por-vencer';
          prioridad = 'baja';
        }

        if (estado !== 'vigente') {
          nuevasAlertas.push({
            id: `personal_${persona._id}_${doc._id}`,
            tipo: 'personal',
            entidad: persona,
            documento: doc,
            diasRestantes,
            prioridad,
            estado
          });
        }
      });
    });

    setAlertas(nuevasAlertas);
    setAlertasVencidas(nuevasAlertas.filter(a => a.estado === 'vencido'));
    setAlertasPorVencer(nuevasAlertas.filter(a => a.estado === 'por-vencer'));
    setLastUpdate(new Date());

    // Mostrar notificaciones si están habilitadas
    if (notificationsEnabled && nuevasAlertas.length > 0) {
      const vencidas = nuevasAlertas.filter(a => a.estado === 'vencido').length;
      const porVencer = nuevasAlertas.filter(a => a.estado === 'por-vencer' && a.prioridad === 'alta').length;

      if (vencidas > 0) {
        notifications.show({
          title: 'Documentos Vencidos',
          message: `${vencidas} documento${vencidas > 1 ? 's' : ''} vencido${vencidas > 1 ? 's' : ''}`,
          color: 'red',
          icon: <IconAlertTriangle size={16} />
        });
      }

      if (porVencer > 0) {
        notifications.show({
          title: 'Documentos por Vencer',
          message: `${porVencer} documento${porVencer > 1 ? 's' : ''} vence${porVencer > 1 ? 'n' : ''} en menos de 7 días`,
          color: 'orange',
          icon: <IconCalendar size={16} />
        });
      }
    }
  }, [vehiculos, personal, notificationsEnabled]);

  // Efecto para calcular alertas cuando cambian los datos
  useEffect(() => {
    calcularAlertas();
  }, [calcularAlertas]);

  // Auto-refresh cada 5 minutos si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      calcularAlertas();
      onRefresh?.();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [autoRefresh, calcularAlertas, onRefresh]);

  const renderAlerta = (alerta: AlertaVencimiento) => {
    const entidadNombre = alerta.tipo === 'vehiculo' 
      ? `${(alerta.entidad as VehiculoConDocumentos).marca} ${(alerta.entidad as VehiculoConDocumentos).modelo} - ${(alerta.entidad as VehiculoConDocumentos).patente}`
      : `${(alerta.entidad as PersonalConDocumentos).nombre} ${(alerta.entidad as PersonalConDocumentos).apellido}`;

    const tipoLabel = TIPOS_DOCUMENTO_LABELS[alerta.documento.tipo] || alerta.documento.tipo;

    return (
      <Card key={alerta.id} padding="sm" withBorder>
        <Group justify="space-between">
          <Group>
            <ThemeIcon 
              size="lg" 
              variant="light" 
              color={alerta.tipo === 'vehiculo' ? 'blue' : 'green'}
            >
              {alerta.tipo === 'vehiculo' ? <IconTruck size={16} /> : <IconUser size={16} />}
            </ThemeIcon>
            
            <Box>
              <Text fw={500} size="sm">{entidadNombre}</Text>
              <Text size="xs" c="dimmed">{tipoLabel}</Text>
              {alerta.documento.numero && (
                <Text size="xs" c="dimmed">N°: {alerta.documento.numero}</Text>
              )}
            </Box>
          </Group>
          
          <Box ta="right">
            <Badge
              color={alerta.estado === 'vencido' ? 'red' : 
                     alerta.prioridad === 'alta' ? 'orange' : 
                     alerta.prioridad === 'media' ? 'yellow' : 'blue'}
              variant="light"
            >
              {alerta.estado === 'vencido' 
                ? `Vencido hace ${Math.abs(alerta.diasRestantes)} días`
                : `${alerta.diasRestantes} días restantes`
              }
            </Badge>
            <Text size="xs" c="dimmed" mt={2}>
              Vence: {dayjs(alerta.documento.fechaVencimiento).format('DD/MM/YYYY')}
            </Text>
          </Box>
        </Group>
      </Card>
    );
  };

  const getResumenEstadisticas = () => {
    const total = alertas.length;
    const vencidas = alertasVencidas.length;
    const porVencerAlta = alertasPorVencer.filter(a => a.prioridad === 'alta').length;
    const porVencerMedia = alertasPorVencer.filter(a => a.prioridad === 'media').length;
    const porVencerBaja = alertasPorVencer.filter(a => a.prioridad === 'baja').length;

    return { total, vencidas, porVencerAlta, porVencerMedia, porVencerBaja };
  };

  const stats = getResumenEstadisticas();

  if (alertas.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Estado de Documentación</Title>
          <Group>
            <Tooltip label={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}>
              <ActionIcon 
                variant="light" 
                color={notificationsEnabled ? 'green' : 'gray'}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                {notificationsEnabled ? <IconBell size={16} /> : <IconBellOff size={16} />}
              </ActionIcon>
            </Tooltip>
            {onRefresh && (
              <Tooltip label="Actualizar">
                <ActionIcon variant="light" onClick={onRefresh}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
        
        <Alert color="green" icon={<IconFileText size={16} />}>
          <Text>✅ Todos los documentos están al día</Text>
          <Text size="xs" c="dimmed" mt={4}>
            Última actualización: {dayjs(lastUpdate).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Alert>
      </Paper>
    );
  }

  return (
    <Stack>
      {/* Resumen de alertas */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Alertas de Documentación</Title>
          <Group>
            <Tooltip label={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}>
              <ActionIcon 
                variant="light" 
                color={notificationsEnabled ? 'green' : 'gray'}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                {notificationsEnabled ? <IconBell size={16} /> : <IconBellOff size={16} />}
              </ActionIcon>
            </Tooltip>
            {onRefresh && (
              <Tooltip label="Actualizar">
                <ActionIcon variant="light" onClick={onRefresh}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <Group grow>
          <Card padding="sm" withBorder bg="red.0">
            <Text ta="center" fw={700} size="xl" c="red">{stats.vencidas}</Text>
            <Text ta="center" size="sm" c="red">Vencidos</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="orange.0">
            <Text ta="center" fw={700} size="xl" c="orange">{stats.porVencerAlta}</Text>
            <Text ta="center" size="sm" c="orange">Críticos (≤7 días)</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="yellow.0">
            <Text ta="center" fw={700} size="xl" c="yellow.8">{stats.porVencerMedia}</Text>
            <Text ta="center" size="sm" c="yellow.8">Importantes (≤15 días)</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="blue.0">
            <Text ta="center" fw={700} size="xl" c="blue">{stats.porVencerBaja}</Text>
            <Text ta="center" size="sm" c="blue">Preventivos (≤30 días)</Text>
          </Card>
        </Group>

        <Text size="xs" c="dimmed" ta="center" mt="md">
          Última actualización: {dayjs(lastUpdate).format('DD/MM/YYYY HH:mm')}
        </Text>
      </Paper>

      {/* Documentos vencidos */}
      {alertasVencidas.length > 0 && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={toggleVencidas}>
            <Group>
              <IconAlertTriangle size={20} color="red" />
              <Title order={5} c="red">
                Documentos Vencidos ({alertasVencidas.length})
              </Title>
            </Group>
            <ActionIcon variant="light" color="red">
              {openedVencidas ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          <Collapse in={openedVencidas}>
            <Stack>
              {alertasVencidas.map(renderAlerta)}
            </Stack>
          </Collapse>
        </Paper>
      )}

      {/* Documentos por vencer */}
      {alertasPorVencer.length > 0 && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={togglePorVencer}>
            <Group>
              <IconCalendar size={20} color="orange" />
              <Title order={5} c="orange">
                Documentos por Vencer ({alertasPorVencer.length})
              </Title>
            </Group>
            <ActionIcon variant="light" color="orange">
              {openedPorVencer ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          <Collapse in={openedPorVencer}>
            <Stack>
              {alertasPorVencer
                .sort((a, b) => a.diasRestantes - b.diasRestantes)
                .map(renderAlerta)}
            </Stack>
          </Collapse>
        </Paper>
      )}
    </Stack>
  );
};

export default ExpirationAlerts;