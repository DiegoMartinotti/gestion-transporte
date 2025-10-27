import express from 'express';
import { updateVehiculo as updateVehiculoService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';
import { APIError } from '../../middleware/errorHandler';
import mongoose from 'mongoose';

interface DocumentacionVencimiento {
  vencimiento?: string;
}

interface Documentacion {
  seguro?: DocumentacionVencimiento;
  vtv?: DocumentacionVencimiento;
  ruta?: DocumentacionVencimiento;
  senasa?: DocumentacionVencimiento;
}

interface VehiculoUpdateData {
  dominio?: string;
  empresa?: string;
  tipo?: string;
  activo?: boolean;
  capacidad?: number | string;
  documentacion?: Documentacion;
}

interface ValidationResult {
  valido: boolean;
  errores: string[];
}

/**
 * Valida que el ID proporcionado sea un ObjectId válido de MongoDB
 */
const validarObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Valida dominio de actualización
 */
const validarDominioUpdate = (dominio?: string, errores: string[] = []): void => {
  if (dominio !== undefined && (typeof dominio !== 'string' || dominio.trim().length < 3)) {
    errores.push('El dominio debe tener al menos 3 caracteres');
  }
};

/**
 * Valida empresa de actualización
 */
const validarEmpresaUpdate = (empresa?: string, errores: string[] = []): void => {
  if (empresa !== undefined && !validarObjectId(empresa)) {
    errores.push('El ID de empresa no tiene un formato válido');
  }
};

/**
 * Valida campos opcionales de actualización
 */
const validarCamposOpcionalesUpdate = (data: VehiculoUpdateData, errores: string[] = []): void => {
  if (data.activo !== undefined && typeof data.activo !== 'boolean') {
    errores.push('El campo activo debe ser un valor booleano');
  }

  if (data.capacidad !== undefined) {
    const capacidad = Number(data.capacidad);
    if (isNaN(capacidad) || capacidad <= 0) {
      errores.push('La capacidad debe ser un número positivo');
    }
  }
};

/**
 * Valida fechas de documentación
 */
const validarDocumentacionUpdate = (
  documentacion?: Documentacion,
  errores: string[] = []
): void => {
  if (!documentacion) return;

  const docs = ['seguro', 'vtv', 'ruta', 'senasa'] as const;
  docs.forEach((doc) => {
    if (documentacion[doc]?.vencimiento) {
      const fecha = new Date(documentacion[doc]!.vencimiento!);
      if (isNaN(fecha.getTime())) {
        errores.push(`La fecha de vencimiento de ${doc} no es válida`);
      }
    }
  });
};

/**
 * Valida los datos de actualización de un vehículo
 */
const validarDatosActualizacion = (data: VehiculoUpdateData): ValidationResult => {
  const errores: string[] = [];

  if (!data || Object.keys(data).length === 0) {
    return { valido: false, errores: ['No se proporcionaron datos para actualizar'] };
  }

  validarDominioUpdate(data.dominio, errores);
  validarEmpresaUpdate(data.empresa, errores);
  validarCamposOpcionalesUpdate(data, errores);
  validarDocumentacionUpdate(data.documentacion, errores);

  return { valido: errores.length === 0, errores };
};

/**
 * Maneja errores específicos de actualización
 */
const manejarErrorActualizacion = (
  error: Error,
  id: string,
  next: express.NextFunction,
  tiempoTotal: number
): void => {
  const mensaje = error.message;

  if (mensaje.includes('empresa') || mensaje.includes('La empresa especificada no existe')) {
    logger.warn(
      `Error al actualizar vehículo - Empresa no válida: ${mensaje} (tiempo: ${tiempoTotal}ms)`
    );
    next(APIError.validacion('La empresa especificada no existe', { campo: 'empresa' }));
    return;
  }

  if (mensaje.includes('dominio') || mensaje.includes('Ya existe un vehículo con ese dominio')) {
    logger.warn(
      `Error al actualizar vehículo - Dominio duplicado: ${mensaje} (tiempo: ${tiempoTotal}ms)`
    );
    next(APIError.conflicto('Ya existe un vehículo con ese dominio', { campo: 'dominio' }));
    return;
  }

  if (mensaje.includes('no encontrado')) {
    logger.warn(`Vehículo no encontrado al actualizar: ${id} (tiempo: ${tiempoTotal}ms)`);
    next(APIError.noEncontrado(`Vehículo con ID ${id} no encontrado`, 'vehiculo'));
    return;
  }

  logger.error(`Error al actualizar vehículo ${id}: ${mensaje} (tiempo: ${tiempoTotal}ms)`, error);
  next(new APIError(`Error al actualizar vehículo: ${mensaje}`));
};

/**
 * @desc    Actualizar un vehículo existente
 * @route   PUT /api/vehiculos/:id
 * @access  Private
 */
const updateVehiculo = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  const inicioTiempo = Date.now();
  const { id } = req.params;

  logger.info(`Petición recibida: PUT /api/vehiculos/${id}`);

  try {
    if (!id || !validarObjectId(id)) {
      logger.warn(`ID de vehículo inválido: ${id}`);
      throw APIError.validacion('El ID proporcionado no tiene un formato válido');
    }

    const { valido, errores } = validarDatosActualizacion(req.body);

    if (!valido) {
      logger.warn(`Validación fallida al actualizar vehículo ${id}: ${errores.join(', ')}`);
      throw APIError.validacion('Datos de actualización inválidos', { errores });
    }

    if (req.body.dominio) {
      req.body.dominio = req.body.dominio.toUpperCase().trim();
    }

    const vehiculoActualizado = await updateVehiculoService(id, req.body);

    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Vehículo ${id} actualizado correctamente (tiempo: ${tiempoTotal}ms)`);

    res.status(200).json({
      exito: true,
      mensaje: 'Vehículo actualizado correctamente',
      datos: vehiculoActualizado,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return next(error);
    }

    manejarErrorActualizacion(error as Error, id, next, Date.now() - inicioTiempo);
  }
};

export default updateVehiculo;
