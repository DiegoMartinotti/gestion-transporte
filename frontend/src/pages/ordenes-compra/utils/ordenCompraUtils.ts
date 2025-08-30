/**
 * Utilidades para el manejo de órdenes de compra
 */

export const getEstadoBadgeColor = (estado: string): string => {
  switch (estado) {
    case 'Pendiente':
      return 'yellow';
    case 'Facturada':
      return 'green';
    case 'Cancelada':
      return 'red';
    default:
      return 'gray';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-AR');
};
