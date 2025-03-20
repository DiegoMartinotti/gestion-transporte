const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');

/**
 * @desc    Eliminar un vehículo
 * @route   DELETE /api/vehiculos/:id
 * @access  Private
 */
const deleteVehiculo = async (req, res) => {
  try {
    const resultado = await vehiculoService.deleteVehiculo(req.params.id);
    res.json(resultado);
  } catch (error) {
    if (error.message === 'Vehículo no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    logger.error(`Error al eliminar vehículo ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar vehículo', error: error.message });
  }
};

module.exports = deleteVehiculo; 