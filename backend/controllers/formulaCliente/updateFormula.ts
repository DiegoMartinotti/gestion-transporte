// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import FormulasPersonalizadasCliente, {
  IFormulasPersonalizadasCliente,
} from '../../models/FormulasPersonalizadasCliente';
import logger from '../../utils/logger';
import { checkOverlap } from './utils/checkOverlap';
import { FormulaUpdateRequest, ApiResponse } from './types';

// eslint-disable-next-line max-lines-per-function, complexity
export const updateFormula = async (
  req: Request<{ id: string }, IFormulasPersonalizadasCliente | ApiResponse, FormulaUpdateRequest>,
  res: Response<IFormulasPersonalizadasCliente | ApiResponse>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { formula, vigenciaDesde, vigenciaHasta } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'ID de fórmula inválido' });
      return;
    }

    const formulaExistente = await FormulasPersonalizadasCliente.findById(id);
    if (!formulaExistente) {
      res.status(404).json({ message: 'Fórmula no encontrada' });
      return;
    }

    // Validar fechas si se proporcionan
    const desdeDate = vigenciaDesde ? new Date(vigenciaDesde) : formulaExistente.vigenciaDesde;
    const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : formulaExistente.vigenciaHasta;

    if (Object.prototype.hasOwnProperty.call(req.body, 'vigenciaHasta') && vigenciaHasta === null) {
      // Permitir establecer vigenciaHasta a null
    } else if (hastaDate && desdeDate >= hastaDate) {
      res
        .status(400)
        .json({ message: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta' });
      return;
    }

    // Validar solapamiento excluyendo el documento actual
    const overlap = await checkOverlap(
      formulaExistente.clienteId.toString(),
      formulaExistente.tipoUnidad,
      desdeDate,
      hastaDate || null,
      id
    );
    if (overlap) {
      res.status(400).json({
        message: `El nuevo período de vigencia se solapa con otra fórmula existente (ID: ${overlap._id})`,
        overlappingFormula: overlap,
      });
      return;
    }

    // Actualizar campos permitidos
    if (formula) formulaExistente.formula = formula;
    if (vigenciaDesde) formulaExistente.vigenciaDesde = desdeDate;
    // Manejar explícitamente la actualización de vigenciaHasta (incluyendo null)
    if (Object.prototype.hasOwnProperty.call(req.body, 'vigenciaHasta')) {
      formulaExistente.vigenciaHasta = hastaDate;
    }

    const formulaActualizada = await formulaExistente.save();
    logger.info(`Fórmula ${id} actualizada.`);
    res.json(formulaActualizada);
  } catch (error: unknown) {
    logger.error(`Error al actualizar fórmula ${req.params.id}:`, error);
    res
      .status(500)
      .json({
        message: 'Error interno al actualizar la fórmula',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
  }
};
