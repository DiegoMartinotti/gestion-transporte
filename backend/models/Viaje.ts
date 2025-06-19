import mongoose, { Document, Schema, Types, model } from 'mongoose';
import Tramo from './Tramo';
import Cliente from './Cliente';
import Extra from './Extra';
import { calcularTarifaPaletConFormula } from '../utils/formulaParser';
import { actualizarEstadoPartida } from '../utils/estadoPartida';
import logger from '../utils/logger';
import Personal from './Personal';
import Vehiculo from './Vehiculo';

/**
 * Interface for Vehiculo configuration in Viaje
 */
export interface IVehiculoViaje {
    vehiculo: Types.ObjectId;
    posicion: number;
    observaciones?: string;
}

/**
 * Interface for Extra in Viaje
 */
export interface IExtraViaje {
    extra: Types.ObjectId;
    cantidad: number;
}

/**
 * Interface for temporary tariff info (used in bulk import)
 */
export interface ITempTariffInfo {
    metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
    valor: number;
    valorPeaje: number;
    distanciaTramo?: number;
    tramoId?: Types.ObjectId;
}

/**
 * Interface for Viaje document
 * 
 * @description Modelo que representa un viaje en el sistema.
 * 
 * El viaje tiene un total calculado en base a su tarifa y extras.
 * Este total se compara con la suma de los importes asignados en las OCs
 * para determinar su estado de partida (Abierta/Cerrada).
 * 
 * El estado de partida se actualiza automáticamente cuando:
 * 1. Cambia el total del viaje (por modificación de tarifa o extras)
 * 2. Se modifica una OC que incluye este viaje
 */
export interface IViaje extends Document {
    cliente: Types.ObjectId;
    fecha: Date;
    origen: Types.ObjectId;
    destino: Types.ObjectId;
    tipoTramo: 'TRMC' | 'TRMI';
    chofer: Types.ObjectId;
    vehiculos: IVehiculoViaje[];
    tipoUnidad: 'Sider' | 'Bitren';
    paletas: number;
    tarifa: number;
    peaje: number;
    dt: string;
    extras: IExtraViaje[];
    cobros: Types.ObjectId[];
    total: number;
    estado: 'Pendiente' | 'En Curso' | 'Completado' | 'Cancelado';
    estadoPartida: 'Abierta' | 'Cerrada';
    observaciones?: string;
    createdAt: Date;
    updatedAt: Date;
    
    // Temporary property for bulk import
    _tempTariffInfo?: ITempTariffInfo;
    
    // Instance methods
    getDescripcionCorta(): string;
    isCompleto(): boolean;
}

/**
 * Interface for Viaje Model
 */
export interface IViajeModel extends mongoose.Model<IViaje> {}

const viajeSchema = new Schema<IViaje>({
    cliente: { 
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    fecha: { type: Date, required: true },
    origen: { 
        type: Schema.Types.ObjectId,
        ref: 'Site',
        required: true
    },
    destino: {
        type: Schema.Types.ObjectId,
        ref: 'Site',
        required: true
    },
    tipoTramo: { 
        type: String, 
        enum: ['TRMC', 'TRMI'], 
        default: 'TRMC',
        required: true
    },
    /**
     * Chofer asignado al viaje, debe ser un Personal activo
     */
    chofer: {
        type: Schema.Types.ObjectId,
        ref: 'Personal',
        required: true,
        validate: {
            validator: async function(value: Types.ObjectId) {
                const Personal = mongoose.model('Personal');
                const personal = await Personal.findById(value).lean();
                return personal && (personal as any).activo === true;
            },
            message: 'El chofer debe ser un personal activo'
        }
    },
    /**
     * Configuración de vehículos para el viaje
     * Al menos debe tener un vehículo (el principal)
     */
    vehiculos: [{
        vehiculo: {
            type: Schema.Types.ObjectId,
            ref: 'Vehiculo',
            required: true
        },
        posicion: {
            type: Number,
            default: 1,
            min: 1
        },
        observaciones: String
    }],
    /**
     * El tipo de unidad ahora se obtiene del vehículo principal
     * Se mantiene por compatibilidad con código existente
     */
    tipoUnidad: { 
        type: String, 
        enum: ['Sider', 'Bitren'], 
        default: 'Sider',
        required: true
    },
    paletas: { type: Number, default: 0 },
    /**
     * Tarifa base del viaje, calculada según el tramo y método de cálculo
     */
    tarifa: { 
        type: Number, 
        required: true,
        min: 0,
        validate: {
            validator: function(v: number) {
                return v >= 0;
            },
            message: 'La tarifa debe ser mayor o igual a 0'
        }
    },
    peaje: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(v: number) {
                return v >= 0;
            },
            message: 'El peaje debe ser mayor o igual a 0'
        }
    },
    dt: { type: String, required: true },
    /**
     * Extras aplicados al viaje, cada uno con su cantidad
     */
    extras: [{
        extra: {
            type: Schema.Types.ObjectId,
            ref: 'Extra',
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            default: 1,
            min: 1
        }
    }],
    /**
     * Referencias a las OCs que incluyen este viaje
     */
    cobros: [{
        type: Schema.Types.ObjectId,
        ref: 'OrdenCompra',
        required: true
    }],
    /**
     * Total del viaje = tarifa base + suma de extras
     */
    total: { type: Number, default: 0 },
    estado: {
        type: String,
        enum: ['Pendiente', 'En Curso', 'Completado', 'Cancelado'],
        default: 'Pendiente'
    },
    /**
     * Estado de la partida:
     * - Abierta: El total cobrado es menor al total del viaje
     * - Cerrada: El total cobrado es mayor o igual al total del viaje
     */
    estadoPartida: {
        type: String,
        enum: ['Abierta', 'Cerrada'],
        default: 'Abierta'
    },
    observaciones: String
}, {
    timestamps: true,
    versionKey: false
});

/**
 * Validación para asegurar que al menos hay un vehículo en la configuración
 * y que las posiciones son únicas
 */
viajeSchema.path('vehiculos').validate(function(vehiculos: IVehiculoViaje[]) {
    if (!vehiculos || vehiculos.length === 0) {
        return false;
    }
    
    // Verificar que no hay posiciones duplicadas
    const posiciones = vehiculos.map(v => v.posicion);
    return posiciones.length === new Set(posiciones).size;
}, 'Debe asignarse al menos un vehículo al viaje y las posiciones deben ser únicas');

/**
 * Middleware que se ejecuta antes de guardar un viaje
 * Calcula la tarifa y el total del viaje según:
 * 1. Tramo y método de cálculo correspondiente
 * 2. Fórmulas personalizadas del cliente si existen
 * 3. Extras aplicados
 * 
 * También actualiza el tipoUnidad basado en el vehículo principal
 */
viajeSchema.pre('save', async function (next) {
    // Cast this to IViaje for type safety
    const viaje = this as unknown as IViaje;
    
    // Primero, intentar obtener info de tarifa pre-calculada (desde bulk import)
    const tempTariffInfo = viaje._tempTariffInfo;
    let tarifaVigente: any = null;
    let tramo: any = null; // Necesitaremos 'tramo' si calculamos por Km o usamos fórmula

    try {
        // --- 1. Verificar y actualizar tipoUnidad basado en vehículo principal ---
        if (this.isNew || this.isModified('vehiculos')) {
            if (viaje.vehiculos && viaje.vehiculos.length > 0) {
                const vehiculoPrincipal = await Vehiculo.findById(viaje.vehiculos[0].vehiculo).lean();
                if (!vehiculoPrincipal) throw new Error('Vehículo principal no encontrado');
                viaje.tipoUnidad = vehiculoPrincipal.tipo === 'Bitren' ? 'Bitren' : 'Sider';
                logger.debug(`Tipo Unidad actualizado a: ${viaje.tipoUnidad} para viaje ${viaje.dt}`);
            } else {
                // Si no hay vehículos, ¿qué tipo de unidad debería tener? ¿Dejar el default?
                logger.warn(`Viaje ${viaje.dt} no tiene vehículos asignados, tipoUnidad permanecerá como ${viaje.tipoUnidad}`);
            }
        }

        // --- 2. Calcular Tarifa y Peaje ---
        // Solo recalcular si es nuevo, o si cambian campos relevantes O si viene de bulk import (tempTariffInfo existe)
        if (this.isNew || tempTariffInfo || this.isModified('origen') || this.isModified('destino') ||
            this.isModified('tipoTramo') || this.isModified('tipoUnidad') || this.isModified('paletas')) {

            logger.debug(`Iniciando cálculo de tarifa/peaje para viaje ${viaje.dt}. Es nuevo: ${this.isNew}, Tiene tempInfo: ${!!tempTariffInfo}`);

            // Cargamos el documento cliente completo (necesario para fórmulas)
            const clienteDoc = await Cliente.findById(viaje.cliente);
            if (!clienteDoc) throw new Error('Cliente no encontrado para cálculo de tarifa');

            // -- Determinar la tarifaVigente a usar --
            if (tempTariffInfo) {
                // Opción A: Usar datos pre-calculados de bulk import
                logger.debug(`Usando _tempTariffInfo para viaje DT: ${viaje.dt}`);
                tarifaVigente = tempTariffInfo; // Usamos el objeto temporal como si fuera la tarifa
                viaje.peaje = Number(tarifaVigente.valorPeaje) || 0;

                // Si el cálculo es por Km, necesitamos la distancia del tramo
                if (tarifaVigente.metodoCalculo === 'Kilometro') {
                    tramo = { distancia: tarifaVigente.distanciaTramo }; // Usar la distancia pasada
                    if (typeof tramo.distancia === 'undefined' || tramo.distancia === null || tramo.distancia <= 0) {
                        // Si no se pasó la distancia o es inválida, intentar buscar el tramo
                        logger.warn(`Distancia (${tramo.distancia}) inválida o no encontrada en _tempTariffInfo para ${viaje.dt}, buscando tramo ID ${tarifaVigente.tramoId}...`);
                        const tramoEncontrado = await Tramo.findById(tarifaVigente.tramoId).lean();
                        if (!tramoEncontrado || typeof tramoEncontrado.distancia === 'undefined' || tramoEncontrado.distancia === null || tramoEncontrado.distancia <= 0) {
                            throw new Error(`No se pudo obtener una distancia válida para el tramo ID ${tarifaVigente.tramoId} para cálculo por Km.`);
                        }
                        tramo.distancia = tramoEncontrado.distancia; // Actualizar con la distancia encontrada
                    }
                }
            } else {
                // Opción B: Lógica original para creación/actualización normal
                logger.debug(`Calculando tarifa/peaje para viaje DT: ${viaje.dt} (método normal)`);
                // Buscar el tramo principal
                tramo = await Tramo.findOne({
                    cliente: viaje.cliente,
                    origen: viaje.origen,
                    destino: viaje.destino
                }).populate('tarifasHistoricas'); // Poblar para acceder a tarifas

                if (!tramo) {
                    await this.populate('origen destino');
                    const origenNombre = (viaje.origen as any)?.nombre || 'ID desconocido';
                    const destinoNombre = (viaje.destino as any)?.nombre || 'ID desconocido';
                    throw new Error(`No se encontró un tramo válido para Cliente ${(clienteDoc as any).nombre} (${viaje.cliente}) desde ${origenNombre} hasta ${destinoNombre} para la fecha ${viaje.fecha.toISOString().split('T')[0]}`);
                }

                // Encontrar la tarifa vigente usando el método del modelo (o lógica manual si es necesario)
                // ¡Asegúrate que tramo.getTarifaVigente maneje fechas y tipos correctamente!
                try {
                    tarifaVigente = tramo.getTarifaVigente(this.fecha, this.tipoTramo);
                } catch (e: any) {
                    logger.error(`Error en tramo.getTarifaVigente para tramo ${tramo._id}: ${e.message}`);
                    throw new Error(`Error buscando tarifa vigente: ${e.message}`); // Relanzar error
                }

                if (!tarifaVigente) {
                    await this.populate('origen destino');
                    const origenNombre = (this.origen as any)?.nombre || 'ID desconocido';
                    const destinoNombre = (this.destino as any)?.nombre || 'ID desconocido';
                    throw new Error(`No se encontró una tarifa (${this.tipoTramo}) vigente para tramo ${origenNombre} → ${destinoNombre} (Cliente: ${(clienteDoc as any).Cliente}) en fecha ${this.fecha.toISOString().split('T')[0]}`);
                }

                // Asignar el peaje de la tarifa vigente encontrada
                this.peaje = Number(tarifaVigente.valorPeaje) || 0;
                logger.debug(`Tarifa Vigente encontrada (método normal):`, tarifaVigente);
            }

            // --- Calcular tarifa base usando la tarifaVigente (obtenida de A o B) ---
            let tarifaBase = 0;
            const numPalets = Number(this.paletas) || 0;

            if (!tarifaVigente || typeof tarifaVigente.metodoCalculo === 'undefined' || typeof tarifaVigente.valor === 'undefined') {
                throw new Error(`Datos incompletos en la tarifa vigente seleccionada para calcular la tarifa base.`);
            }

            logger.debug(`Calculando tarifa base con: metodo=${tarifaVigente.metodoCalculo}, valor=${tarifaVigente.valor}, palets=${numPalets}, tipoUnidad=${this.tipoUnidad}, peaje=${this.peaje}`);

            switch (tarifaVigente.metodoCalculo) {
                case 'Palet':
                    const formulaKey = this.tipoUnidad === 'Bitren' ? 'formulaPaletBitren' : 'formulaPaletSider';
                    const formulaPersonalizada = (clienteDoc as any)[formulaKey];
                    if (formulaPersonalizada) {
                        logger.info(`Usando fórmula personalizada para ${(clienteDoc as any).Cliente} (${this.tipoUnidad}): ${formulaPersonalizada}`);
                        const valorTarifaParaFormula = Number(tarifaVigente.valor);
                        if (isNaN(valorTarifaParaFormula)) throw new Error('Valor de tarifa inválido para fórmula Palet.');
                        const resultado = calcularTarifaPaletConFormula(valorTarifaParaFormula, this.peaje, numPalets, formulaPersonalizada);
                        tarifaBase = resultado.tarifaBase;
                    } else {
                        const valorTarifa = Number(tarifaVigente.valor);
                        if (isNaN(valorTarifa)) throw new Error('Valor de tarifa inválido para cálculo Palet.');
                        tarifaBase = valorTarifa * numPalets;
                    }
                    break;
                case 'Kilometro':
                    // 'tramo' se obtiene en Opción A o B si es necesario
                    if (!tramo || typeof tramo.distancia === 'undefined' || tramo.distancia === null || tramo.distancia <= 0) {
                        logger.warn(`[TARIFA] El tramo ID ${tramo?._id || tempTariffInfo?.tramoId} no tiene distancia válida (${tramo?.distancia}) para cálculo por Km.`);
                        tarifaBase = 0; // O lanzar error si la distancia es obligatoria
                    } else {
                        const valorTarifa = Number(tarifaVigente.valor);
                        if (isNaN(valorTarifa)) throw new Error('Valor de tarifa inválido para cálculo Km.');
                        tarifaBase = valorTarifa * tramo.distancia;
                    }
                    break;
                case 'Fijo':
                    const valorTarifa = Number(tarifaVigente.valor);
                    if (isNaN(valorTarifa)) throw new Error('Valor de tarifa inválido para cálculo Fijo.');
                    tarifaBase = valorTarifa;
                    break;
                default:
                    throw new Error(`Método de cálculo no válido: ${tarifaVigente.metodoCalculo}`);
            }

            // Asignar la tarifa calculada
            this.tarifa = Math.round(tarifaBase * 100) / 100;

            // Validar que tanto tarifa como peaje sean números válidos >= 0
            if (isNaN(this.tarifa) || this.tarifa < 0 || isNaN(this.peaje) || this.peaje < 0) {
                logger.error('Error de validación Post-Cálculo - Tarifa o Peaje inválido:', { tarifa: this.tarifa, peaje: this.peaje });
                throw new Error('La tarifa y el peaje calculados deben ser números mayores o iguales a 0');
            }
            logger.debug(`Tarifa base calculada: ${tarifaBase}, Tarifa final: ${this.tarifa}, Peaje asignado: ${this.peaje}`);

            // Limpiar la propiedad temporal si existía
            if (tempTariffInfo) {
                delete this._tempTariffInfo;
                logger.debug(`_tempTariffInfo eliminada para viaje ${this.dt}`);
            }
        } // Fin del if (this.isNew || ...)

        // --- 3. Calcular el total (tarifa + extras) ---
        let totalExtras = 0;
        if (this.extras && this.extras.length > 0) {
            // Verificar si los extras están poblados antes de acceder a .extra.valor
            let extrasPoblados = this.populated('extras.extra') || (this.extras[0]?.extra && typeof this.extras[0].extra !== 'string');
            if (!extrasPoblados) {
                logger.warn(`Extras no poblados al calcular total del viaje, intentando poblar: ${this._id}`);
                await this.populate('extras.extra');
                extrasPoblados = this.populated('extras.extra'); // Verificar de nuevo
            }

            if (extrasPoblados) {
                totalExtras = this.extras.reduce((sum, extraItem) => {
                    const valorExtra = Number((extraItem?.extra as any)?.valor);
                    const cantidadExtra = Number(extraItem?.cantidad);
                    if (extraItem && !isNaN(valorExtra) && !isNaN(cantidadExtra)) {
                        return sum + (valorExtra * cantidadExtra);
                    } else {
                        logger.warn("Item extra inválido o no poblado encontrado:", extraItem);
                        return sum;
                    }
                }, 0);
                logger.debug(`Total extras calculado: ${totalExtras} para viaje ${this.dt}`);
            } else {
                logger.error(`Fallo al poblar extras para calcular total del viaje: ${this._id}`);
                // Considerar si lanzar un error o continuar con totalExtras = 0
                // throw new Error('No se pudieron cargar los detalles de los extras');
            }
        }

        this.total = Math.round((this.tarifa + totalExtras) * 100) / 100;
        if (isNaN(this.total)) {
            logger.error('Error: Total calculado final es NaN', { tarifa: this.tarifa, totalExtras });
            throw new Error('El total calculado para el viaje es inválido (NaN)');
        }

        logger.debug(`Viaje ${this.dt} pre-save completo. Tarifa: ${this.tarifa}, Peaje: ${this.peaje}, Total: ${this.total}`);
        logger.debug(`[DEBUG PRE-SAVE] Verificando valores finales antes de next(). Viaje DT: ${this.dt}, Tarifa: ${this.tarifa}, Peaje: ${this.peaje}`);
        next(); // Continuar con el guardado

    } catch (error) {
        logger.error("Error en hook pre('save') de Viaje:", error);
        // Limpiar info temporal también en caso de error para evitar inconsistencias
        if (this._tempTariffInfo) {
            delete this._tempTariffInfo;
        }
        next(error as Error); // Pasar el error a Mongoose para que falle el .save()
    }
});

/**
 * Middleware que se ejecuta después de guardar un viaje
 * Si el total cambió, recalcula el estado de la partida
 * comparando con la suma de importes en las OCs
 */
viajeSchema.post('save', async function(doc) {
    try {
        // Si el total cambió, necesitamos recalcular el estado
        if (doc.isModified('total')) {
            await actualizarEstadoPartida(doc._id.toString());
        }
    } catch (error) {
        logger.error('Error actualizando estado de partida:', error);
    }
});

// Validación: La `dt` debe ser única por cliente
viajeSchema.index({ dt: 1, cliente: 1 }, { unique: true });

// Método para obtener una descripción corta del viaje
viajeSchema.methods.getDescripcionCorta = function(this: IViaje): string {
    const origenNombre = (this.origen as any)?.nombre || 'ID desconocido';
    const destinoNombre = (this.destino as any)?.nombre || 'ID desconocido';
    return `${origenNombre} -> ${destinoNombre}`;
};

// Método para verificar si el viaje está completo (ejemplo)
viajeSchema.methods.isCompleto = function(this: IViaje): boolean {
    return !!(this.origen && this.destino && this.vehiculos && this.fecha && (this as any).fecha_fin);
};

// Índices
viajeSchema.index({ cliente: 1, fecha: -1 });
viajeSchema.index({ vehiculos: 1, fecha: -1 });
viajeSchema.index({ estado: 1, fecha: -1 });
viajeSchema.index({ origen: 1 });
viajeSchema.index({ destino: 1 });

const Viaje = model<IViaje, IViajeModel>('Viaje', viajeSchema);

export default Viaje;