// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Empresa, { IEmpresa } from '../../models/Empresa';
import logger from '../../utils/logger';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isValidationError = (
  error: unknown
): error is { name: string; errors: Record<string, unknown> } => {
  return !!(
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'ValidationError' &&
    'errors' in error
  );
};

/**
 * Verifica si es un error de duplicado de MongoDB
 */
const isDuplicateError = (error: unknown): error is { code: number } => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(error && typeof error === 'object' && 'code' in error && (error as any).code === 11000);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errores = Object.values(error.errors).map(
        (err: any) => (err as { message: string }).message
      );
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
