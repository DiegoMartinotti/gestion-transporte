import mongoose, { Document, Schema, Types, model } from 'mongoose';

/**
 * Interface for Site document
 */
export interface ISite extends Document {
    nombre: string;
    cliente: Types.ObjectId;
    codigo?: string;
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    direccion?: string;
    localidad?: string;
    provincia?: string;
    createdAt: Date;
    updatedAt: Date;
    
    // Virtual properties
    coordenadas: {
        lng: number;
        lat: number;
    } | null;
    
    // Instance methods
    getDireccionCompleta(): string;
}

/**
 * Interface for Site Model with static methods
 */
export interface ISiteModel extends mongoose.Model<ISite> {
    findByClienteAndNombre(clienteId: string | Types.ObjectId, nombreSite: string): Promise<ISite | null>;
}

/**
 * Schema for Site management
 */
const siteSchema = new Schema<ISite>({
    nombre: {
        type: String,
        required: [true, 'El nombre del site es requerido']
    },
    cliente: {
        type: Schema.Types.ObjectId,
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
            type: [Number],  // [longitude, latitude]
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
siteSchema.virtual('coordenadas').get(function() {
    if (this.location && Array.isArray(this.location.coordinates)) {
        return {
            lng: this.location.coordinates[0],
            lat: this.location.coordinates[1]
        };
    }
    return null;
});

// Pre-save middleware for validation and data cleaning
siteSchema.pre('save', async function(next) {
    try {
        if (this.isModified('nombre')) {
           this.nombre = this.nombre.trim().toUpperCase();
        }

        if (this.isModified('direccion')) this.direccion = this.direccion?.trim();
        if (this.isModified('localidad')) this.localidad = this.localidad?.trim();
        if (this.isModified('provincia')) this.provincia = this.provincia?.trim();
        if (this.isModified('codigo')) this.codigo = this.codigo?.trim();

        if (this.isModified('nombre') || this.isModified('cliente')) {
            const SiteModel = this.constructor as ISiteModel;
            const existe = await SiteModel.findOne({
                cliente: this.cliente,
                nombre: this.nombre,
                _id: { $ne: this._id }
            }).collation({ locale: 'es', strength: 2 });
            if (existe) {
                 throw new Error(`El site "${this.nombre}" ya existe para este cliente.`);
            }
        }
        
        if (this.codigo && (this.isModified('codigo') || this.isModified('cliente'))) {
            const SiteModel = this.constructor as ISiteModel;
            const existeCodigo = await SiteModel.findOne({
                cliente: this.cliente,
                codigo: this.codigo,
                 _id: { $ne: this._id }
            }).collation({ locale: 'es', strength: 2 });
             if (existeCodigo) {
                 throw new Error(`El código "${this.codigo}" ya existe para este cliente.`);
            }
        }

        next();
    } catch (error) {
        next(error as Error);
    }
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
siteSchema.methods.getDireccionCompleta = function(): string {
    return [this.direccion, this.localidad, this.provincia]
        .filter(Boolean)
        .join(', ') || 'Sin dirección';
};

// Métodos estáticos
siteSchema.statics.findByClienteAndNombre = async function(
    clienteId: string | Types.ObjectId,
    nombreSite: string
): Promise<ISite | null> {
     if (!Types.ObjectId.isValid(clienteId)) {
        return null;
     }
    return this.findOne({
        cliente: clienteId,
        nombre: nombreSite.toUpperCase()
    }).collation({ locale: 'es', strength: 2 });
};

const Site = model<ISite, ISiteModel>('Site', siteSchema);

export default Site;