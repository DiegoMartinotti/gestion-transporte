export interface Viaje {
  _id: string;
  dt?: string;
  numeroViaje?: string;
  fecha: string;
  cliente?: string | {
    _id: string;
    nombre?: string;
    Cliente?: string;
  };
  origen?: string | {
    _id: string;
    denominacion?: string;
    nombre?: string;
    Site?: string;
  };
  destino?: string | {
    _id: string;
    denominacion?: string;
    nombre?: string;
    Site?: string;
  };
  tipoTramo?: string;
  chofer?: string;
  vehiculos?: Array<{
    vehiculo: string;
    posicion: number;
    _id: string;
  }>;
  tipoUnidad?: string;
  paletas?: number;
  tarifa?: number;
  peaje?: number;
  cobros?: Array<any>;
  total: number;
  estado: 'Pendiente' | 'En Progreso' | 'Completado' | 'Cancelado' | 'Facturado';
  estadoPartida?: 'Abierta' | 'Cerrada' | 'Pagada';
  extras?: Array<{
    id: string;
    concepto: string;
    monto: number;
    descripcion: string;
  }>;
  // Propiedades adicionales para compatibilidad
  tramo?: {
    _id: string;
    denominacion: string;
    origen: {
      _id: string;
      denominacion: string;
      direccion?: string;
    };
    destino: {
      _id: string;
      denominacion: string;
      direccion?: string;
    };
    distanciaKm?: number;
    tiempoEstimadoHoras?: number;
  };
  choferes?: Array<{
    _id: string;
    nombre: string;
    apellido: string;
    licenciaNumero: string;
  }>;
  ayudantes?: Array<{
    _id: string;
    nombre: string;
    apellido: string;
  }>;
  carga?: {
    peso: number;
    volumen: number;
    descripcion: string;
    peligrosa: boolean;
    refrigerada: boolean;
  };
  distanciaKm?: number;
  tiempoEstimadoHoras?: number;
  ordenCompra?: string;
  observaciones?: string;
  montoBase?: number;
  montoExtras?: number;
  montoTotal?: number;
  totalCobrado?: number;
  documentos?: Array<{
    id: string;
    nombre: string;
    url: string;
    tipo: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ViajeFormData {
  fecha: Date;
  cliente: string;
  tramo: string;
  numeroViaje: number;
  vehiculos: string[];
  choferes: string[];
  ayudantes: string[];
  carga: {
    peso: number;
    volumen: number;
    descripcion: string;
    peligrosa: boolean;
    refrigerada: boolean;
  };
  distanciaKm: number;
  tiempoEstimadoHoras: number;
  ordenCompra: string;
  observaciones: string;
  extras: Array<{
    id: string;
    concepto: string;
    monto: number;
    descripcion: string;
  }>;
  estado: string;
  montoBase: number;
  montoExtras: number;
  montoTotal: number;
}