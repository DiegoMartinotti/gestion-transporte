// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import logger from '../../utils/logger';
import { ApiResponse } from './types';

export const deleteFormula = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'ID de fórmula inválido' });
      return;
    }

    const formula = await FormulasPersonalizadasCliente.findByIdAndDelete(id);

    if (!formula) {
      res.status(404).json({ message: 'Fórmula no encontrada' });
      return;
    }

    logger.info(`Fórmula ${id} eliminada.`);
    res.json({ message: 'Fórmula eliminada exitosamente' });
  } catch (error: unknown) {
    logger.error(`Error al eliminar fórmula ${req.params.id}:`, error);
    res
      .status(500)
      .json({
        message: 'Error interno al eliminar la fórmula',
        error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error),
      });
  }
};
