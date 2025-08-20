import React from 'react';
import { Modal } from '@mantine/core';
import { EventoForm } from './EventoForm';

interface EventoViaje {
  id: string;
  fecha: Date;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string;
  responsable?: string;
}

interface EventoFormData {
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones: string;
  responsable: string;
  fecha: Date;
}

interface ViajeTrackerModalsProps {
  nuevoEventoModal: boolean;
  setNuevoEventoModal: (open: boolean) => void;
  editarEventoModal: boolean;
  setEditarEventoModal: (open: boolean) => void;
  selectedEvento: EventoViaje | null;
  setSelectedEvento: (evento: EventoViaje | null) => void;
  formData: EventoFormData;
  setFormData: (data: EventoFormData) => void;
  resetForm: () => void;
  handleSubmit: () => void;
}

export const ViajeTrackerModals: React.FC<ViajeTrackerModalsProps> = ({
  nuevoEventoModal,
  setNuevoEventoModal,
  editarEventoModal,
  setEditarEventoModal,
  selectedEvento: _selectedEvento,
  setSelectedEvento,
  formData,
  setFormData,
  resetForm,
  handleSubmit,
}) => {
  return (
    <>
      {/* Modal para nuevo evento */}
      <Modal
        opened={nuevoEventoModal}
        onClose={() => {
          setNuevoEventoModal(false);
          resetForm();
        }}
        title="Nuevo Evento"
        size="md"
      >
        <EventoForm
          formData={formData}
          setFormData={setFormData}
          onCancel={() => {
            setNuevoEventoModal(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
          submitText="Agregar Evento"
        />
      </Modal>

      {/* Modal para editar evento */}
      <Modal
        opened={editarEventoModal}
        onClose={() => {
          setEditarEventoModal(false);
          setSelectedEvento(null);
          resetForm();
        }}
        title="Editar Evento"
        size="md"
      >
        <EventoForm
          formData={formData}
          setFormData={setFormData}
          onCancel={() => {
            setEditarEventoModal(false);
            setSelectedEvento(null);
            resetForm();
          }}
          onSubmit={handleSubmit}
          submitText="Guardar Cambios"
        />
      </Modal>
    </>
  );
};
