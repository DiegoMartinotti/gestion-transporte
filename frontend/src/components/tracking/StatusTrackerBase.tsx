import React from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useStatusTracker } from './hooks/useStatusTracker';
import { StatusCompactView } from './components/StatusCompactView';
import { StatusDetailedView } from './components/StatusDetailedView';
import { StatusModals } from './components/StatusModals';

// Tipos base para el tracker
export interface StatusEvent {
  id: string;
  fecha: Date;
  estado: string;
  descripcion: string;
  tipo: 'cambio_estado' | 'contacto' | 'pago' | 'ubicacion' | 'nota' | 'alerta';
  usuario?: string;
  datos?: Record<string, unknown>;
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
  metadatos?: Record<string, unknown>;
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
  onAddContact?: (contact: Record<string, unknown>) => void;
  onAddPayment?: (payment: Record<string, unknown>) => void;

  // Estados
  readonly?: boolean;
  loading?: boolean;

  // Personalización específica del dominio
  domain?: 'viajes' | 'pagos' | 'general';
  customActions?: React.ReactNode;
  customTabs?: Array<{ label: string; content: React.ReactNode }>;
}

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
  readonly = false,
  domain = 'general',
  customActions,
  customTabs = [],
}) => {
  const {
    selectedTab,
    setSelectedTab,
    newStatus,
    setNewStatus,
    statusObservation,
    setStatusObservation,
    newEvent,
    setNewEvent,
    currentStatusConfig,
    allowedNextStates,
    handleStatusChange: baseHandleStatusChange,
    handleAddEvent: baseHandleAddEvent,
  } = useStatusTracker(item, config);

  const [statusModalOpened, { open: openStatusModal, close: closeStatusModal }] =
    useDisclosure(false);
  const [eventModalOpened, { open: openEventModal, close: closeEventModal }] = useDisclosure(false);

  const handleStatusChange = () => {
    baseHandleStatusChange(onStatusChange, onAddEvent);
    closeStatusModal();
  };

  const handleAddEvent = () => {
    baseHandleAddEvent(onAddEvent);
    closeEventModal();
  };

  // Render principal
  if (variant === 'compact') {
    return (
      <StatusCompactView item={item} currentStatusConfig={currentStatusConfig} domain={domain} />
    );
  }

  return (
    <>
      <StatusDetailedView
        item={item}
        config={config}
        currentStatusConfig={currentStatusConfig}
        allowedNextStates={allowedNextStates}
        domain={domain}
        showProgress={showProgress}
        showMetadata={showMetadata}
        showEvents={showEvents}
        showActions={showActions}
        readonly={readonly}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        customTabs={customTabs}
        customActions={customActions}
        onOpenStatusModal={openStatusModal}
        onOpenEventModal={openEventModal}
      />

      <StatusModals
        statusModalOpened={statusModalOpened}
        closeStatusModal={closeStatusModal}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        statusObservation={statusObservation}
        setStatusObservation={setStatusObservation}
        allowedNextStates={allowedNextStates}
        config={config}
        onStatusChange={handleStatusChange}
        eventModalOpened={eventModalOpened}
        closeEventModal={closeEventModal}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onAddEvent={handleAddEvent}
      />
    </>
  );
};

export default StatusTrackerBase;
