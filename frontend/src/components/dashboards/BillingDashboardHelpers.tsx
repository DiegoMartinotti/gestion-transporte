import { MetricaFinanciera, TopCliente, TendenciaCobranza, AlertaCobranza } from './BillingDashboardTypes';

// Mock data generators
export const generateMockMetricas = (): MetricaFinanciera => ({
  periodo: 'Febrero 2024',
  totalFacturado: 8500000,
  totalCobrado: 6800000,
  totalPendiente: 1700000,
  porcentajeCobranza: 80,
  cantidadPartidas: 45,
  partidasVencidas: 8,
  promedioTiempoCobro: 28,
  clientesConDeuda: 12
});

export const generateMockTopClientes = (): TopCliente[] => [
  {
    nombre: 'TECPETROL S.A.',
    totalFacturado: 2500000,
    totalPendiente: 450000,
    porcentajePendiente: 18,
    diasPromedioAtraso: 5,
    ultimoPago: new Date('2024-02-10')
  },
  {
    nombre: 'YPF S.A.',
    totalFacturado: 3200000,
    totalPendiente: 800000,
    porcentajePendiente: 25,
    diasPromedioAtraso: 15,
    ultimoPago: new Date('2024-01-28')
  },
  {
    nombre: 'SHELL ARGENTINA S.A.',
    totalFacturado: 1800000,
    totalPendiente: 350000,
    porcentajePendiente: 19,
    diasPromedioAtraso: 8,
    ultimoPago: new Date('2024-02-05')
  }
];

export const generateMockTendencias = (): TendenciaCobranza[] => [
  { mes: 'Oct 2023', facturado: 7200000, cobrado: 6800000, eficiencia: 94 },
  { mes: 'Nov 2023', facturado: 8100000, cobrado: 7400000, eficiencia: 91 },
  { mes: 'Dic 2023', facturado: 9500000, cobrado: 8200000, eficiencia: 86 },
  { mes: 'Ene 2024', facturado: 7800000, cobrado: 7100000, eficiencia: 91 },
  { mes: 'Feb 2024', facturado: 8500000, cobrado: 6800000, eficiencia: 80 }
];

export const generateMockAlertas = (): AlertaCobranza[] => [
  {
    tipo: 'vencimiento',
    titulo: 'Partidas Vencidas',
    descripcion: '8 partidas vencidas por un total de $1.200.000',
    prioridad: 'alta',
    fecha: new Date(),
    accionSugerida: 'Contactar clientes inmediatamente'
  },
  {
    tipo: 'meta_no_cumplida',
    titulo: 'Meta de Cobranza',
    descripcion: 'Meta mensual al 80% - Faltan $1.200.000',
    prioridad: 'media',
    fecha: new Date(),
    accionSugerida: 'Intensificar gestión de cobranza'
  },
  {
    tipo: 'cliente_riesgo',
    titulo: 'Cliente en Riesgo',
    descripcion: 'YPF S.A. - 15 días promedio de atraso',
    prioridad: 'media',
    fecha: new Date(),
    accionSugerida: 'Reunión de revisión de cuenta'
  }
];

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getPrioridadColor = (prioridad: string): string => {
  switch (prioridad) {
    case 'alta': return 'red';
    case 'media': return 'yellow';
    case 'baja': return 'green';
    default: return 'gray';
  }
};