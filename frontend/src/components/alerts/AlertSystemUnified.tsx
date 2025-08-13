import React, { useState, useMemo, useCallback } from 'react';
import { Card, Text, SimpleGrid } from '@mantine/core';
import { IconTruck, IconUser, IconFileText, IconInfoCircle } from '@tabler/icons-react';
import {
  calculateAlertStatus,
  filterAlerts,
  calculateAlertStatistics,
} from '../../utils/alerts/alertHelpers';

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
  entidadDetalle: string;
  empresa?: string;
  diasRestantes?: number;
  estado?: 'vencido' | 'critico' | 'proximo' | 'vigente';
  prioridad?: 'alta' | 'media' | 'baja';
  categoria?: string;
}

export interface AlertSystemConfig {
  diasCritico?: number;
  diasProximo?: number;
  diasVigente?: number;
  notificacionesActivas?: boolean;
  frecuenciaNotificaciones?: 'diaria' | 'semanal' | 'personalizada';
  entidadesPermitidas?: ('vehiculo' | 'personal' | 'empresa' | 'cliente')[];
  tiposAlerta?: string[];
  categoriasPermitidas?: string[];
  mostrarCalendario?: boolean;
  mostrarAlertas?: boolean;
  mostrarEstadisticas?: boolean;
  mostrarTimeline?: boolean;
  allowEdit?: boolean;
  allowRefresh?: boolean;
  allowNotificationToggle?: boolean;
  colores?: {
    vencido: string;
    critico: string;
    proximo: string;
    vigente: string;
  };
}

export interface AlertSystemProps {
  alertas: AlertData[];
  config?: AlertSystemConfig;
  variant?: 'complete' | 'alerts-only' | 'calendar-only' | 'compact' | 'summary';
  categoria?: string;
  onEditEntity?: (entidadId: string, entidadTipo: AlertData['entidadTipo']) => void;
  onRefresh?: () => void;
  onConfigChange?: (config: AlertSystemConfig) => void;
  onAlertAction?: (alertId: string, action: string) => void;
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
    vigente: 'green',
  },
};

export const AlertSystemUnified: React.FC<AlertSystemProps> = ({
  alertas,
  config = DEFAULT_CONFIG,
  categoria,
  onEditEntity,
}) => {
  const [filtroEntidad, setFiltroEntidad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState(categoria || 'todos');

  // Fix: Wrap effectiveConfig in useMemo to prevent re-renders
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
        return <IconTruck size={16} />;
      case 'personal':
        return <IconUser size={16} />;
      case 'empresa':
        return <IconInfoCircle size={16} />;
      default:
        return <IconFileText size={16} />;
    }
  }, []);

  const handleAlertClick = useCallback(
    (alerta: AlertData) => {
      if (onEditEntity) {
        onEditEntity(alerta.entidadId, alerta.entidadTipo);
      }
    },
    [onEditEntity]
  );

  const renderEstadisticas = useCallback(() => {
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
  }, [effectiveConfig, estadisticas]);

  // Suppress unused variable warnings for now - these will be used in the actual render
  void setFiltroEntidad;
  void setFiltroEstado;
  void setFiltroCategoria;
  void getEstadoColor;
  void getEntidadIcon;
  void handleAlertClick;

  return <Card>{renderEstadisticas()}</Card>;
};

export default AlertSystemUnified;
