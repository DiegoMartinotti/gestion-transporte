import { useState, useMemo, useCallback } from 'react';
import { IconTruck, IconUser, IconInfoCircle, IconFileText } from '@tabler/icons-react';
import {
  calculateAlertStatus,
  filterAlerts,
  calculateAlertStatistics,
} from '../../../utils/alerts/alertHelpers';
import { AlertData, AlertSystemConfig } from '../AlertSystemUnified';

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
    vigente: 'green',
  },
};

export const useAlertSystem = (
  alertas: AlertData[],
  config: AlertSystemConfig = DEFAULT_CONFIG,
  categoria?: string
) => {
  const [filtroEntidad, setFiltroEntidad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState(categoria || 'todos');

  const effectiveConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
    }),
    [config]
  );

  const alertasConEstado = useMemo(() => {
    return alertas.map((alerta) => ({
      ...alerta,
      ...calculateAlertStatus(alerta.fechaVencimiento, effectiveConfig),
    }));
  }, [alertas, effectiveConfig]);

  const alertasFiltradas = useMemo(() => {
    return filterAlerts(alertasConEstado, effectiveConfig, {
      entidad: filtroEntidad,
      estado: filtroEstado,
      categoria: filtroCategoria,
    });
  }, [alertasConEstado, filtroEntidad, filtroEstado, filtroCategoria, effectiveConfig]);

  const estadisticas = useMemo(() => {
    return calculateAlertStatistics(alertasFiltradas);
  }, [alertasFiltradas]);

  const getEstadoColor = useCallback(
    (estado: string) => {
      const colores = effectiveConfig.colores as Record<string, string>;
      return colores?.[estado || 'vigente'] || 'gray';
    },
    [effectiveConfig.colores]
  );

  const getEntidadIcon = useCallback((tipo: string) => {
    switch (tipo) {
      case 'vehiculo':
        return IconTruck;
      case 'personal':
        return IconUser;
      case 'empresa':
        return IconInfoCircle;
      default:
        return IconFileText;
    }
  }, []);

  return {
    filtroEntidad,
    setFiltroEntidad,
    filtroEstado,
    setFiltroEstado,
    filtroCategoria,
    setFiltroCategoria,
    effectiveConfig,
    alertasConEstado,
    alertasFiltradas,
    estadisticas,
    getEstadoColor,
    getEntidadIcon,
  };
};
