import express from 'express';
import { createVehiculo as createVehiculoService } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';

interface DocumentacionVencimiento {
  vencimiento?: string;
}

interface Documentacion {
  seguro?: DocumentacionVencimiento;
  vtv?: DocumentacionVencimiento;
  ruta?: DocumentacionVencimiento;
  senasa?: DocumentacionVencimiento;
}

interface VehiculoData {
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
 * Valida el dominio del vehículo
 */
const validarDominio = (dominio?: string, errores: string[] = []): void => {
  if (!dominio) {
    errores.push('El dominio del vehículo es obligatorio');
  } else if (typeof dominio !== 'string' || dominio.trim().length < 3) {
    errores.push('El dominio debe tener al menos 3 caracteres');
  }
};

/**
 * Valida campos opcionales del vehículo
 */
const validarCamposOpcionales = (data: VehiculoData, errores: string[] = []): void => {
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
const validarDocumentacion = (documentacion?: Documentacion, errores: string[] = []): void => {
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
 * Valida los datos de entrada para la creación de un vehículo
 * @param {Object} data - Datos del vehículo a validar
 * @returns {Object} - Resultado de la validación { valido, errores }
 */
const validarDatosVehiculo = (data: VehiculoData): ValidationResult => {
  const errores: string[] = [];

  if (!data) {
    return { valido: false, errores: ['No se proporcionaron datos del vehículo'] };
  }

  validarDominio(data.dominio, errores);

  if (!data.empresa) errores.push('La empresa asociada es obligatoria');
  if (!data.tipo) errores.push('El tipo de vehículo es obligatorio');

  validarCamposOpcionales(data, errores);
  validarDocumentacion(data.documentacion, errores);

  return { valido: errores.length === 0, errores };
};

/**
 * Maneja errores específicos de creación de vehículo
 */
const manejarErrorCreacion = (error: Error, res: express.Response, tiempoTotal: number): void => {
  const mensaje = error.message;

  if (mensaje.includes('empresa') || mensaje.includes('La empresa especificada no existe')) {
    logger.warn(
      `Error al crear vehículo - Empresa no válida: ${mensaje} (tiempo: ${tiempoTotal}ms)`
    );
    res.status(400).json({
      exito: false,
      mensaje: 'La empresa especificada no existe',
      error: mensaje,
    });
    return;
  }

  if (mensaje.includes('dominio') || mensaje.includes('Ya existe un vehículo con ese dominio')) {
    logger.warn(
      `Error al crear vehículo - Dominio duplicado: ${mensaje} (tiempo: ${tiempoTotal}ms)`
    );
    res.status(400).json({
      exito: false,
      mensaje: 'Ya existe un vehículo con ese dominio',
      error: mensaje,
    });
    return;
  }

  logger.error(`Error al crear vehículo: ${mensaje} (tiempo: ${tiempoTotal}ms)`, error);
  res.status(500).json({
    exito: false,
    mensaje: 'Error al crear vehículo',
    error: mensaje,
  });
};

/**
 * @desc    Crear un nuevo vehículo
 * @route   POST /api/vehiculos
 * @access  Private
 */
const createVehiculo = async (req: express.Request, res: express.Response): Promise<void> => {
  const inicioTiempo = Date.now();
  logger.info(`Petición recibida: POST /api/vehiculos`);

  try {
    const { valido, errores } = validarDatosVehiculo(req.body);

    if (!valido) {
      logger.warn(`Validación fallida al crear vehículo: ${errores.join(', ')}`);
      res.status(400).json({
        exito: false,
        mensaje: 'Datos de vehículo inválidos',
        errores,
      });
      return;
    }

    if (req.body.dominio) {
      req.body.dominio = req.body.dominio.toUpperCase().trim();
    }

    const vehiculoGuardado = await createVehiculoService(req.body);

    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Vehículo creado con ID ${vehiculoGuardado._id} (tiempo: ${tiempoTotal}ms)`);

    res.status(201).json({
      exito: true,
      mensaje: 'Vehículo creado correctamente',
      datos: vehiculoGuardado,
    });
  } catch (error) {
    manejarErrorCreacion(error as Error, res, Date.now() - inicioTiempo);
  }
};

export default createVehiculo;
