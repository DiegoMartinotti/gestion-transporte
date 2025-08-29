import { DashboardStats } from './MainDashboardTypes';

export const generateMockStats = (): DashboardStats => ({
  vehiculos: {
    total: 45,
    activos: 38,
    inactivos: 7,
    documentosVencidos: 3
  },
  viajes: {
    totalMes: 234,
    completados: 189,
    enProceso: 45,
    facturacionMes: 2450000
  },
  clientes: {
    total: 28,
    activos: 25,
    inactivos: 3,
    nuevosEsteMes: 2
  },
  sites: {
    total: 156,
    conCoordenadas: 142,
    sinCoordenadas: 14
  },
  facturacion: {
    mesActual: 2450000,
    mesAnterior: 2180000,
    pendienteCobro: 1250000,
    vencidas: 320000
  },
  personal: {
    total: 52,
    choferes: 38,
    administradores: 14,
    documentosVencidos: 5
  }
});

export const calculateTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral', value: string } => {
  if (previous === 0) return { trend: 'neutral' as const, value: '0%' };
  
  const percentage = ((current - previous) / previous) * 100;
  const trend: 'up' | 'down' | 'neutral' = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  
  return {
    trend,
    value: `${Math.abs(percentage).toFixed(1)}%`
  };
};