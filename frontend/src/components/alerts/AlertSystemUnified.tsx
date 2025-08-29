import React, { useCallback } from 'react';
import { Card } from '@mantine/core';
import { useAlertSystem } from './hooks/useAlertSystem';
import { AlertStatisticsComponent } from './components/AlertStatistics';

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

export const AlertSystemUnified: React.FC<AlertSystemProps> = ({
  alertas,
  config,
  categoria,
  onEditEntity,
}) => {
  const { effectiveConfig, estadisticas, getEntidadIcon } = useAlertSystem(
    alertas,
    config,
    categoria
  );

  const handleAlertClick = useCallback(
    (alerta: AlertData) => {
      if (onEditEntity) {
        onEditEntity(alerta.entidadId, alerta.entidadTipo);
      }
    },
    [onEditEntity]
  );

  // Suppress unused variable warnings for now - these will be used in the actual render
  void getEntidadIcon;
  void handleAlertClick;

  return (
    <Card>
      <AlertStatisticsComponent
        estadisticas={estadisticas}
        config={effectiveConfig}
        show={effectiveConfig.mostrarEstadisticas || false}
      />
    </Card>
  );
};

export default AlertSystemUnified;
