export interface DashboardStats {
  vehiculos: {
    total: number;
    activos: number;
    inactivos: number;
    documentosVencidos: number;
  };
  viajes: {
    totalMes: number;
    completados: number;
    enProceso: number;
    facturacionMes: number;
  };
  clientes: {
    total: number;
    activos: number;
    inactivos: number;
    nuevosEsteMes: number;
  };
  sites: {
    total: number;
    conCoordenadas: number;
    sinCoordenadas: number;
  };
  facturacion: {
    mesActual: number;
    mesAnterior: number;
    pendienteCobro: number;
    vencidas: number;
  };
  personal: {
    total: number;
    choferes: number;
    administradores: number;
    documentosVencidos: number;
  };
}