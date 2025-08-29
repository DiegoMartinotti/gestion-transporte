export const ESTADOS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Facturada', label: 'Facturada' },
  { value: 'Cancelada', label: 'Cancelada' },
];

export const getEstadoBadgeColor = (estado: string) => {
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

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR');
};