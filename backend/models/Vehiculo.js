const mongoose = require('mongoose');

/**
 * @typedef {Object} VehiculoSchema
 * @property {string} dominio - Patente/Dominio del vehículo
 * @property {string} tipo - Tipo de vehículo (Camión, Acoplado, etc.)
 * @property {string} [marca] - Marca del vehículo
 * @property {string} [modelo] - Modelo del vehículo
 * @property {number} [año] - Año del vehículo
 * @property {string} [numeroChasis] - Número de chasis
 * @property {string} [numeroMotor] - Número de motor
 * @property {mongoose.Schema.Types.ObjectId} empresa - Empresa propietaria
 * @property {Object} documentacion - Documentación del vehículo
 * @property {boolean} activo - Estado operativo del vehículo
 */

const vehiculoSchema = new mongoose.Schema({
    dominio: {
        type: String,
        required: [true, 'La patente/dominio es obligatoria'],
        unique: true,
        trim: true,
        uppercase: true,
        validate: {
            validator: function(v) {
                // Validación para patentes argentinas (formato viejo y nuevo)
                return /^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(v);
            },
            message: 'Formato de patente inválido'
        }
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de vehículo es obligatorio'],
        enum: ['Camión', 'Acoplado', 'Semirremolque', 'Bitren', 'Furgón', 'Utilitario'],
        trim: true
    },
    marca: {
        type: String,
        trim: true
    },
    modelo: {
        type: String,
        trim: true
    },
    año: {
        type: Number,
        min: 1950,
        max: new Date().getFullYear() + 1
    },
    numeroChasis: {
        type: String,
        trim: true,
        uppercase: true
    },
    numeroMotor: {
        type: String,
        trim: true,
        uppercase: true
    },
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'La empresa es obligatoria']
    },
    documentacion: {
        seguro: {
            numero: String,
            vencimiento: Date,
            compania: String
        },
        vtv: {
            numero: String,
            vencimiento: Date
        },
        ruta: {
            numero: String,
            vencimiento: Date
        },
        senasa: {
            numero: String,
            vencimiento: Date
        }
    },
    caracteristicas: {
        capacidadCarga: Number, // en kilogramos
        tara: Number, // peso del vehículo vacío
        largo: Number, // en metros
        ancho: Number, // en metros
        alto: Number, // en metros
        configuracionEjes: String,
        tipoCarroceria: String
    },
    mantenimiento: [{
        fecha: Date,
        tipo: {
            type: String,
            enum: ['Preventivo', 'Correctivo', 'Revisión']
        },
        kilometraje: Number,
        descripcion: String,
        costo: Number
    }],
    activo: {
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

// Índices
vehiculoSchema.index({ empresa: 1, dominio: 1 });
vehiculoSchema.index({ 'documentacion.seguro.vencimiento': 1 });
vehiculoSchema.index({ 'documentacion.vtv.vencimiento': 1 });
vehiculoSchema.index({ 'documentacion.ruta.vencimiento': 1 });

// Middleware para normalizar datos
vehiculoSchema.pre('save', function(next) {
    if (this.dominio) this.dominio = this.dominio.toUpperCase();
    if (this.numeroChasis) this.numeroChasis = this.numeroChasis.toUpperCase();
    if (this.numeroMotor) this.numeroMotor = this.numeroMotor.toUpperCase();
    next();
});

// Método para verificar vencimientos próximos
vehiculoSchema.methods.getVencimientosProximos = function(diasLimite = 30) {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + diasLimite);
    
    const vencimientos = [];
    
    if (this.documentacion.seguro?.vencimiento && this.documentacion.seguro.vencimiento <= limite) {
        vencimientos.push({
            tipo: 'Seguro',
            vencimiento: this.documentacion.seguro.vencimiento
        });
    }
    
    if (this.documentacion.vtv?.vencimiento && this.documentacion.vtv.vencimiento <= limite) {
        vencimientos.push({
            tipo: 'VTV',
            vencimiento: this.documentacion.vtv.vencimiento
        });
    }
    
    return vencimientos;
};

// Método para obtener información resumida
vehiculoSchema.methods.getResumen = function() {
    return `${this.dominio} - ${this.marca} ${this.modelo} (${this.tipo})`;
};

const Vehiculo = mongoose.model('Vehiculo', vehiculoSchema);

module.exports = Vehiculo; 