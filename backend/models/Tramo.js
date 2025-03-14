const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { calcularDistanciaRuta } = require('../services/routingService');
const logger = require('../utils/logger');
// Eliminamos la importación directa del modelo Site para evitar dependencia circular

// Esquema para las tarifas históricas
const tarifaHistoricaSchema = new Schema({
    tipo: {
        type: String,
        enum: ['TRMC', 'TRMI'],
        default: 'TRMC',
        required: true
    },
    metodoCalculo: {
        type: String,
        enum: ['Kilometro', 'Palet', 'Fijo'],
        required: true
    },
    valor: {
        type: Number,
        required: [true, 'El valor es obligatorio'],
        min: 0,
        get: v => parseFloat(v).toFixed(2),
        set: v => parseFloat(parseFloat(v).toFixed(2))
    },
    valorPeaje: {
        type: Number,
        default: 0,
        min: 0,
        get: v => parseFloat(v).toFixed(2),
        set: v => parseFloat(parseFloat(v).toFixed(2))
    },
    vigenciaDesde: {
        type: Date,
        required: [true, 'La fecha de inicio de vigencia es obligatoria']
    },
    vigenciaHasta: {
        type: Date,
        required: [true, 'La fecha de fin de vigencia es obligatoria']
    }
}, { _id: true, id: false });

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
    cliente: {
        type: String,
        required: [true, 'El cliente es obligatorio']
    },
    distancia: {
        type: Number,
        default: 0
    },
    // Array de tarifas históricas
    tarifasHistoricas: [tarifaHistoricaSchema]
}, { 
    timestamps: true,
    collection: 'tramos',
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Definir índice compuesto para los campos fijos
tramoSchema.index({ 
    origen: 1, 
    destino: 1, 
    cliente: 1
}, { 
    name: "idx_tramo_base",
    unique: false, // Ya no es único porque el tipo está en el histórico
    background: true 
});

// Método para obtener la tarifa vigente a una fecha dada
tramoSchema.methods.getTarifaVigente = function(fecha = new Date(), tipo = null) {
    if (tipo) {
        // Buscar tarifa vigente con tipo específico
        return this.tarifasHistoricas.find(tarifa => 
            tarifa.tipo === tipo &&
            tarifa.vigenciaDesde <= fecha && 
            tarifa.vigenciaHasta >= fecha
        );
    } else {
        // Buscar cualquier tarifa vigente
        return this.tarifasHistoricas.find(tarifa => 
            tarifa.vigenciaDesde <= fecha && 
            tarifa.vigenciaHasta >= fecha
        );
    }
};

// Método para obtener todas las tarifas vigentes a una fecha dada
tramoSchema.methods.getTarifasVigentes = function(fecha = new Date()) {
    return this.tarifasHistoricas.filter(tarifa => 
        tarifa.vigenciaDesde <= fecha && 
        tarifa.vigenciaHasta >= fecha
    );
};

// Middleware para calcular distancia automáticamente
tramoSchema.pre('save', async function(next) {
    try {
        // Solo calcular distancia si tenemos origen y destino y no hay distancia pre-calculada
        if (this.origen && this.destino && (!this.distancia || this.distancia === 0)) {
            // Obtenemos el modelo Site dentro de la función para evitar dependencia circular
            const Site = mongoose.model('Site');
            
            // Cargar los sitios con sus coordenadas
            const origenSite = await Site.findById(this.origen).select('location');
            const destinoSite = await Site.findById(this.destino).select('location');

            if (origenSite?.location?.coordinates?.length === 2 && 
                destinoSite?.location?.coordinates?.length === 2) {
                
                logger.debug('[DISTANCIA] Calculando distancia entre:', {
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
                    logger.debug(`[DISTANCIA] ✅ Distancia calculada: ${distanciaKm} km`);
                } catch (routeError) {
                    logger.error('[DISTANCIA] ❌ Error calculando distancia:', routeError.message);
                    // No interrumpimos el guardado si falla el cálculo de distancia
                }
            } else {
                logger.warn('[DISTANCIA] ⚠️ No se pudo calcular distancia: coordenadas faltantes');
            }
        } else if (this.distancia > 0) {
            logger.debug(`[DISTANCIA] ℹ️ Usando distancia pre-calculada: ${this.distancia} km`);
        }
        next();
    } catch (error) {
        logger.error('[DISTANCIA] ❌ Error en middleware de cálculo de distancia:', error);
        // No interrumpimos el guardado si falla el cálculo de distancia
        next();
    }
});

// Middleware para formatear decimales antes de guardar
tramoSchema.pre('save', function(next) {
    // Formatear valores en las tarifas históricas
    if (this.tarifasHistoricas && this.tarifasHistoricas.length > 0) {
        this.tarifasHistoricas.forEach(tarifa => {
            // Normalizar el tipo a mayúsculas
            if (tarifa.tipo) {
                tarifa.tipo = tarifa.tipo.toUpperCase();
            }
            
            if (tarifa.valor) {
                tarifa.valor = parseFloat(parseFloat(tarifa.valor).toFixed(2));
            }
            
            if (tarifa.valorPeaje) {
                tarifa.valorPeaje = parseFloat(parseFloat(tarifa.valorPeaje).toFixed(2));
            }
        });
    }
    
    next();
});

// Método para validar que no se superpongan fechas en las tarifas
tramoSchema.pre('save', async function(next) {
    try {
        // Validar que no haya superposición de fechas en las tarifas
        if (this.tarifasHistoricas && this.tarifasHistoricas.length > 1) {
            // Ordenar por fecha de inicio
            const tarifasOrdenadas = [...this.tarifasHistoricas].sort((a, b) => 
                a.vigenciaDesde - b.vigenciaDesde
            );
            
            // Validar que cada tarifa tenga vigenciaHasta >= vigenciaDesde
            for (const tarifa of tarifasOrdenadas) {
                if (tarifa.vigenciaHasta < tarifa.vigenciaDesde) {
                    throw new Error('La fecha de fin de vigencia debe ser mayor o igual a la fecha de inicio.');
                }
            }
            
            // Verificar superposición de fechas entre tarifas
            for (let i = 0; i < tarifasOrdenadas.length - 1; i++) {
                for (let j = i + 1; j < tarifasOrdenadas.length; j++) {
                    const tarifaA = tarifasOrdenadas[i];
                    const tarifaB = tarifasOrdenadas[j];
                    
                    // Si el tipo o método de cálculo es diferente, pueden coexistir
                    if (tarifaA.tipo !== tarifaB.tipo || tarifaA.metodoCalculo !== tarifaB.metodoCalculo) {
                        continue;
                    }
                    
                    // Comprobar si hay superposición
                    const noHayConflicto = tarifaA.vigenciaHasta < tarifaB.vigenciaDesde || 
                                           tarifaA.vigenciaDesde > tarifaB.vigenciaHasta;
                    
                    if (!noHayConflicto) {
                        throw new Error(`Existen tarifas con el mismo tipo (${tarifaA.tipo}) y método de cálculo (${tarifaA.metodoCalculo}) con fechas que se superponen.`);
                    }
                }
            }
        }
        
        // Verificar que no exista otro tramo con la misma configuración base
        if (this.isNew) {
            const tramoExistente = await this.constructor.findOne({
                origen: this.origen,
                destino: this.destino,
                cliente: this.cliente,
                _id: { $ne: this._id }
            });
            
            if (tramoExistente) {
                throw new Error(`Ya existe un tramo con la misma configuración para este cliente.`);
            }
        }
        
        logger.debug('[VALIDACIÓN] ✅ Validación exitosa, no hay conflictos');
        next();
    } catch (error) {
        logger.error('[VALIDACIÓN] ❌ Error en validación de tramo:', error);
        next(error);
    }
});

// Método para crear una descripción humanizada del tramo
tramoSchema.virtual('descripcion').get(function() {
    const tarifaActual = this.getTarifaVigente();
    const tipoStr = tarifaActual ? tarifaActual.tipo : 'Sin tipo';
    const metodoCalculo = tarifaActual ? tarifaActual.metodoCalculo : 'Sin tarifa vigente';
    return `${this.origen} → ${this.destino} (${tipoStr}/${metodoCalculo})`;
});

// Validaciones adicionales
tramoSchema.path('destino').validate(function(value) {
    return String(value) !== String(this.origen);
}, 'El origen y el destino no pueden ser el mismo Site');

// Virtual para obtener la tarifa vigente actual
tramoSchema.virtual('tarifaVigente').get(function() {
    return this.getTarifaVigente();
});

// Virtual para obtener todas las tarifas vigentes
tramoSchema.virtual('tarifasVigentes').get(function() {
    return this.getTarifasVigentes();
});

const Tramo = mongoose.model('Tramo', tramoSchema);

module.exports = Tramo;
