import { EstadoPartida } from '../../../types/ordenCompra';

export type { EstadoPartida };

export interface PartidaReportData {
  numero: string;
  ordenCompra: string;
  cliente: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  fechaPago?: Date;
  diasVencimiento?: number;
}

export interface FiltrosReporte {
  estadoPartida?: EstadoPartida | '';
  cliente?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  montoMinimo?: number;
  montoMaximo?: number;
  soloVencidas?: boolean;
}

export interface ResumenFinanciero {
  totalPartidas: number;
  montoTotalOriginal: number;
  montoTotalPagado: number;
  montoTotalPendiente: number;
  porcentajePagado: number;
  partidasAbiertas: number;
  partidasPagadas: number;
  partidasVencidas: number;
  promedioTiempoPago: number;
}
