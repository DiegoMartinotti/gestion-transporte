import mongoose, { Document, Model, Schema } from 'mongoose';
import { actualizarEstadosPartidaBulk } from '../utils/estadoPartida';

/**
 * Interfaz para un item de viaje dentro de la OrdenCompra
 */
interface IViajeItem {
  viaje: mongoose.Types.ObjectId;
  importe: number;
}

/**
 * Interfaz para el documento de OrdenCompra
 */
export interface IOrdenCompra extends Document {
  cliente: mongoose.Types.ObjectId;
  viajes: IViajeItem[];
  numero: string;
  fecha: Date;
  importe: number;
  estado: 'Pendiente' | 'Facturada' | 'Cancelada';
  calcularImporteTotal: () => Promise<number>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @typedef {Object} OrdenCompra
 * @description Modelo que representa una Orden de Compra (OC) en el sistema.
 * 
 * Una OC puede contener múltiples viajes, cada uno con su importe específico.
 * Cuando se modifica una OC (sea creación, modificación o eliminación), 
 * se dispara automáticamente la actualización del estado de partida de todos
 * los viajes involucrados.
 */

const ordenCompraSchema = new Schema<IOrdenCompra>({
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  /**
   * Lista de viajes incluidos en la OC.
   * Cada viaje tiene su propio importe, que puede ser diferente
   * al importe calculado originalmente en el viaje.
   */
  viajes: [{
    viaje: {
      type: Schema.Types.ObjectId,
      ref: 'Viaje',
      required: true
    },
    importe: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  numero: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  /**
   * Importe total de la OC.
   * Se calcula automáticamente como la suma de los importes
   * de todos los viajes incluidos.
   */
  importe: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Facturada', 'Cancelada'],
    default: 'Pendiente'
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar duplicados de número de OC por cliente
ordenCompraSchema.index({ numero: 1, cliente: 1 }, { unique: true });

/**
 * Calcula el importe total de la OC sumando los importes de todos los viajes
 * @method calcularImporteTotal
 * @returns {Promise<number>} El importe total calculado
 */
ordenCompraSchema.methods.calcularImporteTotal = async function(this: IOrdenCompra): Promise<number> {
  this.importe = this.viajes.reduce((total, item) => total + item.importe, 0);
  return this.importe;
};

/**
 * Middleware que se ejecuta antes de guardar una OC
 * Recalcula el importe total si se modificaron los viajes
 */
ordenCompraSchema.pre('save', async function(this: IOrdenCompra, next) {
  if (this.isModified('viajes')) {
    await this.calcularImporteTotal();
  }
  next();
});

/**
 * Middleware que se ejecuta después de guardar una OC
 * Actualiza el estado de partida de todos los viajes involucrados
 * usando una operación bulk optimizada
 */
ordenCompraSchema.post('save', async function(this: IOrdenCompra, doc) {
  try {
    if (doc.isModified && doc.isModified('viajes')) {
      const viajeIds = doc.viajes.map(v => v.viaje.toString());
      await actualizarEstadosPartidaBulk(viajeIds);
    }
  } catch (error) {
    console.error('Error actualizando estados de partidas:', error);
  }
});

const OrdenCompra: Model<IOrdenCompra> = mongoose.model<IOrdenCompra>('OrdenCompra', ordenCompraSchema);
export default OrdenCompra; 