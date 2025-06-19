import { deleteVehiculo as deleteVehiculoService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';
/**
 * @desc    Eliminar un vehículo
 * @route   DELETE /api/vehiculos/:id
 * @access  Private
 */
const deleteVehiculo = async (req, res) => {
    try {
        const resultado = await deleteVehiculoService(req.params.id);
        res.json(resultado);
    }
    catch (error) {
        if (error.message === 'Vehículo no encontrado') {
            res.status(404).json({ message: error.message });
            return;
        }
        logger.error(`Error al eliminar vehículo ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al eliminar vehículo', error: error.message });
    }
};
export default deleteVehiculo;
//# sourceMappingURL=deleteVehiculo.js.map