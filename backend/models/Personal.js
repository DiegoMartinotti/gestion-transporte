const mongoose = require('mongoose');

/**
 * @typedef {Object} PersonalSchema
 * @property {string} nombre - Nombre del empleado
 * @property {string} apellido - Apellido del empleado
 * @property {string} dni - DNI del empleado
 * @property {string} [cuil] - CUIL del empleado
 * @property {string} tipo - Tipo de personal (Conductor, Administrativo, etc.)
 * @property {mongoose.Schema.Types.ObjectId} empresa - Empresa a la que pertenece
 * @property {string} [numeroLegajo] - Número de legajo único por empresa (generado automáticamente si no se proporciona)
 * @property {Array} periodosEmpleo - Períodos de empleo (fechas de ingreso/egreso)
 * @property {Object} documentacion - Documentación del empleado
 * @property {boolean} activo - Estado activo/inactivo del empleado
 */

const personalSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        trim: true
    },
    dni: {
        type: String,
        required: [true, 'El DNI es obligatorio'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{7,8}$/.test(v);
            },
            message: 'Formato de DNI inválido'
        }
    },
    cuil: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^[0-9]{2}-[0-9]{8}-[0-9]$/.test(v);
            },
            message: 'Formato de CUIL inválido'
        }
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de personal es obligatorio'],
        enum: ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'],
        trim: true
    },
    fechaNacimiento: {
        type: Date
    },
    direccion: {
        calle: String,
        numero: String,
        localidad: String,
        provincia: String,
        codigoPostal: String
    },
    contacto: {
        telefono: String,
        telefonoEmergencia: String,
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function(v) {
                    return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: 'Email inválido'
            }
        }
    },
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa',
        required: [true, 'La empresa es obligatoria']
    },
    numeroLegajo: {
        type: String,
        trim: true
    },
    periodosEmpleo: [{
        fechaIngreso: {
            type: Date,
            required: [true, 'La fecha de ingreso es obligatoria para cada período']
        },
        fechaEgreso: Date,
        motivo: String,
        categoria: String
    }],
    documentacion: {
        licenciaConducir: {
            numero: String,
            categoria: String,
            vencimiento: Date
        },
        carnetProfesional: {
            numero: String,
            vencimiento: Date
        },
        evaluacionMedica: {
            fecha: Date,
            vencimiento: Date,
            resultado: String
        },
        psicofisico: {
            fecha: Date,
            vencimiento: Date,
            resultado: String
        }
    },
    datosLaborales: {
        categoria: String,
        obraSocial: String,
        art: String
    },
    capacitaciones: [{
        nombre: String,
        fecha: Date,
        vencimiento: Date,
        institucion: String,
        certificado: String
    }],
    incidentes: [{
        fecha: Date,
        tipo: {
            type: String,
            enum: ['Accidente', 'Infracción', 'Otro']
        },
        descripcion: String,
        consecuencias: String
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
personalSchema.index({ empresa: 1, dni: 1 });
personalSchema.index({ empresa: 1, numeroLegajo: 1 }, { unique: true, sparse: true });
personalSchema.index({ empresa: 1, 'documentacion.licenciaConducir.vencimiento': 1 });
personalSchema.index({ empresa: 1, 'documentacion.psicofisico.vencimiento': 1 });

// Middleware para normalizar datos y generar legajo automáticamente
personalSchema.pre('save', async function(next) {
    try {
        // Normalizar datos
        if (this.nombre) this.nombre = this.nombre.toUpperCase();
        if (this.dni) this.dni = this.dni.replace(/\D/g, '');
        
        // Si no hay número de legajo, generarlo automáticamente
        if (!this.numeroLegajo && this.empresa) {
            const Personal = this.constructor;
            
            // Buscar el último legajo para esta empresa
            const ultimoPersonal = await Personal.findOne(
                { empresa: this.empresa, numeroLegajo: { $exists: true, $ne: null } },
                { numeroLegajo: 1 },
                { sort: { numeroLegajo: -1 } }
            );
            
            let nuevoNumero = 1;
            if (ultimoPersonal && ultimoPersonal.numeroLegajo) {
                // Extraer el número del último legajo (asumiendo formato numérico)
                const ultimoNumero = parseInt(ultimoPersonal.numeroLegajo, 10);
                if (!isNaN(ultimoNumero)) {
                    nuevoNumero = ultimoNumero + 1;
                }
            }
            
            // Formatear el nuevo número de legajo (con ceros a la izquierda)
            this.numeroLegajo = nuevoNumero.toString().padStart(4, '0');
        }
        // Si se proporciona un número de legajo, verificar que esté disponible
        else if (this.isModified('numeroLegajo') && this.numeroLegajo) {
            const Personal = this.constructor;
            const existeLegajo = await Personal.findOne({
                empresa: this.empresa,
                numeroLegajo: this.numeroLegajo,
                _id: { $ne: this._id } // Excluir el documento actual en caso de actualización
            });
            
            if (existeLegajo) {
                throw new Error(`El número de legajo ${this.numeroLegajo} ya está en uso en esta empresa`);
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Método para verificar vencimientos próximos
personalSchema.methods.getVencimientosProximos = function(diasLimite = 30) {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + diasLimite);
    
    const vencimientos = [];
    
    if (this.documentacion.licenciaConducir?.vencimiento && 
        this.documentacion.licenciaConducir.vencimiento <= limite) {
        vencimientos.push({
            tipo: 'Licencia de Conducir',
            vencimiento: this.documentacion.licenciaConducir.vencimiento
        });
    }
    
    if (this.documentacion.psicofisico?.vencimiento && 
        this.documentacion.psicofisico.vencimiento <= limite) {
        vencimientos.push({
            tipo: 'Psicofísico',
            vencimiento: this.documentacion.psicofisico.vencimiento
        });
    }
    
    return vencimientos;
};

// Método para obtener edad
personalSchema.methods.getEdad = function() {
    if (!this.fechaNacimiento) return null;
    const hoy = new Date();
    const edad = hoy.getFullYear() - this.fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - this.fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < this.fechaNacimiento.getDate())) {
        return edad - 1;
    }
    return edad;
};

// Método para verificar si está actualmente empleado
personalSchema.methods.estaEmpleadoActualmente = function() {
    if (!this.periodosEmpleo || this.periodosEmpleo.length === 0) return false;
    
    // Buscar el período más reciente sin fecha de egreso
    const periodoActual = this.periodosEmpleo
        .filter(periodo => !periodo.fechaEgreso)
        .sort((a, b) => b.fechaIngreso - a.fechaIngreso)[0];
    
    return !!periodoActual;
};

// Método para obtener información resumida
personalSchema.methods.getResumen = function() {
    const legajo = this.numeroLegajo ? ` [Legajo: ${this.numeroLegajo}]` : '';
    return `${this.nombre} - ${this.tipo} (DNI: ${this.dni})${legajo}`;
};

// Método estático para verificar disponibilidad de legajo
personalSchema.statics.verificarLegajoDisponible = async function(empresa, numeroLegajo, idExcluir = null) {
    const query = {
        empresa,
        numeroLegajo
    };
    
    if (idExcluir) {
        query._id = { $ne: idExcluir };
    }
    
    const existeLegajo = await this.findOne(query);
    return !existeLegajo;
};

const Personal = mongoose.model('Personal', personalSchema);

module.exports = Personal; 