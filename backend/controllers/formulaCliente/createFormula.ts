// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import FormulasPersonalizadasCliente, {
  IFormulasPersonalizadasCliente,
} from '../../models/FormulasPersonalizadasCliente';
import Cliente from '../../models/Cliente';
import logger from '../../utils/logger';
import { checkOverlap } from './utils/checkOverlap';
import { FormulaCreateRequest, ApiResponse } from './types';

/**
 * Valida los campos requeridos
 */
const validateRequiredFields = (body: FormulaCreateRequest): string | null => {
  const { clienteId, tipoUnidad, formula, vigenciaDesde } = body;
  if (!clienteId || !tipoUnidad || !formula || !vigenciaDesde) {
    return 'Faltan campos requeridos: clienteId, tipoUnidad, formula, vigenciaDesde';
  }
  return null;
};

/**
 * Valida las fechas de vigencia
 */
const validateDates = (
  vigenciaDesde: string,
  vigenciaHasta?: string
): { isValid: boolean; error?: string; desdeDate: Date; hastaDate: Date | null } => {
  const desdeDate = new Date(vigenciaDesde);
  const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : null;

  if (hastaDate && desdeDate >= hastaDate) {
    return {
      isValid: false,
      error: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta',
      desdeDate,
      hastaDate,
    };
  }

  return { isValid: true, desdeDate, hastaDate };
};

/**
 * Crea y guarda una nueva fórmula
 */
const createAndSaveFormula = async (params: {
  clienteId: string;
  tipoUnidad: string;
  formula: string;
  desdeDate: Date;
  hastaDate: Date | null;
}) => {
  const { clienteId, tipoUnidad, formula, desdeDate, hastaDate } = params;
  const nuevaFormula = new FormulasPersonalizadasCliente({
    clienteId,
    tipoUnidad,
    formula,
    vigenciaDesde: desdeDate,
    vigenciaHasta: hastaDate,
  });
  await nuevaFormula.save();
  logger.info(`Nueva fórmula creada para cliente ${clienteId}, tipo ${tipoUnidad}`);
  return nuevaFormula;
};

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

    // Validar campos requeridos
    const fieldsError = validateRequiredFields(req.body);
    if (fieldsError) {
      res.status(400).json({ message: fieldsError });
      return;
    }

    // Validar que el cliente exista
    const clienteExists = await Cliente.findById(clienteId);
    if (!clienteExists) {
      res.status(404).json({ message: 'Cliente no encontrado' });
      return;
    }

    // Validar fechas
    const dateValidation = validateDates(vigenciaDesde, vigenciaHasta);
    if (!dateValidation.isValid) {
      res.status(400).json({ message: dateValidation.error });
      return;
    }

    const { desdeDate, hastaDate } = dateValidation;

    // Validar solapamiento
    const overlap = await checkOverlap(clienteId, tipoUnidad, desdeDate, hastaDate);
    if (overlap) {
      const desde = overlap.vigenciaDesde.toISOString().split('T')[0];
      const hasta = overlap.vigenciaHasta?.toISOString().split('T')[0] || 'Activa';
      res.status(400).json({
        message: `El período se solapa con fórmula existente (ID: ${overlap._id}, ${desde} - ${hasta})`,
        overlappingFormula: overlap,
      });
      return;
    }

    const nuevaFormula = await createAndSaveFormula({
      clienteId,
      tipoUnidad,
      formula,
      desdeDate,
      hastaDate,
    });
    res.status(201).json(nuevaFormula);
  } catch (error: unknown) {
    logger.error('Error al crear fórmula personalizada:', error);
    const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Error desconocido';
    res.status(500).json({ message: 'Error interno al crear la fórmula', error: errorMessage });
  }
};
