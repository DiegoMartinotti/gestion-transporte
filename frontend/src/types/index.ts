// Common types
export interface ApiResponse<T = any> {
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
  cuit: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  provincia?: string;
  cliente: string | Cliente;
  coordenadas: {
    lat: number;
    lng: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tramo {
  _id: string;
  nombre: string;
  cliente: string | Cliente;
  siteOrigen: string | Site;
  siteDestino: string | Site;
  distancia: number;
  tipoCalculo: 'Distancia' | 'Peso' | 'Tiempo' | 'Formula';
  tarifas: TarifaTramo[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TarifaTramo {
  fechaInicio: Date;
  fechaFin?: Date;
  precioBase: number;
  moneda: 'USD' | 'ARS';
  activo: boolean;
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
}

export interface ClienteFilters extends BaseFilters {}

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
  tipoCalculo?: 'Distancia' | 'Peso' | 'Tiempo' | 'Formula';
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