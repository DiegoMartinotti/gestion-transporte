import { getVehiculosVencidos as getVehiculosVencidosService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';
/**
 * @desc    Obtener vehículos con documentación vencida
 * @route   GET /api/vehiculos/vencidos
 * @access  Private
 */
const getVehiculosVencidos = async (req, res) => {
    try {
        const vehiculos = await getVehiculosVencidosService();
        res.json(vehiculos);
    }
    catch (error) {
        logger.error('Error al obtener vehículos con documentación vencida:', error);
        res.status(500).json({ message: 'Error al obtener vehículos vencidos', error: error.message });
    }
};
export default getVehiculosVencidos;
//# sourceMappingURL=getVehiculosVencidos.js.map