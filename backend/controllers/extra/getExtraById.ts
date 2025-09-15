// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Extra, { IExtra } from '../../models/Extra';
import logger from '../../utils/logger';

/**
 * Obtener extra por ID
 */
export const getExtraById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const extra: IExtra | null = await Extra.findById(id);

    if (!extra) {
      res.status(404).json({ success: false, message: 'Extra no encontrado' });
      return;
    }

    res.json(extra);
  } catch (error) {
    logger.error('Error al obtener extra:', error);
    res.status(500).json({ success: false, message: 'Error al obtener extra' });
  }
};
