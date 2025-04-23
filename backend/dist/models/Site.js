"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const mongoose = require('mongoose');
/**
 * Schema for Site management
 * @typedef {Object} SiteSchema
 * @property {string} nombre - Site name (unique per client)
 * @property {mongoose.Schema.Types.ObjectId} cliente - Referencia al _id del Cliente
 * @property {string} [direccion] - Address
 * @property {string} [localidad] - City
 * @property {string} [provincia] - State/Province
 * @property {string} [codigo] - Client assigned code
 * @property {Object} [location] - Geolocation data
 */
const siteSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del site es requerido']
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: [true, 'El cliente es obligatorio'],
        index: true
    },
    codigo: {
        type: String,
        default: ''
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    direccion: {
        type: String,
        default: '-'
    },
    localidad: {
        type: String,
        default: ''
    },
    provincia: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual para obtener coordenadas en formato lat/lng
siteSchema.virtual('coordenadas').get(function () {
    if (this.location && Array.isArray(this.location.coordinates)) {
        return {
            lng: this.location.coordinates[0],
            lat: this.location.coordinates[1]
        };
    }
    return null;
});
// Pre-save middleware for validation and data cleaning
siteSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified('nombre')) {
                this.nombre = this.nombre.trim().toUpperCase();
            }
            if (this.isModified('direccion'))
                this.direccion = this.direccion.trim();
            if (this.isModified('localidad'))
                this.localidad = this.localidad.trim();
            if (this.isModified('provincia'))
                this.provincia = this.provincia.trim();
            if (this.isModified('codigo'))
                this.codigo = this.codigo.trim();
            if (this.isModified('nombre') || this.isModified('cliente')) {
                const existe = yield this.constructor.findOne({
                    cliente: this.cliente,
                    nombre: this.nombre,
                    _id: { $ne: this._id }
                }).collation({ locale: 'es', strength: 2 });
                if (existe) {
                    throw new Error(`El site "${this.nombre}" ya existe para este cliente.`);
                }
            }
            if (this.codigo && (this.isModified('codigo') || this.isModified('cliente'))) {
                const existeCodigo = yield this.constructor.findOne({
                    cliente: this.cliente,
                    codigo: this.codigo,
                    _id: { $ne: this._id }
                }).collation({ locale: 'es', strength: 2 });
                if (existeCodigo) {
                    throw new Error(`El código "${this.codigo}" ya existe para este cliente.`);
                }
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// Índices optimizados
siteSchema.index({ nombre: 1, cliente: 1 }, {
    unique: true,
    collation: { locale: 'es', strength: 2 },
    name: 'idx_nombre_cliente_unique'
});
siteSchema.index({ cliente: 1 });
siteSchema.index({ localidad: 1, provincia: 1 }, { name: 'idx_localidad_provincia' });
siteSchema.index({
    cliente: 1,
    codigo: 1
}, {
    unique: true,
    collation: { locale: 'es', strength: 2 },
    partialFilterExpression: { codigo: { $exists: true, $ne: '' } },
    name: 'idx_cliente_codigo_partial_unique'
});
// Métodos de instancia
siteSchema.methods.getDireccionCompleta = function () {
    return [this.direccion, this.localidad, this.provincia]
        .filter(Boolean)
        .join(', ') || 'Sin dirección';
};
// Métodos estáticos
siteSchema.statics.findByClienteAndNombre = function (clienteId, nombreSite) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!mongoose.Types.ObjectId.isValid(clienteId)) {
            return null;
        }
        return this.findOne({
            cliente: clienteId,
            nombre: nombreSite.toUpperCase()
        }).collation({ locale: 'es', strength: 2 });
    });
};
const Site = mongoose.model('Site', siteSchema);
module.exports = Site;
//# sourceMappingURL=Site.js.map