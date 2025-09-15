// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Extra, { IExtra } from '../../models/Extra';
import logger from '../../utils/logger';

/**
 * Obtener todos los extras
 */
export const getAllExtras = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.cliente ? { cliente: (req.query.cliente as string).toUpperCase() } : {};
    const extras: IExtra[] = await Extra.find(query).sort({ nombre: 1 });
    res.json(extras);
  } catch (error) {
    logger.error('Error al obtener extras:', error);
    res.status(500).json({ success: false, message: 'Error al obtener extras' });
  }
};
