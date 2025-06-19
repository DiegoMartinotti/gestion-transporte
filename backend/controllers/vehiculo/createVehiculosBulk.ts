import express from 'express';
import { createVehiculosBulk as createVehiculosBulkService } from '../../services/vehiculo/vehiculoService';
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

// Interface que coincide con la del servicio
interface VehiculoBulkData {
  patenteFaltante: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  empresa: string;
}

// Interface para datos de entrada (más flexible)
interface VehiculoInputData {
  dominio?: string;
  patenteFaltante?: string;
  empresa?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  activo?: boolean;
  capacidad?: number | string;
  documentacion?: Documentacion;
}

interface VehiculoInvalido {
  indice: number;
  dominio: string;
  errores: string[];
}

interface ValidationResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  vehiculos: VehiculoBulkData[];
}

interface BulkResult {
  insertados: number;
  tiempo?: number;
}

/**
 * Valida los datos de entrada para la carga masiva
 * @param {Array} vehiculos - Lista de vehículos a validar
 * @returns {Object} - Resultado de la validación { valido, errores, advertencias }
 */
const validarDatosMasivos = (vehiculos: VehiculoInputData[]): ValidationResult => {
  const errores: string[] = [];
  const advertencias: string[] = [];
  
  // Validar que se proporcionó un array
  if (!vehiculos) {
    errores.push('No se proporcionaron datos de vehículos');
    return { valido: false, errores, advertencias, vehiculos: [] };
  }
  
  if (!Array.isArray(vehiculos)) {
    errores.push('El formato de datos no es válido, se espera un array de vehículos');
    return { valido: false, errores, advertencias, vehiculos: [] };
  }
  
  if (vehiculos.length === 0) {
    errores.push('La lista de vehículos está vacía');
    return { valido: false, errores, advertencias, vehiculos: [] };
  }
  
  if (vehiculos.length > 500) {
    errores.push(`La carga masiva está limitada a 500 vehículos por lote (recibidos: ${vehiculos.length})`);
    return { valido: false, errores, advertencias, vehiculos: [] };
  }
  
  // Validar cada vehículo individualmente y convertir al formato correcto
  const vehiculosInvalidos: VehiculoInvalido[] = [];
  const dominios = new Set<string>();
  const vehiculosValidados: VehiculoBulkData[] = [];
  
  vehiculos.forEach((vehiculo, index) => {
    const erroresVehiculo: string[] = [];
    
    // Comprobar campos obligatorios - usar patenteFaltante o dominio
    const patente = vehiculo.patenteFaltante || vehiculo.dominio;
    if (!patente) {
      erroresVehiculo.push('Dominio o patente faltante requerido');
    } else if (typeof patente !== 'string' || patente.trim().length < 3) {
      erroresVehiculo.push('Dominio/patente inválido');
    } else {
      // Normalizar el dominio para verificar duplicados
      const dominioNormalizado = patente.toUpperCase().trim();
      
      if (dominios.has(dominioNormalizado)) {
        erroresVehiculo.push('Dominio duplicado en la carga');
      } else {
        dominios.add(dominioNormalizado);
      }
    }
    
    if (!vehiculo.empresa) {
      erroresVehiculo.push('Empresa requerida');
    }
    
    if (!vehiculo.tipo) {
      erroresVehiculo.push('Tipo de vehículo requerido');
    }
    
    // Validar fechas si se proporcionan
    if (vehiculo.documentacion) {
      const docs = ['seguro', 'vtv', 'ruta', 'senasa'] as const;
      docs.forEach(doc => {
        if (vehiculo.documentacion![doc] && vehiculo.documentacion![doc]!.vencimiento) {
          const fecha = new Date(vehiculo.documentacion![doc]!.vencimiento!);
          if (isNaN(fecha.getTime())) {
            erroresVehiculo.push(`Fecha de vencimiento de ${doc} inválida`);
          }
        }
      });
    }
    
    // Si no tiene errores, crear el objeto con el formato correcto
    if (erroresVehiculo.length === 0) {
      const patenteFaltante = (vehiculo.patenteFaltante || vehiculo.dominio)!.toUpperCase().trim();
      vehiculosValidados.push({
        patenteFaltante,
        tipo: vehiculo.tipo!,
        empresa: vehiculo.empresa!,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio
      });
    } else {
      // Si tiene errores, agregarlo a la lista
      vehiculosInvalidos.push({
        indice: index,
        dominio: vehiculo.patenteFaltante || vehiculo.dominio || '[Sin dominio]',
        errores: erroresVehiculo
      });
    }
  });
  
  // Si hay vehículos inválidos, agregar error general
  if (vehiculosInvalidos.length > 0) {
    errores.push(`${vehiculosInvalidos.length} vehículos contienen errores`);
    
    // Añadir detalles de los primeros 10 vehículos con errores
    vehiculosInvalidos.slice(0, 10).forEach(v => {
      errores.push(`Vehículo ${v.dominio} (índice ${v.indice}): ${v.errores.join(', ')}`);
    });
    
    if (vehiculosInvalidos.length > 10) {
      advertencias.push(`Se omitieron detalles de ${vehiculosInvalidos.length - 10} vehículos con errores adicionales`);
    }
  }
  
  // Advertencia si el lote es grande
  if (vehiculos.length > 100) {
    advertencias.push(`Carga masiva grande (${vehiculos.length} vehículos). Esto puede tardar varios segundos.`);
  }
  
  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    vehiculos: vehiculosValidados // Devolvemos los vehículos validados y convertidos
  };
};

/**
 * @desc    Crear múltiples vehículos mediante carga masiva
 * @route   POST /api/vehiculos/bulk
 * @access  Private
 */
const createVehiculosBulk = async (req: express.Request, res: express.Response): Promise<void> => {
  const inicioTiempo = Date.now();
  logger.info(`Petición recibida: POST /api/vehiculos/bulk`);
  
  try {
    // Obtener los datos de los vehículos del cuerpo de la petición
    const { vehiculos } = req.body;
    
    if (!vehiculos) {
      logger.warn('Intento de carga masiva sin datos de vehículos');
      res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionaron datos de vehículos',
        errores: ['Se requiere un array de vehículos en el campo "vehiculos"']
      });
      return;
    }
    
    logger.info(`Recibidos ${vehiculos.length} vehículos para carga masiva`);
    
    // Validar los datos de entrada
    const { valido, errores, advertencias, vehiculos: vehiculosValidados } = validarDatosMasivos(vehiculos);
    
    if (!valido) {
      logger.warn(`Validación fallida en carga masiva: ${errores.join(', ')}`);
      res.status(400).json({
        exito: false,
        mensaje: 'La validación de datos ha fallado',
        errores,
        advertencias
      });
      return;
    }
    
    // Si hay advertencias, las registramos
    if (advertencias.length > 0) {
      logger.info(`Advertencias en carga masiva: ${advertencias.join(', ')}`);
    }
    
    // Procesar la carga masiva
    const resultado: BulkResult = await createVehiculosBulkService(vehiculosValidados);
    
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Carga masiva completada: ${resultado.insertados} vehículos insertados (tiempo: ${tiempoTotal}ms)`);
    
    // Responder con éxito
    res.status(201).json({
      exito: true,
      mensaje: `Se cargaron ${resultado.insertados} vehículos correctamente`,
      datos: {
        total: resultado.insertados,
        tiempo: tiempoTotal,
        advertencias
      }
    });
  } catch (error) {
    const tiempoTotal = Date.now() - inicioTiempo;
    const errorMessage = (error as Error).message;
    
    // Clasificar el tipo de error para dar respuestas específicas
    if (errorMessage.includes('dominios duplicados') || 
        errorMessage.includes('ya existen en la base de datos')) {
      logger.warn(`Error en carga masiva - Dominios duplicados: ${errorMessage} (tiempo: ${tiempoTotal}ms)`);
      res.status(400).json({
        exito: false,
        mensaje: 'Hay dominios duplicados en la base de datos',
        error: errorMessage
      });
      return;
    }
    
    if (errorMessage.includes('empresas especificadas no existen')) {
      logger.warn(`Error en carga masiva - Empresas no válidas: ${errorMessage} (tiempo: ${tiempoTotal}ms)`);
      res.status(400).json({
        exito: false,
        mensaje: 'Una o más empresas no existen en el sistema',
        error: errorMessage
      });
      return;
    }
    
    // Error general
    logger.error(`Error en carga masiva de vehículos: ${errorMessage} (tiempo: ${tiempoTotal}ms)`, error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar la carga masiva de vehículos',
      error: errorMessage
    });
  }
};

export default createVehiculosBulk;