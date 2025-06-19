import { getVehiculoById as getVehiculoByIdService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';
import { APIError } from '../../middleware/errorHandler';
import mongoose from 'mongoose';
/**
 * Valida que el ID proporcionado sea un ObjectId válido de MongoDB
 * @param {string} id - ID a validar
 * @returns {boolean} true si es válido
 */
const validarObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};
/**
 * @desc    Obtener un vehículo por su ID
 * @route   GET /api/vehiculos/:id
 * @access  Private
 */
const getVehiculoById = async (req, res, next) => {
    const inicioTiempo = Date.now();
    const { id } = req.params;
    logger.info(`Petición recibida: GET /api/vehiculos/${id}`);
    try {
        // Validar formato del ID
        if (!id) {
            throw APIError.validacion('Se requiere el ID del vehículo');
        }
        if (!validarObjectId(id)) {
            logger.warn(`ID de vehículo inválido: ${id}`);
            throw APIError.validacion('El ID proporcionado no tiene un formato válido');
        }
        // Obtener el vehículo
        const vehiculo = await getVehiculoByIdService(id);
        // Si no se encontró, lanzar error específico
        if (!vehiculo) {
            throw APIError.noEncontrado(`Vehículo con ID ${id} no encontrado`, 'vehiculo');
        }
        const tiempoTotal = Date.now() - inicioTiempo;
        logger.info(`Vehículo ${id} obtenido correctamente (tiempo: ${tiempoTotal}ms)`);
        // Responder con éxito
        res.status(200).json({
            exito: true,
            datos: vehiculo
        });
    }
    catch (error) {
        // Si es un error de la API lo pasamos al middleware
        if (error instanceof APIError) {
            return next(error);
        }
        const tiempoTotal = Date.now() - inicioTiempo;
        // Si es un error específico de "no encontrado"
        if (error.message.includes('no encontrado')) {
            logger.warn(`Vehículo no encontrado: ${id} (tiempo: ${tiempoTotal}ms)`);
            return next(APIError.noEncontrado(`Vehículo con ID ${id} no encontrado`, 'vehiculo'));
        }
        // Error general
        logger.error(`Error al obtener vehículo ${id}: ${error.message} (tiempo: ${tiempoTotal}ms)`, error);
        next(new APIError(`Error al obtener vehículo: ${error.message}`));
    }
};
export default getVehiculoById;
//# sourceMappingURL=getVehiculoById.js.map