import mongoose, { Schema } from 'mongoose';
const importacionTemporalSchema = new Schema({
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
const ImportacionTemporal = mongoose.model('ImportacionTemporal', importacionTemporalSchema);
export default ImportacionTemporal;
//# sourceMappingURL=ImportacionTemporal.js.map