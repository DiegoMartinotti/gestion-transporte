// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Extra, { IExtra } from '../../models/Extra';
import logger from '../../utils/logger';

/**
 * Actualizar extra
 */
export const updateExtra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    const extra: IExtra | null = await Extra.findByIdAndUpdate(id, datosActualizados, {
      new: true,
      runValidators: true,
    });

    if (!extra) {
      res.status(404).json({ success: false, message: 'Extra no encontrado' });
      return;
    }

    res.json({
      success: true,
      data: extra,
      message: 'Extra actualizado exitosamente',
    });
  } catch (error) {
    logger.error('Error al actualizar extra:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar extra' });
  }
};
