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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const estadoPartida_1 = require("../utils/estadoPartida");
/**
 * @typedef {Object} OrdenCompra
 * @description Modelo que representa una Orden de Compra (OC) en el sistema.
 *
 * Una OC puede contener múltiples viajes, cada uno con su importe específico.
 * Cuando se modifica una OC (sea creación, modificación o eliminación),
 * se dispara automáticamente la actualización del estado de partida de todos
 * los viajes involucrados.
 */
const ordenCompraSchema = new mongoose_1.Schema({
    cliente: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    /**
     * Lista de viajes incluidos en la OC.
     * Cada viaje tiene su propio importe, que puede ser diferente
     * al importe calculado originalmente en el viaje.
     */
    viajes: [{
            viaje: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Viaje',
                required: true
            },
            importe: {
                type: Number,
                required: true,
                min: 0
            }
        }],
    numero: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    /**
     * Importe total de la OC.
     * Se calcula automáticamente como la suma de los importes
     * de todos los viajes incluidos.
     */
    importe: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'Facturada', 'Cancelada'],
        default: 'Pendiente'
    }
}, {
    timestamps: true
});
// Índice compuesto para evitar duplicados de número de OC por cliente
ordenCompraSchema.index({ numero: 1, cliente: 1 }, { unique: true });
/**
 * Calcula el importe total de la OC sumando los importes de todos los viajes
 * @method calcularImporteTotal
 * @returns {Promise<number>} El importe total calculado
 */
ordenCompraSchema.methods.calcularImporteTotal = function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.importe = this.viajes.reduce((total, item) => total + item.importe, 0);
        return this.importe;
    });
};
/**
 * Middleware que se ejecuta antes de guardar una OC
 * Recalcula el importe total si se modificaron los viajes
 */
ordenCompraSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('viajes')) {
            yield this.calcularImporteTotal();
        }
        next();
    });
});
/**
 * Middleware que se ejecuta después de guardar una OC
 * Actualiza el estado de partida de todos los viajes involucrados
 * usando una operación bulk optimizada
 */
ordenCompraSchema.post('save', function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (doc.isModified && doc.isModified('viajes')) {
                const viajeIds = doc.viajes.map(v => v.viaje.toString());
                yield (0, estadoPartida_1.actualizarEstadosPartidaBulk)(viajeIds);
            }
        }
        catch (error) {
            console.error('Error actualizando estados de partidas:', error);
        }
    });
});
const OrdenCompra = mongoose_1.default.model('OrdenCompra', ordenCompraSchema);
exports.default = OrdenCompra;
//# sourceMappingURL=OrdenCompra.js.map