"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Schema de Mongoose para la Empresa
const empresaSchema = new mongoose_1.Schema({
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
            validator: function (v) {
                return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Por favor ingrese un email válido'
        }
    },
    cuit: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Vehiculo'
        }],
    personal: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Personal'
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
    timestamps: true,
    versionKey: false
});
// Añadir índices para mejorar rendimiento en búsquedas
empresaSchema.index({ cuit: 1 });
empresaSchema.index({ tipo: 1 });
// Método para obtener información completa de contacto
empresaSchema.methods.getInfoContacto = function () {
    const contacto = [];
    if (this.direccion)
        contacto.push(this.direccion);
    if (this.telefono)
        contacto.push(`Tel: ${this.telefono}`);
    if (this.mail)
        contacto.push(`Email: ${this.mail}`);
    if (this.contactoPrincipal)
        contacto.push(`Contacto: ${this.contactoPrincipal}`);
    return contacto.join(' | ') || 'Sin información de contacto';
};
// Exportar el modelo con tipado
exports.default = (0, mongoose_1.model)('Empresa', empresaSchema);
//# sourceMappingURL=Empresa.js.map