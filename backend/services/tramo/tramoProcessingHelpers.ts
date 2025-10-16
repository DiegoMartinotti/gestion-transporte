/**
 * @module services/tramo/TramoProcessingHelpers
 * @description Helpers para procesamiento de datos de tramos
 */

import { AnyBulkWriteOperation, Types } from 'mongoose';
import Site from '../../models/Site';
import { fechasSuperpuestas } from '../../utils/tramoValidator';
import { calcularDistanciaRuta } from '../routingService';
import logger from '../../utils/logger';

/**
 * Interfaz para sitio con estructura esperada
 */
interface SiteData {
  _id: unknown;
  nombre?: string;
  Site?: string;
  codigo?: string;
  location?: {
    coordinates?: [number, number];
  };
}

/**
 * Interfaz para mapas de sitios
 */
export interface SiteMap {
  sitesMap: Map<string, SiteData>;
  sitesMapByCode: Map<string, SiteData>;
}

/**
 * Interfaz para tarifa histórica
 */
export interface TarifaHistorica {
  tipo: string;
  metodoCalculo: string;
  valor: number;
  valorPeaje: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date;
}

/**
 * Interfaz para datos de tramo a procesar
 */
export interface TramoData {
  _id?: string;
  origen: string;
  destino: string;
  origenNombre?: string;
  destinoNombre?: string;
  tarifaHistorica: TarifaHistorica;
  distanciaPreCalculada?: number;
}

/**
 * Interfaz para opciones de procesamiento
 */
export interface ProcessOptions {
  clienteId: string;
  reutilizarDistancias: boolean;
  actualizarExistentes?: boolean;
  sitesMap: Map<string, SiteData>;
  sitesMapByCode: Map<string, SiteData>;
  mapaTramos: Map<string, unknown>;
}

/**
 * Interfaz para resultado de procesamiento
 */
type TramoBulkDocument = {
  _id?: Types.ObjectId;
  origen?: Types.ObjectId;
  destino?: Types.ObjectId;
  cliente?: Types.ObjectId;
  distancia?: number;
  tarifasHistoricas?: TarifaHistorica[];
};

type TramoBulkOperation = AnyBulkWriteOperation<TramoBulkDocument>;

export interface ProcessResult {
  status: 'insert' | 'update' | 'error';
  operation?: TramoBulkOperation;
  error?: string;
  tramoInfo?: {
    origenNombre: string;
    destinoNombre: string;
  };
}

/**
 * Construye mapas de sitios para búsqueda rápida
 */
export async function buildSiteMaps(): Promise<SiteMap> {
  // Obtener todos los sitios (esto se hace una sola vez)
  const allSites = await Site.find({}).select('_id Site codigo location').lean();

  // Crear mapas para búsqueda rápida
  const sitesMap = new Map<string, SiteData>();
  const sitesMapByCode = new Map<string, SiteData>();

  allSites.forEach((site) => {
    const siteRecord = site as Record<string, unknown>;
    const siteData: SiteData = {
      _id: site._id,
      nombre: typeof siteRecord.nombre === 'string' ? siteRecord.nombre : undefined,
      Site: typeof siteRecord.Site === 'string' ? siteRecord.Site : undefined,
      codigo: typeof siteRecord.codigo === 'string' ? siteRecord.codigo : undefined,
      location: siteRecord.location as SiteData['location'],
    };

    sitesMap.set(String(site._id), siteData);

    if (siteData.codigo) {
      sitesMapByCode.set(siteData.codigo.toLowerCase(), siteData);
    }
  });

  logger.debug(
    `Mapas de sitios construidos con ${sitesMap.size} sitios y ${sitesMapByCode.size} códigos`
  );

  return { sitesMap, sitesMapByCode };
}

/**
 * Valida datos básicos de un tramo
 */
export function validateBasicTramoData(tramoData: TramoData): string | null {
  if (!tramoData.origen) {
    return 'ID de origen no especificado o inválido';
  }

  if (!tramoData.destino) {
    return 'ID de destino no especificado o inválido';
  }

  return null;
}

/**
 * Procesa y valida fechas de vigencia
 */
export function processFechasVigencia(
  tramoData: TramoData
): { fechaDesde: Date; fechaHasta: Date } | string {
  const fechaDesde = new Date(tramoData.tarifaHistorica.vigenciaDesde);
  const fechaHasta = new Date(tramoData.tarifaHistorica.vigenciaHasta);

  if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
    return 'Fechas de vigencia inválidas';
  }

  return { fechaDesde, fechaHasta };
}

/**
 * Crea nueva tarifa histórica a partir de datos
 */
export function createNuevaTarifa(
  tramoData: TramoData,
  fechaDesde: Date,
  fechaHasta: Date
): TarifaHistorica {
  return {
    tipo: tramoData.tarifaHistorica.tipo,
    metodoCalculo: tramoData.tarifaHistorica.metodoCalculo || 'Kilometro',
    valor: parseFloat(String(tramoData.tarifaHistorica.valor)) || 0,
    valorPeaje: parseFloat(String(tramoData.tarifaHistorica.valorPeaje)) || 0,
    vigenciaDesde: fechaDesde,
    vigenciaHasta: fechaHasta,
  };
}

/**
 * Verifica conflictos de tarifas en tramo existente
 */
export function checkTarifaConflicts(
  tramoExistente: { tarifasHistoricas: TarifaHistorica[] },
  nuevaTarifa: TarifaHistorica
): { hasConflict: boolean; error: string | null } {
  for (const tarifaExistente of tramoExistente.tarifasHistoricas) {
    const duplicateCheck = checkExactDuplicate(tarifaExistente, nuevaTarifa);
    if (duplicateCheck.hasConflict) {
      return duplicateCheck;
    }

    const dateCheck = checkDateConflict(tarifaExistente, nuevaTarifa);
    if (dateCheck.hasConflict) {
      return dateCheck;
    }
  }

  return { hasConflict: false, error: null };
}

/**
 * Verifica duplicado exacto
 */
function checkExactDuplicate(
  tarifaExistente: TarifaHistorica,
  nuevaTarifa: TarifaHistorica
): { hasConflict: boolean; error: string | null } {
  if (
    tarifaExistente.tipo === nuevaTarifa.tipo &&
    tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo &&
    tarifaExistente.valor === nuevaTarifa.valor &&
    tarifaExistente.valorPeaje === nuevaTarifa.valorPeaje &&
    tarifaExistente.vigenciaDesde.getTime() === nuevaTarifa.vigenciaDesde.getTime() &&
    tarifaExistente.vigenciaHasta.getTime() === nuevaTarifa.vigenciaHasta.getTime()
  ) {
    return { hasConflict: true, error: 'Tarifa duplicada exacta ya existe.' };
  }
  return { hasConflict: false, error: null };
}

/**
 * Verifica conflicto de fechas
 */
function checkDateConflict(
  tarifaExistente: TarifaHistorica,
  nuevaTarifa: TarifaHistorica
): { hasConflict: boolean; error: string | null } {
  if (
    tarifaExistente.tipo === nuevaTarifa.tipo &&
    tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo
  ) {
    if (
      fechasSuperpuestas(
        nuevaTarifa.vigenciaDesde,
        nuevaTarifa.vigenciaHasta,
        tarifaExistente.vigenciaDesde,
        tarifaExistente.vigenciaHasta
      )
    ) {
      return { hasConflict: true, error: 'Conflicto de fechas con tarifa existente.' };
    }
  }
  return { hasConflict: false, error: null };
}

/**
 * Calcula distancia para nuevo tramo si es necesario
 */
export async function calculateDistanceIfNeeded(
  nuevoTramo: { distancia: number },
  origenSite: SiteData | undefined,
  destinoSite: SiteData | undefined,
  indiceTramo: number
): Promise<number> {
  if (
    (!nuevoTramo.distancia || nuevoTramo.distancia === 0) &&
    origenSite?.location?.coordinates?.length === 2 &&
    destinoSite?.location?.coordinates?.length === 2
  ) {
    try {
      const origenCoordinates = origenSite.location.coordinates as [number, number];
      const destinoCoordinates = destinoSite.location.coordinates as [number, number];
      const distanciaKm = await calcularDistanciaRuta(origenCoordinates, destinoCoordinates);
      logger.debug(`Distancia calculada para tramo #${indiceTramo}: ${distanciaKm} km`);
      return distanciaKm;
    } catch (routeError) {
      logger.error(`Error calculando distancia para tramo #${indiceTramo}:`, routeError);
    }
  }
  return nuevoTramo.distancia;
}

/**
 * Configuración para operación de inserción
 */
export interface InsertOperationConfig {
  tramoData: TramoData;
  clienteId: string;
  distancia: number;
  nuevaTarifa: TarifaHistorica;
  origenIdStr: string;
  destinoIdStr: string;
}

/**
 * Crea operación de inserción para nuevo tramo
 */
export function createInsertOperation(config: InsertOperationConfig): ProcessResult {
  const { tramoData, clienteId, distancia, nuevaTarifa, origenIdStr, destinoIdStr } = config;

  const nuevoTramo = {
    _id: new Types.ObjectId(),
    origen: new Types.ObjectId(tramoData.origen),
    destino: new Types.ObjectId(tramoData.destino),
    cliente: new Types.ObjectId(clienteId),
    distancia,
    tarifasHistoricas: [nuevaTarifa],
  };

  return {
    status: 'insert',
    operation: {
      insertOne: {
        document: nuevoTramo,
      },
    },
    tramoInfo: {
      origenNombre: tramoData.origenNombre || origenIdStr,
      destinoNombre: tramoData.destinoNombre || destinoIdStr,
    },
  };
}

/**
 * Configuración para operación de actualización
 */
export interface UpdateOperationConfig {
  tramoExistente: { _id: unknown };
  nuevaTarifa: TarifaHistorica;
  tramoData: TramoData;
  origenIdStr: string;
  destinoIdStr: string;
}

/**
 * Crea operación de actualización para tramo existente
 */
export function createUpdateOperation(config: UpdateOperationConfig): ProcessResult {
  const { tramoExistente, nuevaTarifa, tramoData, origenIdStr, destinoIdStr } = config;

  return {
    status: 'update',
    operation: {
      updateOne: {
        filter: { _id: tramoExistente._id },
        update: { $push: { tarifasHistoricas: nuevaTarifa } },
      },
    },
    tramoInfo: {
      origenNombre: tramoData.origenNombre || origenIdStr,
      destinoNombre: tramoData.destinoNombre || destinoIdStr,
    },
  };
}
