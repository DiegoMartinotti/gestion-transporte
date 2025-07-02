export interface ViajeItem {
  viaje: string;
  importe: number;
}

export interface OrdenCompra {
  _id: string;
  cliente: string;
  viajes: ViajeItem[];
  numero: string;
  fecha: string;
  importe: number;
  estado: 'Pendiente' | 'Facturada' | 'Cancelada';
  createdAt: string;
  updatedAt: string;
}

export interface OrdenCompraFormData {
  cliente: string;
  viajes: ViajeItem[];
  numero: string;
  fecha: string;
  estado: 'Pendiente' | 'Facturada' | 'Cancelada';
}

export type EstadoPartida = 'Abierta' | 'Cerrada';

export interface OrdenCompraFilter {
  cliente?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  numero?: string;
}