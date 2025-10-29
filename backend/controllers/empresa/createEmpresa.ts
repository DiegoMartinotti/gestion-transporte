// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Empresa, { IEmpresa } from '../../models/Empresa';
import logger from '../../utils/logger';
import { isDuplicateError, hasProperty } from '../../utils/typeGuards';

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  errores?: string[];
  error?: string;
}

/**
 * Verifica si es un error de validación de MongoDB
 */
const isValidationError = (
  error: unknown
): error is { name: string; errors: Record<string, { message: string }> } => {
  return (
    hasProperty(error, 'name') &&
    error.name === 'ValidationError' &&
    hasProperty(error, 'errors') &&
    typeof error.errors === 'object'
  );
};

/**
 * Crea una nueva empresa
 */
export const createEmpresa = async (
  req: Request,
  res: Response<IEmpresa | ApiResponse>
): Promise<void> => {
  try {
    const nuevaEmpresa = new Empresa(req.body);
    await nuevaEmpresa.save();
    res.status(201).json(nuevaEmpresa);
  } catch (error: unknown) {
    logger.error('Error al crear empresa:', error);

    if (isValidationError(error)) {
      const errores = Object.values(error.errors).map((err) => err.message);
      res.status(400).json({ message: 'Error de validación', errores });
      return;
    }

    if (isDuplicateError(error)) {
      res.status(400).json({
        message: 'Error de duplicado',
        error: `Ya existe una empresa con el nombre ${req.body.nombre}`,
      });
      return;
    }

    res.status(500).json({ message: 'Error al crear empresa' });
  }
};
