import React from 'react';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

// Importar componentes y helpers extraídos
import { useExpirationManager } from './hooks/useExpirationManager';
import { useExpirationRenderer } from './hooks/useExpirationRenderer';
import { ENTITY_TYPE_VEHICULO, ENTITY_TYPE_PERSONAL } from './helpers/expirationHelpers';

dayjs.extend(isBetween);

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
  onEditEntity?: (
    entidadId: string,
    entidadTipo: typeof ENTITY_TYPE_VEHICULO | typeof ENTITY_TYPE_PERSONAL
  ) => void;
  onRefresh?: () => void;
  onConfigChange?: (config: ExpirationConfig) => void;

  // Estados
  loading?: boolean;
  error?: string;
}

// Función helper para preparar props del renderer
const prepareRendererProps = (
  managerState: ReturnType<typeof useExpirationManager>,
  modalConfig: {
    configModalOpened: boolean;
    openConfigModal: () => void;
    closeConfigModal: () => void;
  },
  callbacks: {
    onEditEntity?: ExpirationManagerProps['onEditEntity'];
    onRefresh?: () => void;
    onConfigChange?: (config: ExpirationConfig) => void;
  },
  state: {
    loading?: boolean;
    error?: string;
  }
) => ({
  ...managerState,
  ...modalConfig,
  ...callbacks,
  ...state,
});

// Función helper para renderizar según variante
const renderByVariant = (
  variant: ExpirationManagerProps['variant'] = 'complete',
  renderFunctions: {
    renderCompactView: () => React.ReactElement;
    renderAlertsOnlyView: () => React.ReactElement;
    renderCalendarOnlyView: () => React.ReactElement;
    renderFullView: () => React.ReactElement;
  }
) => {
  switch (variant) {
    case 'compact':
      return renderFunctions.renderCompactView();
    case 'alerts-only':
      return renderFunctions.renderAlertsOnlyView();
    case 'calendar-only':
      return renderFunctions.renderCalendarOnlyView();
    default:
      return renderFunctions.renderFullView();
  }
};

export const ExpirationManagerBase: React.FC<ExpirationManagerProps> = ({
  documentos,
  config,
  variant = 'complete',
  onEditEntity,
  onRefresh,
  onConfigChange,
  loading = false,
  error,
}) => {
  const managerState = useExpirationManager(documentos, config);
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] =
    useDisclosure(false);

  const rendererProps = prepareRendererProps(
    managerState,
    { configModalOpened, openConfigModal, closeConfigModal },
    { onEditEntity, onRefresh, onConfigChange },
    { loading, error }
  );

  const renderFunctions = useExpirationRenderer(rendererProps);

  return renderByVariant(variant, renderFunctions);
};

export default ExpirationManagerBase;
