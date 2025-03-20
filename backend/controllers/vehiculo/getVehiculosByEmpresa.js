const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');

/**
 * @desc    Obtener vehículos por empresa
 * @route   GET /api/vehiculos/empresa/:empresaId
 * @access  Private
 */
const getVehiculosByEmpresa = async (req, res) => {
  try {
    const { empresaId } = req.params;
    const vehiculos = await vehiculoService.getVehiculosByEmpresa(empresaId);
    res.json(vehiculos);
  } catch (error) {
    logger.error(`Error al obtener vehículos de la empresa ${req.params.empresaId}:`, error);
    res.status(500).json({ message: 'Error al obtener vehículos por empresa', error: error.message });
  }
};

module.exports = getVehiculosByEmpresa; 