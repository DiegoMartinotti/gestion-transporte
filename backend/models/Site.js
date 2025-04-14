const mongoose = require('mongoose');

/**
 * Schema for Site management
 * @typedef {Object} SiteSchema
 * @property {string} Site - Site name (unique per client)
 * @property {string} Cliente - Client name
 * @property {string} [Direccion] - Address
 * @property {string} [Localidad] - City
 * @property {string} [Provincia] - State/Province
 * @property {string} [Codigo] - Client assigned code
 * @property {Object} [location] - Geolocation data
 */
const siteSchema = new mongoose.Schema({
    Site: {
        type: String,
        required: [true, 'El nombre del site es requerido']
    },
    Cliente: {
        type: String,
        required: [true, 'El cliente es requerido']
    },
    Codigo: {
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
    Direccion: {
        type: String,
        default: '-'
    },
    Localidad: {
        type: String,
        default: ''
    },
    Provincia: {
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
        this.Site = this.Site.trim().toUpperCase();
        this.Cliente = this.Cliente.trim().toUpperCase();
        
        if (this.Direccion) this.Direccion = this.Direccion.trim();
        if (this.Localidad) this.Localidad = this.Localidad.trim();
        if (this.Provincia) this.Provincia = this.Provincia.trim();
        if (this.Codigo) this.Codigo = this.Codigo.trim();

        next();
    } catch (error) {
        next(error);
    }
});

// Índices optimizados
siteSchema.index({ Site: 1, Cliente: 1 }, { 
    unique: true,
    collation: { locale: 'es', strength: 2 }
});
siteSchema.index({ Cliente: 1 });
siteSchema.index({ Localidad: 1, Provincia: 1 });
// Índice para garantizar Codigo único por Cliente (solo cuando Codigo existe)
siteSchema.index({ 
    Cliente: 1, 
    Codigo: 1 
}, { 
    unique: true, 
    collation: { locale: 'es', strength: 2 },
    partialFilterExpression: { Codigo: { $exists: true, $ne: '' } }
});

// Métodos de instancia
siteSchema.methods.getDireccionCompleta = function() {
    return [this.Direccion, this.Localidad, this.Provincia]
        .filter(Boolean)
        .join(', ') || 'Sin dirección';
};

// Métodos estáticos
siteSchema.statics.findByClienteAndSite = async function(cliente, site) {
    return this.findOne({
        Cliente: cliente.toUpperCase(),
        Site: site.toUpperCase()
    });
};

const Site = mongoose.model('Site', siteSchema);

module.exports = Site;
