import { useState } from 'react';
import { Stack, Text, Group, Grid } from '@mantine/core';
import { Viaje } from '../../types/viaje';
import { notifications } from '@mantine/notifications';
import { ViajeTrackerModals } from './components/ViajeTrackerModals';
import { EventoFormData } from './components/EventoForm';
import { useViajeTrackerData } from './hooks/useViajeTrackerData';
import { ViajeProgress } from './components/ViajeProgress';
import { ViajeInfo } from './components/ViajeInfo';
import { ViajeMainContent } from './components/ViajeMainContent';

interface EventoViaje {
  id: string;
  fecha: Date;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string;
  responsable?: string;
}

interface ViajeTrackerProps {
  viaje: Viaje;
  onUpdateEstado: (estado: string) => void;
}

const ViajeTracker: React.FC<ViajeTrackerProps> = ({ viaje, onUpdateEstado: _onUpdateEstado }) => {
  const {
    eventos,
    selectedEvento,
    setSelectedEvento,
    nuevoEventoModal,
    setNuevoEventoModal,
    editarEventoModal,
    setEditarEventoModal,
    agregarEvento,
    editarEvento,
    eliminarEvento,
  } = useViajeTrackerData(viaje);

  const [formData, setFormData] = useState<EventoFormData>({
    descripcion: '',
    estado: 'pendiente',
    observaciones: '',
    responsable: '',
    fecha: new Date(),
  });

  const resetForm = () => {
    setFormData({
      descripcion: '',
      estado: 'pendiente',
      observaciones: '',
      responsable: '',
      fecha: new Date(),
    });
  };

  const handleSubmit = () => {
    if (!formData.descripcion.trim()) {
      notifications.show({
        title: 'Error',
        message: 'La descripción es requerida',
        color: 'red',
      });
      return;
    }

    if (editarEventoModal && selectedEvento) {
      editarEvento({ ...selectedEvento, ...formData });
    } else {
      agregarEvento(formData);
    }
    resetForm();
  };

  const handleEdit = (evento: EventoViaje) => {
    setSelectedEvento(evento);
    setFormData({
      descripcion: evento.descripcion,
      estado: evento.estado,
      observaciones: evento.observaciones || '',
      responsable: evento.responsable || '',
      fecha: evento.fecha,
    });
    setEditarEventoModal(true);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Seguimiento de Viaje
          </Text>
          <Text size="sm" c="dimmed">
            {viaje.origen?.nombre} → {viaje.destino?.nombre}
          </Text>
        </div>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <ViajeMainContent
            eventos={eventos}
            onNewEvent={() => setNuevoEventoModal(true)}
            onEditEvent={handleEdit}
            onDeleteEvent={eliminarEvento}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <ViajeProgress eventos={eventos} />
            <ViajeInfo viaje={viaje} />
          </Stack>
        </Grid.Col>
      </Grid>

      <ViajeTrackerModals
        nuevoEventoModal={nuevoEventoModal}
        setNuevoEventoModal={setNuevoEventoModal}
        editarEventoModal={editarEventoModal}
        setEditarEventoModal={setEditarEventoModal}
        selectedEvento={selectedEvento}
        setSelectedEvento={setSelectedEvento}
        formData={formData}
        setFormData={setFormData}
        resetForm={resetForm}
        handleSubmit={handleSubmit}
      />
    </Stack>
  );
};

export default ViajeTracker;
