import express from 'express';
import { deleteVehiculo as deleteVehiculoService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';

/**
 * @desc    Eliminar un vehículo
 * @route   DELETE /api/vehiculos/:id
 * @access  Private
 */
const deleteVehiculo = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const resultado = await deleteVehiculoService(req.params.id);
    res.json(resultado);
  } catch (error) {
    if ((error as Error).message === 'Vehículo no encontrado') {
      res.status(404).json({ message: (error as Error).message });
      return;
    }
    logger.error(`Error al eliminar vehículo ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar vehículo', error: (error as Error).message });
  }
};

export default deleteVehiculo;