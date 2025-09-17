import express from 'express';
import { getAllVehiculos, getVehiculosConVencimientos, getVehiculosVencidos } from '../../services/vehiculo/vehiculoService';
import logger from '../../utils/logger';

interface VehiculoQuery {
  limite?: string;
  pagina?: string;
  dominio?: string;
  tipo?: string;
  activo?: string;
  modelo?: string;
  anio?: string;
  vencimientoProximo?: string;
  diasVencimiento?: string;
  vencidos?: string;
}

interface OpcionesProcesadas {
  limite: number;
  pagina: number;
  filtros: Record<string, unknown>;
  vencimientoProximo?: boolean;
  diasVencimiento?: number;
  vencidos?: boolean;
}

/**
 * Analiza y valida los parámetros de filtrado y paginación
 * @param {Object} query - Parámetros de la query string
 * @returns {Object} Parámetros procesados
 */
const procesarParametros = (query: VehiculoQuery): OpcionesProcesadas => {
  const opciones: OpcionesProcesadas = {
    limite: parseInt(query.limite || '50') || 50,
    pagina: parseInt(query.pagina || '1') || 1,
    filtros: {}
  };
  
  // Limitar valores extremos
  opciones.limite = Math.min(Math.max(opciones.limite, 1), 100);
  opciones.pagina = Math.max(opciones.pagina, 1);
  
  // Procesar filtros específicos
  const filtrosPermitidos = ['dominio', 'tipo', 'activo', 'modelo', 'anio'];
  
  filtrosPermitidos.forEach(filtro => {
    if (query[filtro as keyof VehiculoQuery] !== undefined) {
      // Manejar valores específicos según el tipo
      if (filtro === 'activo') {
        opciones.filtros[filtro] = query[filtro as keyof VehiculoQuery]?.toLowerCase() === 'true';
      } else if (filtro === 'anio') {
        opciones.filtros[filtro] = parseInt(query[filtro as keyof VehiculoQuery] || '0');
      } else {
        opciones.filtros[filtro] = query[filtro as keyof VehiculoQuery];
      }
    }
  });
  
  // Filtro por documentos próximos a vencer
  if (query.vencimientoProximo === 'true') {
    opciones.vencimientoProximo = true;
    opciones.diasVencimiento = parseInt(query.diasVencimiento || '30') || 30;
  }
  
  // Filtro por documentos vencidos
  if (query.vencidos === 'true') {
    opciones.vencidos = true;
  }
  
  return opciones;
};

/**
 * @desc    Obtener todos los vehículos con filtros
 * @route   GET /api/vehiculos
 * @access  Private
 */
const getVehiculos = async (req: express.Request, res: express.Response): Promise<void> => {
  const inicioTiempo = Date.now();
  logger.info(`Petición recibida: GET /api/vehiculos ${JSON.stringify(req.query)}`);
  
  try {
    const opciones = procesarParametros(req.query as VehiculoQuery);
    logger.info(`Parámetros procesados: ${JSON.stringify(opciones)}`);
    
    let resultado: unknown;
    
    // Determinar el tipo de consulta según los parámetros
    if (opciones.vencimientoProximo) {
      // Consulta de vehículos con vencimientos próximos
      resultado = await getVehiculosConVencimientos(opciones.diasVencimiento!);
      logger.info(`Obtenidos ${resultado.length} vehículos con vencimientos próximos`);
    } else if (opciones.vencidos) {
      // Consulta de vehículos con documentos vencidos
      resultado = await getVehiculosVencidos();
      logger.info(`Obtenidos ${resultado.length} vehículos con documentos vencidos`);
    } else {
      // Consulta estándar con filtros
      resultado = await getAllVehiculos(opciones);
      
      const { vehiculos, paginacion } = resultado;
      logger.info(`Obtenidos ${vehiculos.length} vehículos (total: ${paginacion.total})`);
      
      // Para mantener compatibilidad con el cliente, si no se solicitó paginación
      // devolvemos solo el array de vehículos
      if (!req.query.pagina && !req.query.limite) {
        resultado = vehiculos;
      }
    }
    
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Tiempo de respuesta: ${tiempoTotal}ms`);
    
    res.status(200).json(resultado);
  } catch (error) {
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.error(`Error al obtener vehículos: ${(error as Error).message} (tiempo: ${tiempoTotal}ms)`, error);
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener vehículos',
      error: (error as Error).message
    });
  }
};

export default getVehiculos;