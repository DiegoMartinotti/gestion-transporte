import express from 'express';
import { getVehiculosVencidos as getVehiculosVencidosService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';

/**
 * @desc    Obtener vehículos con documentación vencida
 * @route   GET /api/vehiculos/vencidos
 * @access  Private
 */
const getVehiculosVencidos = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const vehiculos = await getVehiculosVencidosService();
    res.json(vehiculos);
  } catch (error) {
    logger.error('Error al obtener vehículos con documentación vencida:', error);
    res.status(500).json({ message: 'Error al obtener vehículos vencidos', error: (error as Error).message });
  }
};

export default getVehiculosVencidos;