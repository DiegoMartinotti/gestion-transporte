// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import FormulasPersonalizadasCliente, {
  IFormulasPersonalizadasCliente,
} from '../../models/FormulasPersonalizadasCliente';
import Cliente from '../../models/Cliente';
import logger from '../../utils/logger';
import { checkOverlap } from './utils/checkOverlap';
import { FormulaCreateRequest, ApiResponse } from './types';

export const createFormula = async (
  req: Request<
    Record<string, unknown>,
    IFormulasPersonalizadasCliente | ApiResponse,
    FormulaCreateRequest
  >,
  res: Response<IFormulasPersonalizadasCliente | ApiResponse>
): Promise<void> => {
  try {
    const { clienteId, tipoUnidad, formula, vigenciaDesde, vigenciaHasta } = req.body;

    if (!clienteId || !tipoUnidad || !formula || !vigenciaDesde) {
      res
        .status(400)
        .json({
          message: 'Faltan campos requeridos: clienteId, tipoUnidad, formula, vigenciaDesde',
        });
      return;
    }

    // Validar que el cliente exista
    const clienteExists = await Cliente.findById(clienteId);
    if (!clienteExists) {
      res.status(404).json({ message: 'Cliente no encontrado' });
      return;
    }

    // Validar fechas
    const desdeDate = new Date(vigenciaDesde);
    const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : null;

    if (hastaDate && desdeDate >= hastaDate) {
      res
        .status(400)
        .json({ message: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta' });
      return;
    }

    // Validar solapamiento
    const overlap = await checkOverlap(clienteId, tipoUnidad, desdeDate, hastaDate);
    if (overlap) {
      res.status(400).json({
        message: `El período de vigencia se solapa con una fórmula existente (ID: ${overlap._id}, Vigencia: ${overlap.vigenciaDesde.toISOString().split('T')[0]} - ${overlap.vigenciaHasta ? overlap.vigenciaHasta.toISOString().split('T')[0] : 'Activa'})`,
        overlappingFormula: overlap,
      });
      return;
    }

    const nuevaFormula = new FormulasPersonalizadasCliente({
      clienteId,
      tipoUnidad,
      formula,
      vigenciaDesde: desdeDate,
      vigenciaHasta: hastaDate,
    });

    await nuevaFormula.save();
    logger.info(`Nueva fórmula creada para cliente ${clienteId}, tipo ${tipoUnidad}`);
    res.status(201).json(nuevaFormula);
  } catch (error: any) {
    logger.error('Error al crear fórmula personalizada:', error);
    res.status(500).json({ message: 'Error interno al crear la fórmula', error: error.message });
  }
};
