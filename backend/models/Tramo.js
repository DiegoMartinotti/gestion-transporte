const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Site = mongoose.model('Site');
const { calcularDistanciaRuta } = require('../services/routingService');

const tramoSchema = new Schema({
    origen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        required: [true, 'El origen es obligatorio']
    },
    destino: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        required: [true, 'El destino es obligatorio']
    },
    tipo: {
        type: String,
        enum: ['TRMC', 'TRMI'],
        default: 'TRMC',
        required: true
    },
    cliente: {
        type: String,
        required: [true, 'El cliente es obligatorio']
    },
    metodoCalculo: {
        type: String,
        enum: ['Kilometro', 'Palet', 'Fijo'],
        default: 'Palet'
    },
    valor: {
        type: Number,
        required: [true, 'El valor es obligatorio'],
        min: 0
    },
    valorPeaje: {
        type: Number,
        default: 0,
        min: 0
    },
    vigenciaDesde: {
        type: Date,
        required: [true, 'La fecha de inicio de vigencia es obligatoria']
    },
    vigenciaHasta: {
        type: Date,
        required: [true, 'La fecha de fin de vigencia es obligatoria']
    },
    distancia: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true,
    collection: 'tramos' 
});

// Definir índice compuesto que incluya el tipo
tramoSchema.index({ 
    origen: 1, 
    destino: 1, 
    cliente: 1, 
    tipo: 1, // Incluir tipo en el índice único para permitir diferentes tipos en misma ruta
    vigenciaDesde: 1,
    vigenciaHasta: 1,
    metodoCalculo: 1
}, { 
    name: "origen_destino_cliente_tipo_fechas_metodo",
    unique: true,
    background: true 
});

// También mantener un índice de búsqueda general
tramoSchema.index({ 
    origen: 1, 
    destino: 1, 
    tipo: 1,
    cliente: 1, 
    metodoCalculo: 1
}, { 
    name: "idx_tramo_base",
    background: true 
});

// Middleware para calcular distancia automáticamente
tramoSchema.pre('save', async function(next) {
    try {
        // Solo calcular distancia si tenemos origen y destino
        if (this.origen && this.destino) {
            // Cargar los sitios con sus coordenadas
            const origenSite = await Site.findById(this.origen).select('location');
            const destinoSite = await Site.findById(this.destino).select('location');

            if (origenSite?.location?.coordinates?.length === 2 && 
                destinoSite?.location?.coordinates?.length === 2) {
                
                console.log('[DISTANCIA] Calculando distancia entre:', {
                    origen: origenSite.location.coordinates,
                    destino: destinoSite.location.coordinates
                });
                
                try {
                    const distanciaKm = await calcularDistanciaRuta(
                        origenSite.location.coordinates, 
                        destinoSite.location.coordinates
                    );
                    
                    // Actualizar el campo de distancia
                    this.distancia = distanciaKm;
                    console.log(`[DISTANCIA] ✅ Distancia calculada: ${distanciaKm} km`);
                } catch (routeError) {
                    console.error('[DISTANCIA] ❌ Error calculando distancia:', routeError.message);
                    // No interrumpimos el guardado si falla el cálculo de distancia
                }
            } else {
                console.warn('[DISTANCIA] ⚠️ No se pudo calcular distancia: coordenadas faltantes');
            }
        }
        next();
    } catch (error) {
        console.error('[DISTANCIA] ❌ Error en middleware de cálculo de distancia:', error);
        // No interrumpimos el guardado si falla el cálculo de distancia
        next();
    }
});

// Método para validar que no se superpongan fechas
tramoSchema.pre('save', async function(next) {
    try {
        // Validar que vigenciaHasta sea mayor o igual a vigenciaDesde
        if (this.vigenciaHasta < this.vigenciaDesde) {
            throw new Error('La fecha de fin de vigencia debe ser mayor o igual a la fecha de inicio.');
        }
        
        // Normalizar el tipo a mayúsculas
        if (this.tipo) {
            this.tipo = this.tipo.toUpperCase();
        }
        
        console.log('[VALIDACIÓN] Validando tramo:', {
            origen: this.origen,
            destino: this.destino,
            tipo: this.tipo,
            metodoCalculo: this.metodoCalculo,
            cliente: this.cliente,
            vigenciaDesde: this.vigenciaDesde,
            vigenciaHasta: this.vigenciaHasta
        });
        
        // IMPORTANTE: Incluir explícitamente el tipo en la consulta
        const tramosExistentes = await this.constructor.find({
            origen: this.origen,
            destino: this.destino,
            tipo: this.tipo, // Buscar solo tramos con el mismo tipo
            metodoCalculo: this.metodoCalculo,
            cliente: this.cliente,
            _id: { $ne: this._id } // Excluir este documento si se está actualizando
        });
        
        console.log(`[VALIDACIÓN] Encontrados ${tramosExistentes.length} tramos existentes con misma ruta, tipo (${this.tipo}) y método`);
        
        // Verificar superposición de fechas
        for (const tramo of tramosExistentes) {
            // Versión más explícita y legible de la verificación
            const esteDesde = new Date(this.vigenciaDesde);
            const esteHasta = new Date(this.vigenciaHasta);
            const otroDesde = new Date(tramo.vigenciaDesde);
            const otroHasta = new Date(tramo.vigenciaHasta);
            
            // Comprobación explícita para debugging - una fecha termina antes de que la otra empiece
            const noHayConflicto = esteHasta < otroDesde || esteDesde > otroHasta;
            const hayConflicto = !noHayConflicto;
            
            console.log(`[VALIDACIÓN] Comparando fechas: [${esteDesde.toISOString()} - ${esteHasta.toISOString()}] vs [${otroDesde.toISOString()} - ${otroHasta.toISOString()}]`);
            console.log(`[VALIDACIÓN] ¿Hay conflicto?: ${hayConflicto}`);
            
            if (hayConflicto) {
                throw new Error(`Ya existe un tramo con las mismas características (${this.tipo}) y fechas que se superponen.`);
            }
        }
        
        console.log('[VALIDACIÓN] ✅ Validación exitosa, no hay conflictos');
        next();
    } catch (error) {
        console.error('[VALIDACIÓN] ❌ Error en validación de tramo:', error);
        next(error);
    }
});

// Método para crear una descripción humanizada del tramo
tramoSchema.virtual('descripcion').get(function() {
    return `${this.origen} → ${this.destino} (${this.tipo}/${this.metodoCalculo})`;
});

// Asegurarnos que el tipo de tramo siempre esté en mayúsculas
tramoSchema.pre('save', function(next) {
    if (this.tipo) {
        this.tipo = this.tipo.toUpperCase();
    }
    next();
});

// Validaciones adicionales
tramoSchema.path('destino').validate(function(value) {
    return String(value) !== String(this.origen);
}, 'El origen y el destino no pueden ser el mismo Site');

tramoSchema.path('vigenciaHasta').validate(function(value) {
    return this.vigenciaDesde <= value;
}, 'La fecha de fin de vigencia debe ser posterior a la fecha de inicio');

// Modificando la validación para permitir valor 0 en tramos con método Palet
tramoSchema.path('valor').validate(function(value) {
    switch (this.metodoCalculo) {
        case 'Kilometro':
            return value >= 0; // Cambiado para permitir 0
        case 'Palet':
            return value >= 0; // Cambiado para permitir 0
        case 'Fijo':
            return value >= 0;
        default:
            return true;
    }
}, 'Valor inválido para el método de cálculo seleccionado');

const Tramo = mongoose.model('Tramo', tramoSchema);

module.exports = Tramo;
