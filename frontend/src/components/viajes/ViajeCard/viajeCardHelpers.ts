// Funciones auxiliares para ViajeCard - Extraídas para reducir duplicación y complejidad

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getEstadoBadgeColor = (estado: string): string => {
  switch (estado) {
    case 'PENDIENTE':
      return 'blue';
    case 'EN_PROGRESO':
      return 'yellow';
    case 'COMPLETADO':
      return 'green';
    case 'CANCELADO':
      return 'red';
    case 'FACTURADO':
      return 'violet';
    default:
      return 'gray';
  }
};

export const getProgressValue = (estado: string): number => {
  switch (estado) {
    case 'PENDIENTE':
      return 20;
    case 'EN_PROGRESO':
      return 60;
    case 'COMPLETADO':
      return 100;
    case 'CANCELADO':
      return 0;
    case 'FACTURADO':
      return 100;
    default:
      return 0;
  }
};

export const getProgressColor = (estado: string): string => {
  return getEstadoBadgeColor(estado); // Reutilizar la función existente
};
