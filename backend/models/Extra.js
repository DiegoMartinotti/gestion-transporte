const mongoose = require('mongoose');

/**
 * @typedef {Object} ExtraSchema
 * @property {string} tipo - Tipo de extra
 * @property {string} cliente - Cliente al que aplica el extra
 * @property {string} [descripcion] - Descripción opcional del extra
 * @property {Date} vigenciaDesde - Fecha de inicio de vigencia
 * @property {Date} vigenciaHasta - Fecha de fin de vigencia
 * @property {number} valor - Valor del extra
 */
const extraSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: [true, 'El tipo de extra es obligatorio'],
        trim: true,
        uppercase: true
    },
    cliente: {
        type: String,
        required: [true, 'El cliente es obligatorio'],
        trim: true,
        uppercase: true
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
        get: v => parseFloat(v).toFixed(2),
        set: v => parseFloat(parseFloat(v).toFixed(2))
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
extraSchema.pre('save', async function(next) {
    try {
        // Validar que vigenciaHasta sea mayor o igual a vigenciaDesde
        if (this.vigenciaHasta < this.vigenciaDesde) {
            throw new Error('La fecha de fin de vigencia debe ser mayor o igual a la fecha de inicio.');
        }

        // Verificar superposición de fechas
        const extrasExistentes = await this.constructor.find({
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
    } catch (error) {
        next(error);
    }
});

const Extra = mongoose.model('Extra', extraSchema);
module.exports = Extra; 