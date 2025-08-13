import React, { useState, useEffect } from 'react';
import { Alert, Group, Stack, Text, Title, ActionIcon, Paper, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendar,
  IconBell,
  IconBellOff,
  IconFileText,
  IconRefresh,
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
  alta: 7, // Alerta crítica
  media: 15, // Alerta importante
  baja: 30, // Alerta preventiva
};

const ESTADOS_DOCUMENTO = {
  VENCIDO: 'vencido' as const,
  POR_VENCER: 'por-vencer' as const,
  VIGENTE: 'vigente' as const,
};

const PRIORIDADES = {
  ALTA: 'alta' as const,
  MEDIA: 'media' as const,
  BAJA: 'baja' as const,
};

// Constantes para strings duplicados
const STRING_PLURALS = {
  documento: (count: number) => `documento${count > 1 ? 's' : ''}`,
  vencido: (count: number) => `vencido${count > 1 ? 's' : ''}`,
  vence: (count: number) => `vence${count > 1 ? 'n' : ''}`,
};

const NOTIFICATION_MESSAGES = {
  VENCIDOS_TITLE: 'Documentos Vencidos',
  POR_VENCER_TITLE: 'Documentos por Vencer',
  CRITICOS_MESSAGE: 'en menos de 7 días',
} as const;

// Fixed: Avoid duplicated string literals
const TOOLTIP_LABELS = {
  DISABLE_NOTIFICATIONS: 'Desactivar notificaciones',
  ENABLE_NOTIFICATIONS: 'Activar notificaciones',
  REFRESH: 'Actualizar',
} as const;

// Unused constants removed

// Helper functions to reduce complexity
const calcularEstadoYPrioridad = (diasRestantes: number) => {
  if (diasRestantes < 0) {
    return { estado: ESTADOS_DOCUMENTO.VENCIDO, prioridad: PRIORIDADES.ALTA };
  } else if (diasRestantes <= DIAS_ALERTA.alta) {
    return { estado: ESTADOS_DOCUMENTO.POR_VENCER, prioridad: PRIORIDADES.ALTA };
  } else if (diasRestantes <= DIAS_ALERTA.media) {
    return { estado: ESTADOS_DOCUMENTO.POR_VENCER, prioridad: PRIORIDADES.MEDIA };
  } else if (diasRestantes <= DIAS_ALERTA.baja) {
    return { estado: ESTADOS_DOCUMENTO.POR_VENCER, prioridad: PRIORIDADES.BAJA };
  } else {
    return { estado: ESTADOS_DOCUMENTO.VIGENTE, prioridad: PRIORIDADES.BAJA };
  }
};

const procesarDocumentoParaAlerta = (
  documento: DocumentoBase,
  entidadId: string,
  entidad: VehiculoConDocumentos | PersonalConDocumentos,
  tipo: 'vehiculo' | 'personal'
): AlertaVencimiento | null => {
  if (!documento.fechaVencimiento || !documento.activo) return null;

  const vencimiento = dayjs(documento.fechaVencimiento);
  const diasRestantes = vencimiento.diff(dayjs(), 'day');
  const { estado, prioridad } = calcularEstadoYPrioridad(diasRestantes);

  if (estado === ESTADOS_DOCUMENTO.VIGENTE) return null;

  return {
    id: `${tipo}_${entidadId}_${documento._id}`,
    tipo,
    entidad,
    documento,
    diasRestantes,
    prioridad,
    estado,
  };
};

const procesarVehiculosParaAlertas = (vehiculos: VehiculoConDocumentos[]): AlertaVencimiento[] => {
  const alertas: AlertaVencimiento[] = [];

  vehiculos.forEach((vehiculo) => {
    vehiculo.documentacion?.forEach((doc) => {
      const alerta = procesarDocumentoParaAlerta(doc, vehiculo._id, vehiculo, 'vehiculo');
      if (alerta) alertas.push(alerta);
    });
  });

  return alertas;
};

const procesarPersonalParaAlertas = (personal: PersonalConDocumentos[]): AlertaVencimiento[] => {
  const alertas: AlertaVencimiento[] = [];

  personal.forEach((persona) => {
    persona.documentacion?.forEach((doc) => {
      const alerta = procesarDocumentoParaAlerta(doc, persona._id, persona, 'personal');
      if (alerta) alertas.push(alerta);
    });
  });

  return alertas;
};

export const ExpirationAlerts: React.FC<ExpirationAlertsProps> = (props) => {
  const {
    vehiculos = [],
    personal = [],
    onRefresh,
    autoRefresh = false,
    showNotifications = true,
  } = props;

  const [alertas, setAlertas] = useState<AlertaVencimiento[]>([]);
  const [alertasVencidas, setAlertasVencidas] = useState<AlertaVencimiento[]>([]);
  const [alertasPorVencer, setAlertasPorVencer] = useState<AlertaVencimiento[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(showNotifications);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [openedVencidas, { toggle: toggleVencidas }] = useDisclosure(true);
  const [openedPorVencer, { toggle: togglePorVencer }] = useDisclosure(true);

  const procesarAlertas = (nuevasAlertas: AlertaVencimiento[]) => {
    setAlertas(nuevasAlertas);
    setAlertasVencidas(nuevasAlertas.filter((a) => a.estado === ESTADOS_DOCUMENTO.VENCIDO));
    setAlertasPorVencer(nuevasAlertas.filter((a) => a.estado === ESTADOS_DOCUMENTO.POR_VENCER));
    setLastUpdate(new Date());
  };

  const handleNotifications = React.useCallback(
    (nuevasAlertas: AlertaVencimiento[]) => {
      if (!notificationsEnabled) return;

      const vencidas = nuevasAlertas.filter((a) => a.estado === ESTADOS_DOCUMENTO.VENCIDO).length;
      const porVencerCriticos = nuevasAlertas.filter(
        (a) => a.estado === ESTADOS_DOCUMENTO.POR_VENCER && a.prioridad === PRIORIDADES.ALTA
      ).length;

      if (vencidas > 0) {
        notifications.show({
          title: NOTIFICATION_MESSAGES.VENCIDOS_TITLE,
          message: `${vencidas} ${STRING_PLURALS.documento(vencidas)} ${STRING_PLURALS.vencido(vencidas)}`,
          color: 'red',
          icon: <IconAlertTriangle size={16} />,
        });
      }

      if (porVencerCriticos > 0) {
        notifications.show({
          title: NOTIFICATION_MESSAGES.POR_VENCER_TITLE,
          message: `${porVencerCriticos} ${STRING_PLURALS.documento(porVencerCriticos)} ${STRING_PLURALS.vence(porVencerCriticos)} ${NOTIFICATION_MESSAGES.CRITICOS_MESSAGE}`,
          color: 'orange',
          icon: <IconCalendar size={16} />,
        });
      }
    },
    [notificationsEnabled]
  );

  const calcularAlertas = React.useCallback(() => {
    const alertasVehiculos = procesarVehiculosParaAlertas(vehiculos);
    const alertasPersonal = procesarPersonalParaAlertas(personal);
    const nuevasAlertas = [...alertasVehiculos, ...alertasPersonal];

    procesarAlertas(nuevasAlertas);
    handleNotifications(nuevasAlertas);
  }, [vehiculos, personal, handleNotifications]);

  useEffect(() => {
    calcularAlertas();
  }, [calcularAlertas]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(
      () => {
        calcularAlertas();
        onRefresh?.();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [autoRefresh, calcularAlertas, onRefresh]);

  if (alertas.length === 0) {
    return (
      <EmptyState
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        onRefresh={onRefresh}
        lastUpdate={lastUpdate}
      />
    );
  }

  return (
    <AlertsList
      alertas={alertas}
      alertasVencidas={alertasVencidas}
      alertasPorVencer={alertasPorVencer}
      notificationsEnabled={notificationsEnabled}
      setNotificationsEnabled={setNotificationsEnabled}
      onRefresh={onRefresh}
      lastUpdate={lastUpdate}
      openedVencidas={openedVencidas}
      toggleVencidas={toggleVencidas}
      openedPorVencer={openedPorVencer}
      togglePorVencer={togglePorVencer}
    />
  );
};

// Helper components to reduce complexity
const EmptyState: React.FC<{
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  onRefresh?: () => void;
  lastUpdate: Date;
}> = ({ notificationsEnabled, setNotificationsEnabled, onRefresh, lastUpdate }) => (
  <Paper p="md" withBorder>
    <Group justify="space-between" mb="md">
      <Title order={4}>Estado de Documentación</Title>
      <Group>
        <Tooltip
          label={
            notificationsEnabled
              ? TOOLTIP_LABELS.DISABLE_NOTIFICATIONS
              : TOOLTIP_LABELS.ENABLE_NOTIFICATIONS
          }
        >
          <ActionIcon
            variant="light"
            color={notificationsEnabled ? 'green' : 'gray'}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? <IconBell size={16} /> : <IconBellOff size={16} />}
          </ActionIcon>
        </Tooltip>
        {onRefresh && (
          <Tooltip label={TOOLTIP_LABELS.REFRESH}>
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

const AlertsList: React.FC<{
  alertas: AlertaVencimiento[];
  alertasVencidas: AlertaVencimiento[];
  alertasPorVencer: AlertaVencimiento[];
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  onRefresh?: () => void;
  lastUpdate: Date;
  openedVencidas: boolean;
  toggleVencidas: () => void;
  openedPorVencer: boolean;
  togglePorVencer: () => void;
}> = (props) => {
  const {
    alertas,
    alertasVencidas,
    alertasPorVencer,
    notificationsEnabled,
    setNotificationsEnabled,
    onRefresh,
    lastUpdate,
    openedVencidas,
    toggleVencidas,
    openedPorVencer,
    togglePorVencer,
  } = props;

  const getResumenEstadisticas = () => {
    const total = alertas.length;
    const vencidas = alertasVencidas.length;
    const porVencerAlta = alertasPorVencer.filter((a) => a.prioridad === 'alta').length;
    const porVencerMedia = alertasPorVencer.filter((a) => a.prioridad === 'media').length;
    const porVencerBaja = alertasPorVencer.filter((a) => a.prioridad === 'baja').length;

    return { total, vencidas, porVencerAlta, porVencerMedia, porVencerBaja };
  };

  const stats = getResumenEstadisticas();

  return (
    <Stack>
      <AlertsHeader
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        onRefresh={onRefresh}
        stats={stats}
        lastUpdate={lastUpdate}
      />

      <AlertsCollapsibleSections
        alertasVencidas={alertasVencidas}
        alertasPorVencer={alertasPorVencer}
        openedVencidas={openedVencidas}
        toggleVencidas={toggleVencidas}
        openedPorVencer={openedPorVencer}
        togglePorVencer={togglePorVencer}
      />
    </Stack>
  );
};

// TODO: Implement AlertsHeader and AlertsCollapsibleSections components
const AlertsHeader = ({ ..._props }: Record<string, unknown>) => null;
const AlertsCollapsibleSections = ({ ..._props }: Record<string, unknown>) => null;

export default ExpirationAlerts;
