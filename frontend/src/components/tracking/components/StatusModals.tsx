import React from 'react';
import { Modal, Stack, Select, Textarea, Group, Button } from '@mantine/core';
import { StatusConfig, StatusEvent } from '../StatusTrackerBase';
import { EVENT_TYPE_OPTIONS } from '../utils/statusHelpers';

interface StatusModalsProps {
  // Modal Status
  statusModalOpened: boolean;
  closeStatusModal: () => void;
  newStatus: string;
  setNewStatus: (status: string) => void;
  statusObservation: string;
  setStatusObservation: (obs: string) => void;
  allowedNextStates: StatusConfig['estados'];
  config: StatusConfig;
  onStatusChange: () => void;

  // Modal Event
  eventModalOpened: boolean;
  closeEventModal: () => void;
  newEvent: Partial<StatusEvent>;
  setNewEvent: (event: Partial<StatusEvent>) => void;
  onAddEvent: () => void;
}

export const StatusModals: React.FC<StatusModalsProps> = ({
  statusModalOpened,
  closeStatusModal,
  newStatus,
  setNewStatus,
  statusObservation,
  setStatusObservation,
  allowedNextStates,
  config,
  onStatusChange,
  eventModalOpened,
  closeEventModal,
  newEvent,
  setNewEvent,
  onAddEvent,
}) => {
  return (
    <>
      {/* Modal cambio de estado */}
      <Modal opened={statusModalOpened} onClose={closeStatusModal} title="Cambiar Estado" size="md">
        <Stack>
          <Select
            label="Nuevo Estado"
            value={newStatus}
            onChange={(value) => setNewStatus(value || '')}
            data={allowedNextStates.map((state) => ({
              value: state.value,
              label: state.label,
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
            <Button onClick={onStatusChange} disabled={!newStatus}>
              Confirmar Cambio
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal agregar evento */}
      <Modal opened={eventModalOpened} onClose={closeEventModal} title="Agregar Evento" size="md">
        <Stack>
          <Select
            label="Tipo de Evento"
            value={newEvent.tipo}
            onChange={(value) =>
              setNewEvent((prev) => ({ ...prev, tipo: value as StatusEvent['tipo'] }))
            }
            data={EVENT_TYPE_OPTIONS}
          />

          <Textarea
            label="Descripción"
            value={newEvent.descripcion}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Describe el evento..."
            required
          />

          <Textarea
            label="Observaciones"
            value={newEvent.observaciones}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales..."
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeEventModal}>
              Cancelar
            </Button>
            <Button onClick={onAddEvent} disabled={!newEvent.descripcion}>
              Agregar Evento
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
