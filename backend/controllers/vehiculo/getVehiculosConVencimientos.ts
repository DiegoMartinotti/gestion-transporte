import express from 'express';
import { getVehiculosConVencimientos as getVehiculosConVencimientosService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';

/**
 * @desc    Obtener vehículos con documentación próxima a vencer
 * @route   GET /api/vehiculos/vencimientos/:dias
 * @access  Private
 */
const getVehiculosConVencimientos = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const diasLimite = parseInt(req.params.dias) || 30;
    const vehiculos = await getVehiculosConVencimientosService(diasLimite);
    res.json(vehiculos);
  } catch (error) {
    logger.error('Error al obtener vehículos con vencimientos próximos:', error);
    res.status(500).json({ message: 'Error al obtener vehículos con vencimientos', error: (error as Error).message });
  }
};

export default getVehiculosConVencimientos;