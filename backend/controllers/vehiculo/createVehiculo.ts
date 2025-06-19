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
 * Valida los datos de entrada para la creación de un vehículo
 * @param {Object} data - Datos del vehículo a validar
 * @returns {Object} - Resultado de la validación { valido, errores }
 */
const validarDatosVehiculo = (data: VehiculoData): ValidationResult => {
  const errores: string[] = [];
  
  // Validar campos obligatorios
  if (!data) {
    errores.push('No se proporcionaron datos del vehículo');
    return { valido: false, errores };
  }
  
  if (!data.dominio) {
    errores.push('El dominio del vehículo es obligatorio');
  } else if (typeof data.dominio !== 'string' || data.dominio.trim().length < 3) {
    errores.push('El dominio debe tener al menos 3 caracteres');
  }
  
  if (!data.empresa) {
    errores.push('La empresa asociada es obligatoria');
  }
  
  if (!data.tipo) {
    errores.push('El tipo de vehículo es obligatorio');
  }
  
  if (data.activo !== undefined && typeof data.activo !== 'boolean') {
    errores.push('El campo activo debe ser un valor booleano');
  }
  
  if (data.capacidad !== undefined) {
    const capacidad = Number(data.capacidad);
    if (isNaN(capacidad) || capacidad <= 0) {
      errores.push('La capacidad debe ser un número positivo');
    }
  }
  
  // Validar formato de fechas en la documentación
  if (data.documentacion) {
    const docs = ['seguro', 'vtv', 'ruta', 'senasa'] as const;
    docs.forEach(doc => {
      if (data.documentacion![doc] && data.documentacion![doc]!.vencimiento) {
        const fecha = new Date(data.documentacion![doc]!.vencimiento!);
        if (isNaN(fecha.getTime())) {
          errores.push(`La fecha de vencimiento de ${doc} no es válida`);
        }
      }
    });
  }
  
  return { 
    valido: errores.length === 0,
    errores
  };
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
    // Validar datos de entrada
    const { valido, errores } = validarDatosVehiculo(req.body);
    
    if (!valido) {
      logger.warn(`Validación fallida al crear vehículo: ${errores.join(', ')}`);
      res.status(400).json({ 
        exito: false,
        mensaje: 'Datos de vehículo inválidos',
        errores 
      });
      return;
    }
    
    // Normalizar el dominio (siempre en mayúsculas)
    if (req.body.dominio) {
      req.body.dominio = req.body.dominio.toUpperCase().trim();
    }
    
    // Crear el vehículo
    const vehiculoGuardado = await createVehiculoService(req.body);
    
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Vehículo creado con ID ${vehiculoGuardado._id} (tiempo: ${tiempoTotal}ms)`);
    
    res.status(201).json({
      exito: true,
      mensaje: 'Vehículo creado correctamente',
      datos: vehiculoGuardado
    });
  } catch (error) {
    const tiempoTotal = Date.now() - inicioTiempo;
    
    // Manejar errores específicos
    if ((error as Error).message.includes('empresa') || 
        (error as Error).message.includes('La empresa especificada no existe')) {
      logger.warn(`Error al crear vehículo - Empresa no válida: ${(error as Error).message} (tiempo: ${tiempoTotal}ms)`);
      res.status(400).json({ 
        exito: false,
        mensaje: 'La empresa especificada no existe',
        error: (error as Error).message 
      });
      return;
    }
    
    if ((error as Error).message.includes('dominio') || 
        (error as Error).message.includes('Ya existe un vehículo con ese dominio')) {
      logger.warn(`Error al crear vehículo - Dominio duplicado: ${(error as Error).message} (tiempo: ${tiempoTotal}ms)`);
      res.status(400).json({ 
        exito: false,
        mensaje: 'Ya existe un vehículo con ese dominio',
        error: (error as Error).message 
      });
      return;
    }
    
    // Error genérico
    logger.error(`Error al crear vehículo: ${(error as Error).message} (tiempo: ${tiempoTotal}ms)`, error);
    res.status(500).json({ 
      exito: false,
      mensaje: 'Error al crear vehículo', 
      error: (error as Error).message 
    });
  }
};

export default createVehiculo;