import mongoose from 'mongoose';
import logger from './logger';

/**
 * @module estadoPartida
 * @description Módulo para manejar el estado de partida de los viajes basado en sus cobros.
 * 
 * El estado de partida de un viaje puede ser:
 * - 'Abierta': Cuando el total cobrado es menor al total del viaje
 * - 'Cerrada': Cuando el total cobrado es mayor o igual al total del viaje
 * 
 * El estado se actualiza automáticamente cuando:
 * 1. Se modifica una Orden de Compra (agrega/elimina viajes o modifica importes)
 * 2. Se modifica el total de un viaje (cambios en tarifa o extras)
 */

/**
 * Tipo para el estado de partida de un viaje
 */
export type EstadoPartida = 'Abierta' | 'Cerrada';

/**
 * Resultado de la agregación para calcular el estado de partida
 */
interface ResultadoAgregacion {
  _id: mongoose.Types.ObjectId;
  totalCobrado: number;
  total?: number;
  estadoActual?: EstadoPartida;
  viaje?: unknown;
}

/**
 * Actualiza el estado de partida de un viaje usando una única agregación de MongoDB
 * 
 * @param viajeId - ID del viaje a actualizar
 * @returns Promise que resuelve cuando se completa la actualización
 * 
 * @description
 * Este método utiliza una única agregación de MongoDB para:
 * 1. Obtener todas las OCs que incluyen el viaje
 * 2. Sumar los importes asignados al viaje en cada OC
 * 3. Comparar con el total del viaje
 * 4. Actualizar el estado si es necesario
 * 
 * La agregación es más eficiente que múltiples queries porque:
 * - Reduce el número de operaciones en la base de datos
 * - Aprovecha los índices de MongoDB
 * - Minimiza la transferencia de datos
 */
async function actualizarEstadoPartida(viajeId: string): Promise<void> {
  const Viaje = mongoose.model('Viaje');
  const OrdenCompra = mongoose.model('OrdenCompra');

  try {
    // Obtener el total del viaje y el total cobrado en una sola agregación
    const [resultado] = await OrdenCompra.aggregate<ResultadoAgregacion>([
      // Desenrollar el array de viajes para poder trabajar con cada viaje individualmente
      { $unwind: '$viajes' },
      // Filtrar solo los viajes que nos interesan
      { $match: { 'viajes.viaje': new mongoose.Types.ObjectId(viajeId) } },
      // Agrupar y sumar los importes de todas las OCs para este viaje
      { 
        $group: {
          _id: '$viajes.viaje',
          totalCobrado: { $sum: '$viajes.importe' }
        }
      },
      // Hacer lookup con el viaje para obtener su total y estado actual
      {
        $lookup: {
          from: 'viajes',
          localField: '_id',
          foreignField: '_id',
          as: 'viaje'
        }
      },
      // Desenrollar el resultado del lookup (siempre será un solo documento)
      { $unwind: '$viaje' },
      // Proyectar solo los campos necesarios para la comparación
      {
        $project: {
          totalCobrado: 1,
          total: '$viaje.total',
          estadoActual: '$viaje.estadoPartida'
        }
      }
    ]);

    if (resultado) {
      const nuevoEstado: EstadoPartida = resultado.totalCobrado >= (resultado.total || 0) ? 'Cerrada' : 'Abierta';
      
      // Solo actualizar si el estado realmente cambió
      if (nuevoEstado !== resultado.estadoActual) {
        await Viaje.updateOne(
          { _id: viajeId },
          { $set: { estadoPartida: nuevoEstado } }
        );
      }
    }
  } catch (error) {
    logger.error(`Error actualizando estado de partida para viaje ${viajeId}:`, error);
  }
}

/**
 * Actualiza el estado de partida de múltiples viajes en una sola operación
 *
 * @param viajeIds - Array de IDs de viajes a actualizar
 * @returns Promise que resuelve cuando se completa la actualización
 *
 * @description
 * Este método es una versión optimizada para actualizar múltiples viajes a la vez.
 * Es especialmente útil cuando se modifica una OC que afecta a varios viajes.
 *
 * Optimizaciones:
 * 1. Una sola agregación para obtener todos los totales
 * 2. Uso de bulkWrite para actualizar todos los estados en una operación
 * 3. Minimiza el número de operaciones en la base de datos
 *
 * Casos de uso típicos:
 * - Cuando se crea/modifica una OC con múltiples viajes
 * - Cuando se necesita recalcular estados en batch
 */
async function actualizarEstadosPartidaBulk(viajeIds: string[]): Promise<void> {
  const Viaje = mongoose.model('Viaje');
  const OrdenCompra = mongoose.model('OrdenCompra');

  try {
    const objectIds = viajeIds.map(id => new mongoose.Types.ObjectId(id));
    const resultados = await obtenerTotalesCobrados(OrdenCompra, objectIds);
    const bulkOps = prepararOperacionesBulk(resultados);
    await ejecutarActualizacionesBulk(Viaje, bulkOps);
  } catch (error) {
    logger.error('Error actualizando estados de partida en bulk:', error);
  }
}

/**
 * Obtiene los totales cobrados para los viajes especificados
 */
async function obtenerTotalesCobrados(
  OrdenCompra: mongoose.Model<unknown>,
  objectIds: mongoose.Types.ObjectId[]
): Promise<ResultadoAgregacion[]> {
  return await OrdenCompra.aggregate<ResultadoAgregacion>([
    { $unwind: '$viajes' },
    {
      $match: {
        'viajes.viaje': { $in: objectIds }
      }
    },
    {
      $group: {
        _id: '$viajes.viaje',
        totalCobrado: { $sum: '$viajes.importe' }
      }
    },
    {
      $lookup: {
        from: 'viajes',
        localField: '_id',
        foreignField: '_id',
        as: 'viaje'
      }
    },
    { $unwind: '$viaje' }
  ]);
}

/**
 * Prepara las operaciones de actualización en bulk
 */
function prepararOperacionesBulk(resultados: ResultadoAgregacion[]): BulkOperation[] {
  return resultados.map(r => ({
    updateOne: {
      filter: { _id: r._id },
      update: {
        $set: {
          estadoPartida: calcularEstadoPartida(r)
        }
      }
    }
  }));
}

/**
 * Calcula el estado de partida basado en los totales
 */
function calcularEstadoPartida(resultado: ResultadoAgregacion): EstadoPartida {
  const viajeTotal = (resultado.viaje && typeof resultado.viaje === 'object' && 'total' in resultado.viaje)
    ? (resultado.viaje as { total: number }).total
    : 0;
  return resultado.totalCobrado >= viajeTotal ? 'Cerrada' : 'Abierta';
}

/**
 * Ejecuta las actualizaciones en bulk si hay operaciones
 */
async function ejecutarActualizacionesBulk(
  Viaje: mongoose.Model<unknown>,
  bulkOps: BulkOperation[]
): Promise<void> {
  if (bulkOps.length > 0) {
    await Viaje.bulkWrite(bulkOps);
  }
}

/**
 * Interfaz para la operación de actualización
 */
interface BulkOperation {
  updateOne: {
    filter: {_id: mongoose.Types.ObjectId};
    update: {$set: {estadoPartida: EstadoPartida}};
  }
}

export {
  actualizarEstadoPartida,
  actualizarEstadosPartidaBulk
}; 