import { EstadoPartida } from '../../../types/ordenCompra';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getEstadoColor = (estado: EstadoPartida): string => {
  const colorMap: Record<EstadoPartida, string> = {
    abierta: 'blue',
    pagada: 'green',
    vencida: 'red',
  };

  return colorMap[estado] || 'gray';
};
