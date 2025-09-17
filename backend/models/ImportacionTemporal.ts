import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Interfaz para los datos de viajes fallidos durante la importación
 */
interface FailedTripData {
  originalIndex: number;
  dt: string;
  reason: string; // 'MISSING_SITE', 'DUPLICATE_DT', etc.
  message: string;
  data: Record<string, unknown>;
}

/**
 * Interfaz para los viajes pendientes de corrección
 */
interface PendingTripData {
  originalIndex: number;
  missingReasons: string[];
  dt: string;
  fecha: Date;
  origenNombre: string;
  destinoNombre: string;
  chofer: string;
  vehiculo: string;
  paletas: number;
  [key: string]: unknown; // Para campos adicionales opcionales
}

/**
 * Interfaz para los detalles de fallos en la importación
 */
interface FailureDetails {
  missingSites: { count: number; details: string[] };
  missingPersonal: { count: number; details: string[] };
  missingVehiculos: { count: number; details: string[] };
  missingTramos: {
    count: number;
    details: Array<{ origen: string; destino: string; fecha: string }>;
  };
  duplicateDt: { count: number; details: string[] };
  invalidData: { count: number; details: string[] };
}

/**
 * Interfaz para el documento ImportacionTemporal
 */
export interface IImportacionTemporal extends Document {
  cliente: mongoose.Types.ObjectId;
  status: 'processing' | 'pending_correction' | 'retrying' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  successCountInitial: number;
  failCountInitial: number;
  failureDetails: FailureDetails;
  failedTrips: FailedTripData[];
  pendingTripsData: PendingTripData[];
  successCountRetry: number;
  failCountRetry: number;
  processedCorrectionFiles: string[];
}

const importacionTemporalSchema = new Schema<IImportacionTemporal>({
  cliente: {
    type: Schema.Types.ObjectId,
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
    reason: String,
    message: String,
    data: Object,
  }],
  // Almacena los datos completos de los viajes marcados como PENDIENTES para corrección
  pendingTripsData: [{
    originalIndex: Number,
    missingReasons: [String],
    dt: String,
    fecha: Date,
    origenNombre: String,
    destinoNombre: String,
    chofer: String,
    vehiculo: String,
    paletas: Number,
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
    type: [String],
    default: [],
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Optimizar consultas por cliente y estado
importacionTemporalSchema.index({ cliente: 1, status: 1 });

const ImportacionTemporal: Model<IImportacionTemporal> = mongoose.model<IImportacionTemporal>(
  'ImportacionTemporal', 
  importacionTemporalSchema
);

export default ImportacionTemporal; 