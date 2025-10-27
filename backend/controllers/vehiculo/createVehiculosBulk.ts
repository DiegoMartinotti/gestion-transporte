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
 * Valida datos básicos del array de entrada
 */
const validarFormatoArray = (
  vehiculos: VehiculoInputData[]
): { valido: boolean; errores: string[] } => {
  if (!vehiculos) {
    return { valido: false, errores: ['No se proporcionaron datos de vehículos'] };
  }

  if (!Array.isArray(vehiculos)) {
    return {
      valido: false,
      errores: ['El formato de datos no es válido, se espera un array de vehículos'],
    };
  }

  if (vehiculos.length === 0) {
    return { valido: false, errores: ['La lista de vehículos está vacía'] };
  }

  if (vehiculos.length > 500) {
    return {
      valido: false,
      errores: [
        `La carga masiva está limitada a 500 vehículos por lote (recibidos: ${vehiculos.length})`,
      ],
    };
  }

  return { valido: true, errores: [] };
};

/**
 * Valida un vehículo individual
 */
const validarVehiculoIndividual = (
  vehiculo: VehiculoInputData,
  dominios: Set<string>
): string[] => {
  const errores: string[] = [];

  const patente = vehiculo.patenteFaltante || vehiculo.dominio;
  if (!patente) {
    errores.push('Dominio o patente faltante requerido');
  } else if (typeof patente !== 'string' || patente.trim().length < 3) {
    errores.push('Dominio/patente inválido');
  } else {
    const dominioNormalizado = patente.toUpperCase().trim();
    if (dominios.has(dominioNormalizado)) {
      errores.push('Dominio duplicado en la carga');
    } else {
      dominios.add(dominioNormalizado);
    }
  }

  if (!vehiculo.empresa) errores.push('Empresa requerida');
  if (!vehiculo.tipo) errores.push('Tipo de vehículo requerido');

  return errores;
};

/**
 * Convierte vehículo validado al formato bulk
 */
const convertirAFormatoBulk = (vehiculo: VehiculoInputData): VehiculoBulkData => {
  const patenteFaltante = (vehiculo.patenteFaltante || vehiculo.dominio)!.toUpperCase().trim();
  return {
    patenteFaltante,
    tipo: vehiculo.tipo!,
    empresa: vehiculo.empresa!,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    anio: vehiculo.anio,
  };
};

/**
 * Valida los datos de entrada para la carga masiva
 */
const validarDatosMasivos = (vehiculos: VehiculoInputData[]): ValidationResult => {
  const errores: string[] = [];
  const advertencias: string[] = [];

  const validacionFormato = validarFormatoArray(vehiculos);
  if (!validacionFormato.valido) {
    return { valido: false, errores: validacionFormato.errores, advertencias, vehiculos: [] };
  }

  const vehiculosInvalidos: VehiculoInvalido[] = [];
  const dominios = new Set<string>();
  const vehiculosValidados: VehiculoBulkData[] = [];

  vehiculos.forEach((vehiculo, index) => {
    const erroresVehiculo = validarVehiculoIndividual(vehiculo, dominios);

    if (erroresVehiculo.length === 0) {
      vehiculosValidados.push(convertirAFormatoBulk(vehiculo));
    } else {
      vehiculosInvalidos.push({
        indice: index,
        dominio: vehiculo.patenteFaltante || vehiculo.dominio || '[Sin dominio]',
        errores: erroresVehiculo,
      });
    }
  });

  if (vehiculosInvalidos.length > 0) {
    errores.push(`${vehiculosInvalidos.length} vehículos contienen errores`);
    vehiculosInvalidos.slice(0, 10).forEach((v) => {
      errores.push(`Vehículo ${v.dominio} (índice ${v.indice}): ${v.errores.join(', ')}`);
    });

    if (vehiculosInvalidos.length > 10) {
      advertencias.push(
        `Se omitieron detalles de ${vehiculosInvalidos.length - 10} vehículos con errores adicionales`
      );
    }
  }

  if (vehiculos.length > 100) {
    advertencias.push(
      `Carga masiva grande (${vehiculos.length} vehículos). Esto puede tardar varios segundos.`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    vehiculos: vehiculosValidados,
  };
};

/**
 * Maneja errores específicos de carga masiva
 */
const manejarErrorBulk = (error: Error, res: express.Response, tiempoTotal: number): void => {
  const errorMessage = error.message;

  if (
    errorMessage.includes('dominios duplicados') ||
    errorMessage.includes('ya existen en la base de datos')
  ) {
    logger.warn(
      `Error en carga masiva - Dominios duplicados: ${errorMessage} (tiempo: ${tiempoTotal}ms)`
    );
    res.status(400).json({
      exito: false,
      mensaje: 'Hay dominios duplicados en la base de datos',
      error: errorMessage,
    });
    return;
  }

  if (errorMessage.includes('empresas especificadas no existen')) {
    logger.warn(
      `Error en carga masiva - Empresas no válidas: ${errorMessage} (tiempo: ${tiempoTotal}ms)`
    );
    res.status(400).json({
      exito: false,
      mensaje: 'Una o más empresas no existen en el sistema',
      error: errorMessage,
    });
    return;
  }

  logger.error(
    `Error en carga masiva de vehículos: ${errorMessage} (tiempo: ${tiempoTotal}ms)`,
    error
  );
  res.status(500).json({
    exito: false,
    mensaje: 'Error al procesar la carga masiva de vehículos',
    error: errorMessage,
  });
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
    const { vehiculos } = req.body;

    if (!vehiculos) {
      logger.warn('Intento de carga masiva sin datos de vehículos');
      res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionaron datos de vehículos',
        errores: ['Se requiere un array de vehículos en el campo "vehiculos"'],
      });
      return;
    }

    logger.info(`Recibidos ${vehiculos.length} vehículos para carga masiva`);

    const {
      valido,
      errores,
      advertencias,
      vehiculos: vehiculosValidados,
    } = validarDatosMasivos(vehiculos);

    if (!valido) {
      logger.warn(`Validación fallida en carga masiva: ${errores.join(', ')}`);
      res.status(400).json({
        exito: false,
        mensaje: 'La validación de datos ha fallado',
        errores,
        advertencias,
      });
      return;
    }

    if (advertencias.length > 0) {
      logger.info(`Advertencias en carga masiva: ${advertencias.join(', ')}`);
    }

    const resultado: BulkResult = await createVehiculosBulkService(vehiculosValidados);

    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(
      `Carga masiva completada: ${resultado.insertados} vehículos insertados (tiempo: ${tiempoTotal}ms)`
    );

    res.status(201).json({
      exito: true,
      mensaje: `Se cargaron ${resultado.insertados} vehículos correctamente`,
      datos: {
        total: resultado.insertados,
        tiempo: tiempoTotal,
        advertencias,
      },
    });
  } catch (error) {
    manejarErrorBulk(error as Error, res, Date.now() - inicioTiempo);
  }
};

export default createVehiculosBulk;
