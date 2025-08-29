export interface MetricaFinanciera {
  periodo: string;
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  porcentajeCobranza: number;
  cantidadPartidas: number;
  partidasVencidas: number;
  promedioTiempoCobro: number;
  clientesConDeuda: number;
}

export interface TopCliente {
  nombre: string;
  totalFacturado: number;
  totalPendiente: number;
  porcentajePendiente: number;
  diasPromedioAtraso: number;
  ultimoPago?: Date;
}

export interface TendenciaCobranza {
  mes: string;
  facturado: number;
  cobrado: number;
  eficiencia: number;
}

export interface AlertaCobranza {
  tipo: 'vencimiento' | 'cliente_riesgo' | 'meta_no_cumplida' | 'flujo_bajo';
  titulo: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  fecha: Date;
  accionSugerida?: string;
}

export interface ConfiguracionDashboard {
  periodoAnalisis: 'mes' | 'trimestre' | 'semestre' | 'anio';
  fechaDesde?: Date;
  fechaHasta?: Date;
  clientesSeleccionados?: string[];
  metaCobranzaMensual?: number;
}