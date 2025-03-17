const mongoose = require('mongoose');

/**
 * @typedef {Object} EmpresaSchema
 * @property {string} nombre - Nombre de la empresa
 * @property {string} tipo - Tipo de empresa (Propia o Subcontratada)
 * @property {string} [razonSocial] - Razón social de la empresa
 * @property {string} [direccion] - Dirección de la empresa
 * @property {string} [telefono] - Teléfono de contacto
 * @property {string} [mail] - Correo electrónico de contacto
 * @property {string} [cuit] - CUIT de la empresa
 * @property {string} [contactoPrincipal] - Nombre del contacto principal
 * @property {mongoose.Schema.Types.ObjectId[]} [flota] - Referencias a los vehículos de la empresa
 * @property {mongoose.Schema.Types.ObjectId[]} [personal] - Referencias al personal de la empresa
 * @property {boolean} [activa] - Estado de la empresa
 * @property {string} [observaciones] - Observaciones generales
 */

const empresaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la empresa es obligatorio'],
        trim: true,
        unique: true
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de empresa es obligatorio'],
        enum: ['Propia', 'Subcontratada'],
        trim: true
    },
    razonSocial: {
        type: String,
        trim: true
    },
    direccion: {
        type: String,
        trim: true
    },
    telefono: {
        type: String,
        trim: true
    },
    mail: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Por favor ingrese un email válido'
        }
    },
    cuit: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/.test(v);
            },
            message: 'Por favor ingrese un CUIT válido'
        }
    },
    contactoPrincipal: {
        type: String,
        trim: true
    },
    flota: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehiculo' // Referencia al futuro modelo de Vehiculo
    }],
    personal: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Personal' // Referencia al futuro modelo de Personal
    }],
    activa: {
        type: Boolean,
        default: true
    },
    observaciones: {
        type: String,
        trim: true
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt
    versionKey: false
});

// Middleware para normalizar datos antes de guardar
empresaSchema.pre('save', function(next) {
    next();
});

// Método para obtener información completa de contacto
empresaSchema.methods.getInfoContacto = function() {
    const contacto = [];
    if (this.direccion) contacto.push(this.direccion);
    if (this.telefono) contacto.push(`Tel: ${this.telefono}`);
    if (this.mail) contacto.push(`Email: ${this.mail}`);
    if (this.contactoPrincipal) contacto.push(`Contacto: ${this.contactoPrincipal}`);
    return contacto.join(' | ') || 'Sin información de contacto';
};

const Empresa = mongoose.model('Empresa', empresaSchema);

module.exports = Empresa; 