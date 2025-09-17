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
const isValidationError = (
  error: unknown
): error is { name: string; errors: Record<string, unknown> } => {
  return !!(
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as any).name === 'ValidationError' &&
    'errors' in error
  );
};

/**
 * Verifica si es un error de duplicado de MongoDB
 */
const isDuplicateError = (error: unknown): error is { code: number } => {
  return !!(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
};

/**
 * Actualiza una empresa existente
 */
export const updateEmpresa = async (
  req: Request,
  res: Response<IEmpresa | ApiResponse>
): Promise<void> => {
  try {
    const empresa: IEmpresa | null = await Empresa.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!empresa) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }
    res.json(empresa);
  } catch (error: unknown) {
    logger.error('Error al actualizar empresa:', error);

    if (isValidationError(error)) {
      const errores = Object.values(error.errors).map(
        (err) => (err as { message: string }).message
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

    res.status(500).json({ message: 'Error al actualizar empresa' });
  }
};
