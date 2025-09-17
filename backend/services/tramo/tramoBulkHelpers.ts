/**
 * @module services/tramo/TramoBulkHelpers
 * @description Helpers para operaciones masivas de tramos
 */

import mongoose from 'mongoose';
import Site from '../../models/Site';
import { fechasSuperpuestas } from '../../utils/tramoValidator';
import { TarifaHistorica } from './tramoProcessingHelpers';

/**
 * Interfaz para datos de tramos bulk
 */
export interface TramosBulkData {
  origenNombre: string;
  destinoNombre: string;
  tipoTarifa: string;
  metodoCalculo: string;
  valorTarifa: number;
  valorPeaje?: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

/**
 * Interfaz para resultado de operaciones bulk
 */
export interface CreateTramosBulkResult {
  success: boolean;
  insertados: number;
  actualizados: number;
  errores: Array<{
    index?: number | string;
    message: string;
    code?: number;
    data?: unknown;
  }>;
}

/**
 * Interfaz para sitio procesado
 */
interface ProcessedSite {
  _id: unknown;
  Cliente?: unknown;
  nombre?: string;
}

/**
 * Validar campos básicos requeridos para tramo bulk
 */
export function validateTramosBulkData(tramosData: TramosBulkData[]): {
  isValid: boolean;
  error?: string;
} {
  if (!Array.isArray(tramosData) || tramosData.length === 0) {
    return { isValid: false, error: 'No tramo data provided for bulk operation.' };
  }
  return { isValid: true };
}

/**
 * Extraer nombres únicos de sitios necesarios
 */
export function extractSiteNames(tramosData: TramosBulkData[]): string[] {
  return [
    ...new Set([
      ...tramosData.map((t) => t.origenNombre),
      ...tramosData.map((t) => t.destinoNombre),
    ]),
  ].filter((nombre) => nombre);
}

/**
 * Buscar sitios por nombre
 */
export async function findSitesByNames(
  sitiosNecesarios: string[],
  session?: mongoose.ClientSession
): Promise<ProcessedSite[]> {
  const sitios = await Site.find({
    $or: [{ Site: { $in: sitiosNecesarios } }, { nombre: { $in: sitiosNecesarios } }],
  })
    .session(session || null)
    .lean();

  return sitios as ProcessedSite[];
}

/**
 * Crear mapa de sitios por nombre
 */
export function createSiteMap(sitios: ProcessedSite[]): Map<string, ProcessedSite> {
  const sitiosPorNombre = new Map<string, ProcessedSite>();
  sitios.forEach((sitio) => {
    if (sitio.nombre) {
      sitiosPorNombre.set(sitio.nombre.toLowerCase(), sitio);
    }
  });
  return sitiosPorNombre;
}

/**
 * Validar campos requeridos de un tramo individual
 */
export function validateSingleTramoData(tramoData: TramosBulkData): string | null {
  if (
    !tramoData.origenNombre ||
    !tramoData.destinoNombre ||
    !tramoData.tipoTarifa ||
    !tramoData.metodoCalculo ||
    isNaN(tramoData.valorTarifa) ||
    !tramoData.vigenciaDesde ||
    !tramoData.vigenciaHasta
  ) {
    return 'Faltan campos requeridos en el tramo';
  }
  return null;
}

/**
 * Buscar sitios origen y destino en el mapa
 */
export function findOriginAndDestination(
  tramoData: TramosBulkData,
  sitiosPorNombre: Map<string, ProcessedSite>
): { origen?: ProcessedSite; destino?: ProcessedSite; errors: string[] } {
  const errors: string[] = [];
  const origen = sitiosPorNombre.get(tramoData.origenNombre.toLowerCase());
  const destino = sitiosPorNombre.get(tramoData.destinoNombre.toLowerCase());

  if (!origen) {
    errors.push(`Sitio origen "${tramoData.origenNombre}" no encontrado`);
  }

  if (!destino) {
    errors.push(`Sitio destino "${tramoData.destinoNombre}" no encontrado`);
  }

  return { origen, destino, errors };
}

/**
 * Determinar cliente para el tramo
 */
export function determineClienteId(
  origen?: ProcessedSite,
  destino?: ProcessedSite
): unknown | null {
  return origen?.Cliente || destino?.Cliente || null;
}

/**
 * Procesar fechas de vigencia
 */
export function processVigenciaDates(tramoData: TramosBulkData): {
  fechas?: { fechaDesde: Date; fechaHasta: Date };
  error?: string;
} {
  try {
    const fechaDesde = new Date(tramoData.vigenciaDesde);
    const fechaHasta = new Date(tramoData.vigenciaHasta);

    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime()) || fechaDesde > fechaHasta) {
      return { error: 'Fechas de vigencia inválidas o rango incorrecto' };
    }

    return { fechas: { fechaDesde, fechaHasta } };
  } catch (error) {
    return { error: `Error en fechas: ${(error as Error).message}` };
  }
}

/**
 * Validar valores numéricos
 */
export function validateNumericValues(tramoData: TramosBulkData): {
  values?: { valorTarifa: number; valorPeaje: number };
  error?: string;
} {
  const valorTarifa = parseFloat(String(tramoData.valorTarifa));
  const valorPeaje = parseFloat(String(tramoData.valorPeaje || 0));

  if (isNaN(valorTarifa) || valorTarifa <= 0) {
    return { error: 'Valor de tarifa inválido o menor/igual a cero' };
  }

  return { values: { valorTarifa, valorPeaje } };
}

/**
 * Crear nueva tarifa histórica
 */
export function createTarifaHistorica(config: {
  tramoData: TramosBulkData;
  fechaDesde: Date;
  fechaHasta: Date;
  valorTarifa: number;
  valorPeaje: number;
}): TarifaHistorica {
  const { tramoData, fechaDesde, fechaHasta, valorTarifa, valorPeaje } = config;

  return {
    tipo: tramoData.tipoTarifa.toUpperCase(),
    metodoCalculo: tramoData.metodoCalculo,
    valor: valorTarifa,
    valorPeaje: valorPeaje,
    vigenciaDesde: fechaDesde,
    vigenciaHasta: fechaHasta,
  };
}

/**
 * Verificar conflictos de fechas en tramo existente
 */
export function checkConflictosTramoExistente(
  tramoExistente: { tarifasHistoricas?: TarifaHistorica[] },
  nuevaTarifa: TarifaHistorica
): boolean {
  if (!tramoExistente.tarifasHistoricas?.length) {
    return false;
  }

  for (const tarifaExistente of tramoExistente.tarifasHistoricas) {
    // Solo verificar conflictos para tarifas del mismo tipo y método
    if (
      tarifaExistente.tipo === nuevaTarifa.tipo &&
      tarifaExistente.metodoCalculo === nuevaTarifa.metodoCalculo
    ) {
      // Verificar superposición de fechas
      if (
        fechasSuperpuestas(
          nuevaTarifa.vigenciaDesde,
          nuevaTarifa.vigenciaHasta,
          tarifaExistente.vigenciaDesde,
          tarifaExistente.vigenciaHasta
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Crear operación de inserción
 */
export function createInsertOperation(
  origen: ProcessedSite,
  destino: ProcessedSite,
  clienteId: unknown,
  nuevaTarifa: TarifaHistorica
): unknown {
  return {
    insertOne: {
      document: {
        origen: origen._id,
        destino: destino._id,
        cliente: clienteId,
        distancia: 0, // Se podría calcular a futuro
        tarifasHistoricas: [nuevaTarifa],
      },
    },
  };
}

/**
 * Crear operación de actualización
 */
export function createUpdateOperation(
  tramoExistente: { _id: unknown },
  nuevaTarifa: TarifaHistorica
): unknown {
  return {
    updateOne: {
      filter: { _id: tramoExistente._id },
      update: { $push: { tarifasHistoricas: nuevaTarifa } },
    },
  };
}
