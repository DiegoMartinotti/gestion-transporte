export interface Viaje {
  _id: string;
  numeroViaje: number;
  fecha: string;
  cliente?: {
    _id: string;
    nombre: string;
  };
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
  vehiculos?: Array<{
    _id: string;
    patente: string;
    marca: string;
    modelo: string;
    tipo: string;
    capacidadKg: number;
  }>;
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
  distanciaKm: number;
  tiempoEstimadoHoras: number;
  ordenCompra?: string;
  observaciones?: string;
  extras: Array<{
    id: string;
    concepto: string;
    monto: number;
    descripcion: string;
  }>;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO' | 'FACTURADO';
  montoBase?: number;
  montoExtras?: number;
  montoTotal?: number;
  documentos?: Array<{
    id: string;
    nombre: string;
    url: string;
    tipo: string;
  }>;
  createdAt: string;
  updatedAt: string;
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