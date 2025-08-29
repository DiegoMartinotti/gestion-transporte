export interface ChartsData {
  facturacion: Array<{ mes: string; monto: number; year: number }>;
  viajes: Array<{ mes: string; completados: number; pendientes: number; cancelados: number }>;
  vehiculos: Array<{ name: string; value: number; color: string }>;
  clientes: Array<{ mes: string; nuevos: number; activos: number }>;
}

export const generateMockChartsData = (): ChartsData => ({
  facturacion: [
    { mes: 'Ene', monto: 1850000, year: 2024 },
    { mes: 'Feb', monto: 2100000, year: 2024 },
    { mes: 'Mar', monto: 1950000, year: 2024 },
    { mes: 'Abr', monto: 2300000, year: 2024 },
    { mes: 'May', monto: 2150000, year: 2024 },
    { mes: 'Jun', monto: 2450000, year: 2024 }
  ],
  viajes: [
    { mes: 'Ene', completados: 145, pendientes: 23, cancelados: 8 },
    { mes: 'Feb', completados: 167, pendientes: 18, cancelados: 5 },
    { mes: 'Mar', completados: 189, pendientes: 25, cancelados: 12 },
    { mes: 'Abr', completados: 201, pendientes: 31, cancelados: 9 },
    { mes: 'May', completados: 178, pendientes: 19, cancelados: 7 },
    { mes: 'Jun', completados: 234, pendientes: 28, cancelados: 11 }
  ],
  vehiculos: [
    { name: 'Camiones', value: 25, color: 'blue' },
    { name: 'Camionetas', value: 12, color: 'cyan' },
    { name: 'Utilitarios', value: 8, color: 'orange' },
    { name: 'Mantenimiento', value: 3, color: 'red' }
  ],
  clientes: [
    { mes: 'Ene', nuevos: 2, activos: 22 },
    { mes: 'Feb', nuevos: 1, activos: 23 },
    { mes: 'Mar', nuevos: 3, activos: 25 },
    { mes: 'Abr', nuevos: 0, activos: 24 },
    { mes: 'May', nuevos: 2, activos: 26 },
    { mes: 'Jun', nuevos: 1, activos: 25 }
  ]
});

export const createCurrencyFormatter = () => 
  (value: number) => 
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);

export const calculateClientStats = (clientesData: ChartsData['clientes']) => {
  const avgNewClients = Math.round(
    clientesData.reduce((acc, item) => acc + item.nuevos, 0) / clientesData.length
  );
  return { avgNewClients };
};