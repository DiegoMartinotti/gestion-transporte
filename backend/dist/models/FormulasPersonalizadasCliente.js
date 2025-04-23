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
// Definición del schema de Mongoose con tipos
const formulasPersonalizadasClienteSchema = new mongoose_1.Schema({
    clienteId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true,
        index: true // Indexar para búsquedas eficientes
    },
    tipoUnidad: {
        type: String,
        required: true,
        enum: ['Sider', 'Bitren', 'General'], // Ajustar según tipos reales si es necesario
        default: 'General', // O el valor más común
        index: true // Indexar si se busca frecuentemente por tipo
    },
    formula: {
        type: String,
        required: true,
        trim: true
    },
    vigenciaDesde: {
        type: Date,
        required: true,
        index: true // Indexar para búsquedas por fecha
    },
    vigenciaHasta: {
        type: Date,
        index: true // Indexar para búsquedas por fecha. Null indica activa indefinidamente.
    }
}, {
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});
// Índice compuesto para búsquedas comunes y validación de solapamientos
formulasPersonalizadasClienteSchema.index({ clienteId: 1, tipoUnidad: 1, vigenciaDesde: 1 });
formulasPersonalizadasClienteSchema.index({ clienteId: 1, tipoUnidad: 1, vigenciaHasta: 1 });
// Creación y exportación del modelo tipado
const FormulasPersonalizadasCliente = mongoose_1.default.model('FormulasPersonalizadasCliente', formulasPersonalizadasClienteSchema);
exports.default = FormulasPersonalizadasCliente;
//# sourceMappingURL=FormulasPersonalizadasCliente.js.map