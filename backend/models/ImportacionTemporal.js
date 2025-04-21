const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @typedef {Object} FailedTripData
 * @property {number} originalIndex - Índice original en el archivo subido.
 * @property {string} dt - DT del viaje.
 * @property {string} reason - Código de la razón del fallo (e.g., 'MISSING_SITE', 'DUPLICATE_DT').
 * @property {string} message - Mensaje detallado del error.
 * @property {Object} data - Datos originales del viaje tal como se recibieron o procesaron inicialmente.
 */

/**
 * @typedef {Object} ImportacionTemporalSchema
 * @description Almacena el estado y los resultados de una sesión de importación masiva de viajes.
 *              Permite el manejo en etapas y la corrección de errores.
 * @property {string} cliente - ID del cliente para el cual se realiza la importación.
 * @property {string} status - Estado actual de la importación ('processing', 'pending_correction', 'retrying', 'completed', 'failed').
 * @property {Date} createdAt - Fecha de creación del registro.
 * @property {Date} expiresAt - Fecha de expiración para limpieza automática (e.g., 24 horas).
 * @property {number} successCountInitial - Viajes importados exitosamente en la primera etapa.
 * @property {number} failCountInitial - Viajes que fallaron en la primera etapa.
 * @property {Object} failureDetails - Resumen de los tipos de fallos iniciales.
 * @property {Array<FailedTripData>} failedTrips - Array con los datos detallados de cada viaje fallido.
 * @property {number} successCountRetry - Viajes importados exitosamente en la etapa de reintento.
 * @property {number} failCountRetry - Viajes que fallaron en la etapa de reintento.
 * @property {Array<string>} processedCorrectionFiles - Tipos de plantillas de corrección que ya fueron procesadas (e.g., ['Site', 'Vehiculo']).
 */
const importacionTemporalSchema = new Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['processing', 'pending_correction', 'retrying', 'completed', 'failed'],
    default: 'processing',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Expira automáticamente después de 24 horas (86400 segundos)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: '1d' },
  },
  successCountInitial: {
    type: Number,
    default: 0,
  },
  failCountInitial: {
    type: Number,
    default: 0,
  },
  failureDetails: {
    missingSites: { count: { type: Number, default: 0 }, details: [String] },
    missingPersonal: { count: { type: Number, default: 0 }, details: [String] },
    missingVehiculos: { count: { type: Number, default: 0 }, details: [String] },
    missingTramos: {
      count: { type: Number, default: 0 },
      details: [{ origen: String, destino: String, fecha: String }],
    },
    duplicateDt: { count: { type: Number, default: 0 }, details: [String] },
    invalidData: { count: { type: Number, default: 0 }, details: [String] }, // Opcional: detallar errores de datos
  },
  // Almacena los datos completos de los viajes que fallaron en la etapa 1
  failedTrips: [{
    originalIndex: Number,
    dt: String,
    reason: String, // 'MISSING_SITE', 'DUPLICATE_DT', etc.
    message: String,
    data: Object, // Datos originales del viaje
  }],
  // Almacena los datos completos de los viajes marcados como PENDIENTES para corrección
  pendingTripsData: [{
    originalIndex: Number, // Índice original para referencia
    missingReasons: [String], // Array de razones por las que está pendiente (e.g., ['MISSING_SITE', 'MISSING_VEHICULO'])
    // Incluir los datos originales del viaje directamente en el objeto
    // Esto evita duplicar la estructura 'data' como en failedTrips y simplifica el acceso
    // Añadir aquí los campos relevantes del viaje original que se necesiten para mostrar o reintentar
    dt: String,
    fecha: Date,
    origenNombre: String,
    destinoNombre: String,
    chofer: String, // O el tipo de dato que uses para el identificador
    vehiculo: String, // O el tipo de dato que uses para las patentes
    paletas: Number,
    // Puedes añadir otros campos del viaje original si son necesarios
    // ... otros campos originales ...
  }],
  // Resultados de la etapa 2 (reintento)
  successCountRetry: {
    type: Number,
    default: 0,
  },
  failCountRetry: {
    type: Number,
    default: 0,
  },
  // Tracking de qué plantillas de corrección se han procesado
  processedCorrectionFiles: {
    type: [String], // e.g., ['Site', 'Vehiculo']
    default: [],
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Optimizar consultas por cliente y estado
importacionTemporalSchema.index({ cliente: 1, status: 1 });

const ImportacionTemporal = mongoose.model('ImportacionTemporal', importacionTemporalSchema);

module.exports = ImportacionTemporal;