const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');

/**
 * @desc    Obtener vehículos con documentación próxima a vencer
 * @route   GET /api/vehiculos/vencimientos/:dias
 * @access  Private
 */
const getVehiculosConVencimientos = async (req, res) => {
  try {
    const diasLimite = req.params.dias;
    const vehiculos = await vehiculoService.getVehiculosConVencimientos(diasLimite);
    res.json(vehiculos);
  } catch (error) {
    logger.error('Error al obtener vehículos con vencimientos próximos:', error);
    res.status(500).json({ message: 'Error al obtener vehículos con vencimientos', error: error.message });
  }
};

module.exports = getVehiculosConVencimientos; 