// Common types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Entity types based on backend models
export interface Cliente {
  _id: string;
  nombre: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  activo: boolean;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Empresa {
  _id: string;
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  razonSocial?: string;
  direccion?: string;
  telefono?: string;
  mail?: string;
  cuit?: string;
  rut?: string;
  sitioWeb?: string;
  contactoPrincipal?: string;
  flota?: string[];
  personal?: string[];
  activa: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Personal and related interfaces - aligned with backend model
export interface PersonalDireccion {
  calle?: string;
  numero?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

export interface PersonalContacto {
  telefono?: string;
  telefonoEmergencia?: string;
  email?: string;
}

export interface PeriodoEmpleo {
  fechaIngreso: Date;
  fechaEgreso?: Date;
  motivo?: string;
  categoria?: string;
}

export interface LicenciaConducir {
  numero?: string;
  categoria?: string;
  vencimiento?: Date;
}

export interface CarnetProfesional {
  numero?: string;
  vencimiento?: Date;
}

export interface EvaluacionMedica {
  fecha?: Date;
  vencimiento?: Date;
  resultado?: string;
}

export interface Psicofisico {
  fecha?: Date;
  vencimiento?: Date;
  resultado?: string;
}

export interface PersonalDocumentacion {
  licenciaConducir?: LicenciaConducir;
  carnetProfesional?: CarnetProfesional;
  evaluacionMedica?: EvaluacionMedica;
  psicofisico?: Psicofisico;
}

export interface DatosLaborales {
  categoria?: string;
  obraSocial?: string;
  art?: string;
}

export interface Capacitacion {
  nombre?: string;
  fecha?: Date;
  vencimiento?: Date;
  institucion?: string;
  certificado?: string;
}

export interface Incidente {
  fecha?: Date;
  tipo?: 'Accidente' | 'Infracción' | 'Otro';
  descripcion?: string;
  consecuencias?: string;
}

export interface VencimientoInfo {
  tipo: string;
  vencimiento: Date;
}

export interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string;
  tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  fechaNacimiento?: Date;
  direccion?: PersonalDireccion;
  contacto?: PersonalContacto;
  empresa: string | Empresa;
  numeroLegajo?: string;
  periodosEmpleo: PeriodoEmpleo[];
  documentacion?: PersonalDocumentacion;
  datosLaborales?: DatosLaborales;
  capacitaciones?: Capacitacion[];
  incidentes?: Incidente[];
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Keep legacy interface for backward compatibility
export interface DocumentoPersonal {
  tipo: string;
  numero: string;
  fechaVencimiento?: Date;
  archivo?: string;
}

export interface Site {
  _id: string;
  nombre: string;
  codigo?: string;
  direccion?: string;
  localidad?: string;
  ciudad?: string;
  provincia?: string;
  cliente: string | Cliente;
  coordenadas: {
    lat: number;
    lng: number;
  } | null;
  activo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TramoSite {
  _id: string;
  nombre: string;
  direccion: string;
  location?: {
    coordinates: [number, number];
  };
}

export interface TramoCliente {
  _id: string;
  nombre: string;
}

export interface Tramo {
  _id: string;
  origen: TramoSite;
  destino: TramoSite;
  cliente: TramoCliente;
  distancia: number;
  tarifasHistoricas: TarifaHistorica[];
  tarifaVigente?: TarifaHistorica;
  tarifasVigentes?: TarifaHistorica[];
  // Campos de la tarifa vigente a nivel raíz (desde el backend)
  tipo?: 'TRMC' | 'TRMI';
  metodoCalculo?: 'Kilometro' | 'Palet' | 'Fijo';
  valor?: number;
  valorPeaje?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  activo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TarifaHistorica {
  _id: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export interface Vehiculo {
  _id: string;
  patente: string;
  tipo: 'Camion' | 'Trailer' | 'Chasis';
  marca?: string;
  modelo?: string;
  año?: number;
  empresa: string | Empresa;
  documentacion?: DocumentoVehiculo[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentoVehiculo {
  tipo: string;
  numero?: string;
  fechaVencimiento?: Date;
  archivo?: string;
}

export interface Viaje {
  _id: string;
  numero: string;
  cliente: string | Cliente;
  tramo: string | Tramo;
  fechaViaje: Date;
  vehiculos: VehiculoViaje[];
  chofer?: string | Personal;
  kilometraje?: number;
  pesoTransportado?: number;
  precioFinal: number;
  moneda: 'USD' | 'ARS';
  extras?: ExtraViaje[];
  observaciones?: string;
  estado: 'Pendiente' | 'En Curso' | 'Completado' | 'Cancelado';
  createdAt: Date;
  updatedAt: Date;
}

export interface VehiculoViaje {
  vehiculo: string | Vehiculo;
  tipoUnidad: 'Camion' | 'Trailer' | 'Chasis';
}

export interface ExtraViaje {
  extra: string | Extra;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Extra {
  _id: string;
  nombre: string;
  descripcion?: string;
  cliente: string | Cliente;
  precio: number;
  moneda: 'USD' | 'ARS';
  tipo: 'Fijo' | 'Variable';
  fechaInicio: Date;
  fechaFin?: Date;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrdenCompra {
  _id: string;
  numero: string;
  cliente: string | Cliente;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  montoTotal: number;
  moneda: 'USD' | 'ARS';
  estadoPartida: 'Abierta' | 'Cerrada';
  viajes: string[] | Viaje[];
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usuario {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
}

// Filter types
export interface BaseFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export type ClienteFilters = BaseFilters;

export interface EmpresaFilters extends BaseFilters {
  tipo?: 'Propia' | 'Subcontratada';
  activa?: boolean;
}

export interface PersonalFilters extends BaseFilters {
  tipo?: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  empresa?: string;
}

export interface SiteFilters extends BaseFilters {
  cliente?: string;
  ciudad?: string;
  provincia?: string;
}

export interface TramoFilters extends BaseFilters {
  cliente?: string;
  origen?: string;
  destino?: string;
  conTarifa?: boolean;
  sinTarifa?: boolean;
}

export interface VehiculoFilters extends BaseFilters {
  tipo?: 'Camion' | 'Trailer' | 'Chasis';
  empresa?: string;
}

export interface ViajeFilters extends BaseFilters {
  cliente?: string;
  estado?: 'Pendiente' | 'En Curso' | 'Completado' | 'Cancelado';
  fechaDesde?: Date;
  fechaHasta?: Date;
}

// Additional types for calculations and formulas
export interface FormulaAplicada {
  formula: string;
  resultado: number;
  parametros: Record<string, unknown>;
}

export interface CalculationResult {
  precioTotal: number;
  desglose: Array<{
    concepto: string;
    valor: number;
  }>;
  formulas?: FormulaAplicada[];
}

export interface ContactoSeguimiento {
  fecha: Date;
  tipo: 'llamada' | 'email' | 'visita' | 'otro';
  descripcion: string;
  resultado?: string;
  proximaAccion?: Date;
}

// Map related types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Document types for vehicles
export interface DocumentoVehiculo {
  tipo: string;
  numero?: string;
  vencimiento?: Date;
  estado?: 'vigente' | 'vencido' | 'por_vencer';
}

// Re-export all types
export * from './reports';
export * from './forms';
export * from './validators';
export * from './excel';
