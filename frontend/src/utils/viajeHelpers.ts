import { Viaje } from '../types/viaje';

export const getOrigenText = (viaje: Viaje): string => {
  if (typeof viaje.origen === 'string') {
    return viaje.origen;
  }
  if (viaje.origen && typeof viaje.origen === 'object') {
    return viaje.origen.Site || viaje.origen.nombre || viaje.origen.denominacion || '';
  }
  return viaje.tramo?.origen?.denominacion || 'N/A';
};

export const getDestinoText = (viaje: Viaje): string => {
  if (typeof viaje.destino === 'string') {
    return viaje.destino;
  }
  if (viaje.destino && typeof viaje.destino === 'object') {
    return viaje.destino.Site || viaje.destino.nombre || viaje.destino.denominacion || '';
  }
  return viaje.tramo?.destino?.denominacion || 'N/A';
};

export const getClienteText = (viaje: Viaje): string => {
  if (typeof viaje.cliente === 'string') {
    return viaje.cliente;
  }
  if (viaje.cliente && typeof viaje.cliente === 'object') {
    return viaje.cliente.Cliente || viaje.cliente.nombre || '';
  }
  return 'N/A';
};

export const getClienteId = (viaje: Viaje): string => {
  if (typeof viaje.cliente === 'string') {
    return viaje.cliente;
  }
  if (viaje.cliente && typeof viaje.cliente === 'object') {
    return viaje.cliente._id;
  }
  return '';
};

export const normalizeEstadoPartida = (estado: string | undefined): 'abierta' | 'pagada' | 'vencida' => {
  if (!estado) return 'abierta';
  
  switch (estado.toLowerCase()) {
    case 'abierta':
      return 'abierta';
    case 'cerrada':
      return 'vencida';
    case 'pagada':
      return 'pagada';
    default:
      return 'abierta';
  }
};