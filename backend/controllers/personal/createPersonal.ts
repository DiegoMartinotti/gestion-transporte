// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Response } from 'express';
import { Types } from 'mongoose';
import Personal, { IPersonal } from '../../models/Personal';
import Empresa from '../../models/Empresa';
import logger from '../../utils/logger';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: string[];
  empresa?: Types.ObjectId;
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  body: Record<string, unknown>;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  count?: number;
  error?: string;
}

/**
 * Valida si la empresa existe
 */
const validateEmpresa = async (empresaId: unknown): Promise<boolean> => {
  if (!empresaId) return true;
  const empresaExists = await Empresa.findById(empresaId);
  return !!empresaExists;
};

/**
 * Verifica si el error es de validación
 */
const isValidationError = (error: unknown): error is { name: string } => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'ValidationError'
  );
};

/**
 * Verifica si el error es de duplicado
 */
const isDuplicateError = (error: unknown): error is { code: number } => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
};

/**
 * Obtiene el mensaje de error de forma segura
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Maneja errores de creación de personal
 */
const handleCreationError = (error: unknown, res: Response<IPersonal | ApiResponse>): void => {
  logger.error('Error al crear personal:', error);

  if (isValidationError(error)) {
    let message = 'Error de validación';

    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = getErrorMessage(error);
      if (typeof errorMessage === 'string') {
        message = errorMessage;
      }
    }

    res.status(400).json({ error: message });
    return;
  }

  if (isDuplicateError(error)) {
    res.status(400).json({ error: 'Ya existe un registro con ese DNI' });
    return;
  }

  res.status(500).json({ error: 'Error al crear personal' });
};

/**
 * Crear un nuevo registro de personal
 */
export const createPersonal = async (
  req: AuthenticatedRequest,
  res: Response<IPersonal | ApiResponse>
): Promise<void> => {
  try {
    const personalData = req.body;

    // Verificar si la empresa existe
    const empresaValid = await validateEmpresa(personalData.empresa);
    if (!empresaValid) {
      res.status(400).json({ error: 'La empresa especificada no existe' });
      return;
    }

    // Si no se proporciona un período de empleo, crear uno con la fecha actual
    if (!personalData.periodosEmpleo || personalData.periodosEmpleo.length === 0) {
      personalData.periodosEmpleo = [
        {
          fechaIngreso: new Date(),
          categoria: 'Inicial',
        },
      ];
    }

    // Crear el registro de personal
    const personal = new Personal(personalData);
    await personal.save();

    res.status(201).json(personal);
  } catch (error: unknown) {
    handleCreationError(error, res);
  }
};
