"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const importacionTemporalSchema = new mongoose_1.Schema({
    cliente: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const ImportacionTemporal = mongoose_1.default.model('ImportacionTemporal', importacionTemporalSchema);
exports.default = ImportacionTemporal;
//# sourceMappingURL=ImportacionTemporal.js.map