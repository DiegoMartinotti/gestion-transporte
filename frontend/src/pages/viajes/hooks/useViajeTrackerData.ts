import { useState } from 'react';
import { Viaje } from '../../../types/viaje';
import { notifications } from '@mantine/notifications';

interface EventoViaje {
  id: string;
  fecha: Date;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string;
  responsable?: string;
  ubicacion?: {
    latitud: number;
    longitud: number;
  };
}

export const useViajeTrackerData = (_viaje: Viaje) => {
  const [eventos, setEventos] = useState<EventoViaje[]>([
    {
      id: '1',
      fecha: new Date(),
      descripcion: 'Viaje iniciado',
      estado: 'completado',
      observaciones: 'Carga recogida en origen',
    },
    {
      id: '2',
      fecha: new Date(Date.now() + 3600000),
      descripcion: 'En tránsito',
      estado: 'en_progreso',
      observaciones: 'Viaje en curso hacia destino',
    },
    {
      id: '3',
      fecha: new Date(Date.now() + 7200000),
      descripcion: 'Llegada a destino',
      estado: 'pendiente',
      observaciones: 'Pendiente de entrega',
    },
  ]);

  const [selectedEvento, setSelectedEvento] = useState<EventoViaje | null>(null);
  const [nuevoEventoModal, setNuevoEventoModal] = useState(false);
  const [editarEventoModal, setEditarEventoModal] = useState(false);

  const agregarEvento = (evento: Omit<EventoViaje, 'id'>) => {
    const nuevoEvento: EventoViaje = {
      ...evento,
      id: Date.now().toString(),
    };

    setEventos((prev) =>
      [...prev, nuevoEvento].sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    );
    setNuevoEventoModal(false);

    notifications.show({
      title: 'Evento agregado',
      message: 'El evento se ha agregado correctamente',
      color: 'green',
    });
  };

  const editarEvento = (evento: EventoViaje) => {
    setEventos((prev) => prev.map((e) => (e.id === evento.id ? evento : e)));
    setEditarEventoModal(false);
    setSelectedEvento(null);

    notifications.show({
      title: 'Evento actualizado',
      message: 'El evento se ha actualizado correctamente',
      color: 'green',
    });
  };

  const eliminarEvento = (eventoId: string) => {
    setEventos((prev) => prev.filter((e) => e.id !== eventoId));

    notifications.show({
      title: 'Evento eliminado',
      message: 'El evento se ha eliminado correctamente',
      color: 'green',
    });
  };

  return {
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
  };
};
