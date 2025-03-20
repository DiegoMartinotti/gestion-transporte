const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');

/**
 * @desc    Obtener vehículos con documentación vencida
 * @route   GET /api/vehiculos/vencidos
 * @access  Private
 */
const getVehiculosVencidos = async (req, res) => {
  try {
    const vehiculos = await vehiculoService.getVehiculosVencidos();
    res.json(vehiculos);
  } catch (error) {
    logger.error('Error al obtener vehículos con documentación vencida:', error);
    res.status(500).json({ message: 'Error al obtener vehículos vencidos', error: error.message });
  }
};

module.exports = getVehiculosVencidos; 