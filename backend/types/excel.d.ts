/**
 * Tipos para datos de Excel import/export
 */

/**
 * Datos de site desde Excel
 */
export interface ExcelSiteData {
  nombre: string;
  codigo?: string;
  direccion: string;
  localidad: string;
  provincia: string;
  latitud?: number;
  longitud?: number;
}

/**
 * Datos de personal desde Excel
 */
export interface ExcelPersonalData {
  nombre: string;
  apellido: string;
  dni: string;
  empresa: string;
  telefono?: string;
  mail?: string;
  direccion?: string;
  fechaNacimiento?: Date;
  tipoCarnet?: string;
}

/**
 * Datos de vehículo desde Excel
 */
export interface ExcelVehiculoData {
  patente: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidadPalets?: number;
  capacidadKg?: number;
  año?: number;
  empresa: string;
}

/**
 * Datos de tramo desde Excel
 */
export interface ExcelTramoData {
  origen: string;
  destino: string;
  distanciaKm?: number;
  tiempoEstimadoMinutos?: number;
  metodoPago?: string;
  montoBase?: number;
}

/**
 * Resultado de importación de Excel
 */
export interface ExcelImportResult {
  exitosos: number;
  errores: Array<{
    fila: number;
    error: string;
  }>;
  datos?: unknown[];
}
