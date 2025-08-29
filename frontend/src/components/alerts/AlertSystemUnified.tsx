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

// Custom hook to manage alert data and filtering
const useAlertData = (alertas: AlertData[], config: AlertSystemConfig, categoria?: string) => {
  const [filtroEntidad, setFiltroEntidad] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState(categoria || 'todos');

  const effectiveConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
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

  return {
    effectiveConfig,
    alertasConEstado,
    alertasFiltradas,
    estadisticas,
    filtroEntidad,
    filtroEstado,
    filtroCategoria,
    setFiltroEntidad,
    setFiltroEstado,
    setFiltroCategoria,
  };
};

// Custom hook for UI interaction callbacks
const useAlertCallbacks = (
  effectiveConfig: AlertSystemConfig,
  onEditEntity?: (entidadId: string, entidadTipo: AlertData['entidadTipo']) => void
) => {
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

  return { getEstadoColor, getEntidadIcon, handleAlertClick };
};

export const AlertSystemUnified: React.FC<AlertSystemProps> = ({
  alertas,
  config = DEFAULT_CONFIG,
  categoria,
  onEditEntity,
}) => {
  const {
    effectiveConfig,
    estadisticas,
    setFiltroEntidad,
    setFiltroEstado,
    setFiltroCategoria,
  } = useAlertData(alertas, config, categoria);

  // Utility callbacks for UI interactions
  const { getEstadoColor, getEntidadIcon, handleAlertClick } = useAlertCallbacks(
    effectiveConfig,
    onEditEntity
  );

  // Helper function for rendering individual stat cards
  const renderStatCard = useCallback(
    (tipo: 'vencidos' | 'criticos' | 'proximos' | 'vigentes', config: AlertSystemConfig, stats: { vencidos: number; criticos: number; proximos: number; vigentes: number }) => {
      const cardConfigs = {
        vencidos: {
          value: stats.vencidos,
          label: 'Vencidos',
          color: config.colores?.vencido,
        },
        criticos: {
          value: stats.criticos,
          label: `Críticos (≤${config.diasCritico} días)`,
          color: config.colores?.critico,
        },
        proximos: {
          value: stats.proximos,
          label: `Próximos (≤${config.diasProximo} días)`,
          color: 'orange',
        },
        vigentes: {
          value: stats.vigentes,
          label: 'Vigentes',
          color: config.colores?.vigente,
        },
      };

      const cardConfig = cardConfigs[tipo];
      return (
        <Card key={tipo} withBorder p="sm" bg={`${cardConfig.color}.0`}>
          <Text ta="center" fw={700} size="xl" c={cardConfig.color}>
            {cardConfig.value}
          </Text>
          <Text ta="center" size="sm" c={cardConfig.color}>
            {cardConfig.label}
          </Text>
        </Card>
      );
    },
    []
  );

  const renderEstadisticas = useCallback(() => {
    if (!effectiveConfig.mostrarEstadisticas) return null;

    return (
      <SimpleGrid cols={4} spacing="md" mb="md">
        {(['vencidos', 'criticos', 'proximos', 'vigentes'] as const).map(tipo =>
          renderStatCard(tipo, effectiveConfig, estadisticas)
        )}
      </SimpleGrid>
    );
  }, [effectiveConfig, estadisticas, renderStatCard]);

  const renderContent = useCallback(() => {
    // Suppress unused variable warnings for now - these will be used in the actual render
    void setFiltroEntidad;
    void setFiltroEstado;
    void setFiltroCategoria;
    void getEstadoColor;
    void getEntidadIcon;
    void handleAlertClick;

    return <Card>{renderEstadisticas()}</Card>;
  }, [renderEstadisticas, setFiltroEntidad, setFiltroEstado, setFiltroCategoria, getEstadoColor, getEntidadIcon, handleAlertClick]);

  return renderContent();
};

export default AlertSystemUnified;
