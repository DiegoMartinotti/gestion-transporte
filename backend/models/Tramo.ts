import mongoose, { Document, Schema, Types, model } from 'mongoose';
import { calcularDistanciaRuta } from '../services/routingService';
import logger from '../utils/logger';

/**
 * Interface for Tarifa Historica subdocument
 */
export interface ITarifaHistorica {
    _id: Types.ObjectId;
    tipo: 'TRMC' | 'TRMI';
    metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
    valor: number;
    valorPeaje: number;
    vigenciaDesde: Date;
    vigenciaHasta: Date;
}

/**
 * Interface for Tramo document
 */
export interface ITramo extends Document {
    origen: Types.ObjectId;
    destino: Types.ObjectId;
    cliente: Types.ObjectId;
    distancia: number;
    tarifasHistoricas: ITarifaHistorica[];
    createdAt: Date;
    updatedAt: Date;
    
    // Virtual properties
    descripcion: Promise<string>;
    tarifaVigente: ITarifaHistorica | undefined;
    tarifasVigentes: ITarifaHistorica[];
    
    // Instance methods
    getTarifaVigente(fecha?: Date, tipo?: string): ITarifaHistorica | undefined;
    getTarifasVigentes(fecha?: Date): ITarifaHistorica[];
}

/**
 * Interface for Tramo Model
 */
export interface ITramoModel extends mongoose.Model<ITramo> {}

// Esquema para las tarifas históricas
const tarifaHistoricaSchema = new Schema<ITarifaHistorica>({
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
    }
}, { _id: true, id: false });

const tramoSchema = new Schema<ITramo>({
    origen: {
        type: Schema.Types.ObjectId,
        ref: 'Site',
        required: [true, 'El origen es obligatorio']
    },
    destino: {
        type: Schema.Types.ObjectId,
        ref: 'Site',
        required: [true, 'El destino es obligatorio']
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
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
tramoSchema.methods.getTarifaVigente = function(this: ITramo, fecha: Date = new Date(), tipo?: string): ITarifaHistorica | undefined {
    if (tipo) {
        // Buscar tarifa vigente con tipo específico
        return this.tarifasHistoricas.find((tarifa: ITarifaHistorica) => 
            tarifa.tipo === tipo &&
            tarifa.vigenciaDesde <= fecha && 
            tarifa.vigenciaHasta >= fecha
        );
    } else {
        // Buscar cualquier tarifa vigente
        return this.tarifasHistoricas.find((tarifa: ITarifaHistorica) => 
            tarifa.vigenciaDesde <= fecha && 
            tarifa.vigenciaHasta >= fecha
        );
    }
};

// Método para obtener todas las tarifas vigentes a una fecha dada
tramoSchema.methods.getTarifasVigentes = function(this: ITramo, fecha: Date = new Date()): ITarifaHistorica[] {
    return this.tarifasHistoricas.filter((tarifa: ITarifaHistorica) => 
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
                } catch (routeError: any) {
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
        this.tarifasHistoricas.forEach((tarifa: any) => {
            // Normalizar el tipo a mayúsculas
            if (tarifa.tipo) {
                tarifa.tipo = tarifa.tipo.toUpperCase();
            }
            
            if (tarifa.valor) {
                tarifa.valor = parseFloat(parseFloat(tarifa.valor.toString()).toFixed(2));
            }
            
            if (tarifa.valorPeaje) {
                tarifa.valorPeaje = parseFloat(parseFloat(tarifa.valorPeaje.toString()).toFixed(2));
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
                a.vigenciaDesde.getTime() - b.vigenciaDesde.getTime()
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
        
        logger.debug('[VALIDACIÓN] ✅ Validación exitosa, no hay conflictos');
        next();
    } catch (error) {
        logger.error('[VALIDACIÓN] ❌ Error en validación de tramo:', error);
        next(error as Error);
    }
});

// Método para crear una descripción humanizada del tramo
tramoSchema.virtual('descripcion').get(async function(this: ITramo): Promise<string> {
    try {
        // Poblar relaciones para obtener nombres
        await this.populate('origen destino cliente'); 
        const nombreOrigen = (this.origen as any)?.nombre || 'ID Origen Desc.';
        const nombreDestino = (this.destino as any)?.nombre || 'ID Destino Desc.';
        const nombreCliente = (this.cliente as any)?.nombre || 'ID Cliente Desc.';
        
        const tarifaActual = this.getTarifaVigente();
        const tipoStr = tarifaActual ? tarifaActual.tipo : 'Sin tipo';
        const metodoCalculo = tarifaActual ? tarifaActual.metodoCalculo : 'Sin tarifa';
        
        return `${nombreOrigen} → ${nombreDestino} (${nombreCliente} - ${tipoStr}/${metodoCalculo})`;
    } catch (error) {
        logger.error('Error generando descripción del tramo:', error);
        return 'Error al generar descripción';
    }
});

// Validaciones adicionales
tramoSchema.path('destino').validate(function(this: ITramo, value: Types.ObjectId) {
    return String(value) !== String(this.origen);
}, 'El origen y el destino no pueden ser el mismo Site');

// Virtual para obtener la tarifa vigente actual
tramoSchema.virtual('tarifaVigente').get(function(this: ITramo) {
    return this.getTarifaVigente();
});

// Virtual para obtener todas las tarifas vigentes
tramoSchema.virtual('tarifasVigentes').get(function(this: ITramo) {
    return this.getTarifasVigentes();
});

const Tramo = model<ITramo, ITramoModel>('Tramo', tramoSchema);

export default Tramo;