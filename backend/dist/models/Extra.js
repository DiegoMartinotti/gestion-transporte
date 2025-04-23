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
/**
 * Esquema de Mongoose para el modelo Extra
 */
const extraSchema = new mongoose_1.Schema({
    tipo: {
        type: String,
        required: [true, 'El tipo de extra es obligatorio'],
        trim: true,
        uppercase: true
    },
    cliente: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: [true, 'El cliente es obligatorio'],
    },
    descripcion: {
        type: String,
        trim: true
    },
    vigenciaDesde: {
        type: Date,
        required: [true, 'La fecha de inicio de vigencia es obligatoria']
    },
    vigenciaHasta: {
        type: Date,
        required: [true, 'La fecha de fin de vigencia es obligatoria']
    },
    valor: {
        type: Number,
        required: [true, 'El valor es obligatorio'],
        min: 0,
        get: (v) => parseFloat(v.toString()).toFixed(2),
        set: (v) => parseFloat(parseFloat(v.toString()).toFixed(2))
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});
// Índice compuesto único para tipo-cliente-vigencia
extraSchema.index({
    tipo: 1,
    cliente: 1,
    vigenciaDesde: 1,
    vigenciaHasta: 1
}, {
    unique: true,
    name: "idx_tipo_cliente_vigencia"
});
// Validación de fechas
extraSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validar que vigenciaHasta sea mayor o igual a vigenciaDesde
            if (this.vigenciaHasta < this.vigenciaDesde) {
                throw new Error('La fecha de fin de vigencia debe ser mayor o igual a la fecha de inicio.');
            }
            // Verificar superposición de fechas
            const extrasExistentes = yield this.constructor.find({
                tipo: this.tipo,
                cliente: this.cliente,
                _id: { $ne: this._id }
            });
            for (const extra of extrasExistentes) {
                const esteDesde = new Date(this.vigenciaDesde);
                const esteHasta = new Date(this.vigenciaHasta);
                const otroDesde = new Date(extra.vigenciaDesde);
                const otroHasta = new Date(extra.vigenciaHasta);
                const hayConflicto = !(esteHasta < otroDesde || esteDesde > otroHasta);
                if (hayConflicto) {
                    throw new Error(`Ya existe un extra del mismo tipo para este cliente con fechas que se superponen.`);
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
const Extra = mongoose_1.default.model('Extra', extraSchema);
exports.default = Extra;
//# sourceMappingURL=Extra.js.map