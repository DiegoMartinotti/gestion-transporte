"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarEstadoPartida = actualizarEstadoPartida;
exports.actualizarEstadosPartidaBulk = actualizarEstadosPartidaBulk;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
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
function actualizarEstadoPartida(viajeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const Viaje = mongoose_1.default.model('Viaje');
        const OrdenCompra = mongoose_1.default.model('OrdenCompra');
        try {
            // Obtener el total del viaje y el total cobrado en una sola agregación
            const [resultado] = yield OrdenCompra.aggregate([
                // Desenrollar el array de viajes para poder trabajar con cada viaje individualmente
                { $unwind: '$viajes' },
                // Filtrar solo los viajes que nos interesan
                { $match: { 'viajes.viaje': new mongoose_1.default.Types.ObjectId(viajeId) } },
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
                const nuevoEstado = resultado.totalCobrado >= (resultado.total || 0) ? 'Cerrada' : 'Abierta';
                // Solo actualizar si el estado realmente cambió
                if (nuevoEstado !== resultado.estadoActual) {
                    yield Viaje.updateOne({ _id: viajeId }, { $set: { estadoPartida: nuevoEstado } });
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Error actualizando estado de partida para viaje ${viajeId}:`, error);
        }
    });
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
function actualizarEstadosPartidaBulk(viajeIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const Viaje = mongoose_1.default.model('Viaje');
        const OrdenCompra = mongoose_1.default.model('OrdenCompra');
        try {
            // Convertir los IDs a ObjectId
            const objectIds = viajeIds.map(id => new mongoose_1.default.Types.ObjectId(id));
            // Obtener totales cobrados para todos los viajes en una sola agregación
            const resultados = yield OrdenCompra.aggregate([
                // Desenrollar para trabajar con cada viaje individualmente
                { $unwind: '$viajes' },
                // Filtrar solo los viajes que nos interesan
                {
                    $match: {
                        'viajes.viaje': {
                            $in: objectIds
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
            const bulkOps = resultados.map(r => {
                var _a;
                return ({
                    updateOne: {
                        filter: { _id: r._id },
                        update: {
                            $set: {
                                estadoPartida: r.totalCobrado >= (((_a = r.viaje) === null || _a === void 0 ? void 0 : _a.total) || 0) ? 'Cerrada' : 'Abierta'
                            }
                        }
                    }
                });
            });
            // Ejecutar todas las actualizaciones en una sola operación
            if (bulkOps.length > 0) {
                yield Viaje.bulkWrite(bulkOps);
            }
        }
        catch (error) {
            logger_1.default.error('Error actualizando estados de partida en bulk:', error);
        }
    });
}
//# sourceMappingURL=estadoPartida.js.map