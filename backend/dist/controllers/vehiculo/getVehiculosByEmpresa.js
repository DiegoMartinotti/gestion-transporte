import { getVehiculosByEmpresa as getVehiculosByEmpresaService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';
/**
 * @desc    Obtener vehículos por empresa
 * @route   GET /api/vehiculos/empresa/:empresaId
 * @access  Private
 */
const getVehiculosByEmpresa = async (req, res) => {
    try {
        const { empresaId } = req.params;
        const vehiculos = await getVehiculosByEmpresaService(empresaId);
        res.json(vehiculos);
    }
    catch (error) {
        logger.error(`Error al obtener vehículos de la empresa ${req.params.empresaId}:`, error);
        res.status(500).json({ message: 'Error al obtener vehículos por empresa', error: error.message });
    }
};
export default getVehiculosByEmpresa;
//# sourceMappingURL=getVehiculosByEmpresa.js.map