const mongoose = require('mongoose');
const logger = require('./logger');

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
 * Actualiza el estado de partida de un viaje usando una única agregación de MongoDB
 * 
 * @param {string} viajeId - ID del viaje a actualizar
 * @returns {Promise<void>}
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
async function actualizarEstadoPartida(viajeId) {
  const Viaje = mongoose.model('Viaje');
  const OrdenCompra = mongoose.model('OrdenCompra');

  try {
    // Obtener el total del viaje y el total cobrado en una sola agregación
    const [resultado] = await OrdenCompra.aggregate([
      // Desenrollar el array de viajes para poder trabajar con cada viaje individualmente
      { $unwind: '$viajes' },
      // Filtrar solo los viajes que nos interesan
      { $match: { 'viajes.viaje': mongoose.Types.ObjectId(viajeId) } },
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
      const nuevoEstado = resultado.totalCobrado >= resultado.total ? 'Cerrada' : 'Abierta';
      
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
 * @param {string[]} viajeIds - Array de IDs de viajes a actualizar
 * @returns {Promise<void>}
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
async function actualizarEstadosPartidaBulk(viajeIds) {
  const Viaje = mongoose.model('Viaje');
  const OrdenCompra = mongoose.model('OrdenCompra');

  try {
    // Obtener totales cobrados para todos los viajes en una sola agregación
    const resultados = await OrdenCompra.aggregate([
      // Desenrollar para trabajar con cada viaje individualmente
      { $unwind: '$viajes' },
      // Filtrar solo los viajes que nos interesan
      { 
        $match: { 
          'viajes.viaje': { 
            $in: viajeIds.map(id => mongoose.Types.ObjectId(id)) 
          } 
        } 
      },
      // Agrupar y sumar importes por viaje
      { 
        $group: {
          _id: '$viajes.viaje',
          totalCobrado: { $sum: '$viajes.importe' }
        }
      },
      // Obtener información del viaje
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

    // Preparar las operaciones de actualización en bulk
    const bulkOps = resultados.map(r => ({
      updateOne: {
        filter: { _id: r._id },
        update: { 
          $set: { 
            estadoPartida: r.totalCobrado >= r.viaje.total ? 'Cerrada' : 'Abierta' 
          } 
        }
      }
    }));

    // Ejecutar todas las actualizaciones en una sola operación
    if (bulkOps.length > 0) {
      await Viaje.bulkWrite(bulkOps);
    }
  } catch (error) {
    logger.error('Error actualizando estados de partida en bulk:', error);
  }
}

module.exports = {
  actualizarEstadoPartida,
  actualizarEstadosPartidaBulk
}; 