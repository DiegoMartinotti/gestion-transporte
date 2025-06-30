export interface Vehiculo {
  _id?: string;
  dominio: string;
  tipo: VehiculoTipo;
  marca?: string;
  modelo?: string;
  año?: number;
  numeroChasis?: string;
  numeroMotor?: string;
  empresa: string | { _id: string; nombre: string }; // ObjectId de Empresa o objeto empresa
  documentacion: VehiculoDocumentacion;
  caracteristicas: VehiculoCaracteristicas;
  mantenimiento: MantenimientoRecord[];
  activo: boolean;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VehiculoTipo = 'Camión' | 'Acoplado' | 'Semirremolque' | 'Bitren' | 'Furgón' | 'Utilitario';

export interface VehiculoDocumentacion {
  seguro?: {
    numero?: string;
    vencimiento?: string;
    compania?: string;
  };
  vtv?: {
    numero?: string;
    vencimiento?: string;
  };
  ruta?: {
    numero?: string;
    vencimiento?: string;
  };
  senasa?: {
    numero?: string;
    vencimiento?: string;
  };
}

export interface VehiculoCaracteristicas {
  capacidadCarga?: number; // en kilogramos
  tara?: number; // peso del vehículo vacío
  largo?: number; // en metros
  ancho?: number; // en metros
  alto?: number; // en metros
  configuracionEjes?: string;
  tipoCarroceria?: string;
  capacidadCombustible?: number; // en litros
  tipoCombustible?: string;
  dimensiones?: {
    largo?: number;
    ancho?: number;
    alto?: number;
  };
}

export interface MantenimientoRecord {
  fecha: string;
  tipo: 'Preventivo' | 'Correctivo' | 'Revisión';
  kilometraje?: number;
  descripcion: string;
  costo?: number;
}

export interface VehiculoFilter {
  empresa?: string;
  tipo?: VehiculoTipo;
  activo?: boolean;
  vencimientosProximos?: boolean;
  search?: string;
}

export interface VencimientoProximo {
  tipo: string;
  vencimiento: string;
  diasRestantes: number;
}

export interface VehiculoConVencimientos extends Vehiculo {
  vencimientosProximos: VencimientoProximo[];
}