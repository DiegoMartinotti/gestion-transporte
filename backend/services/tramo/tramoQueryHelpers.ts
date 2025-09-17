/**
 * @module services/tramo/TramoQueryHelpers
 * @description Helpers para consultas y filtrado de tramos
 */

import logger from '../../utils/logger';

/**
 * Interfaz para resultados de metadata de tramos
 */
interface TramoMetadata {
  totalTramos: number;
  tramosUnicos?: number;
  tramosHistoricos?: number;
  combinacionesUnicas?: number;
}

/**
 * Interfaz para resultado de tramos con metadata
 */
export interface TramoResult {
  tramos: unknown[];
  metadata: TramoMetadata;
}

/**
 * Type guard para verificar si un objeto tiene las propiedades básicas de tramo
 */
function isValidTramo(tramo: unknown): tramo is {
  _id?: unknown;
  origen?: { Site?: string };
  destino?: { Site?: string };
  tipo?: string;
  tarifasHistoricas?: unknown[];
  vigenciaDesde?: Date;
  vigenciaHasta?: Date;
} {
  return typeof tramo === 'object' && tramo !== null;
}

/**
 * Type guard para verificar si un objeto tiene estructura de tarifa
 */
function isValidTarifa(tarifa: unknown): tarifa is {
  tipo: string;
  metodoCalculo: string;
  valor: number;
  valorPeaje: number;
  vigenciaDesde: Date;
  vigenciaHasta: Date;
} {
  return (
    typeof tarifa === 'object' && tarifa !== null && 'tipo' in tarifa && 'metodoCalculo' in tarifa
  );
}

/**
 * Crea clave única para identificar tramo por origen-destino-tipo
 */
export function createTramoKey(origen: unknown, destino: unknown, tipo: string): string {
  const origenName =
    origen && typeof origen === 'object' && 'Site' in origen ? String(origen.Site) : 'unknown';
  const destinoName =
    destino && typeof destino === 'object' && 'Site' in destino ? String(destino.Site) : 'unknown';

  return `${origenName}-${destinoName}-${tipo || 'TRMC'}`;
}

/**
 * Verifica si una fecha está en el rango especificado
 */
export function isDateInRange(
  fechaDesde: Date,
  fechaHasta: Date,
  rangeDesde: Date,
  rangeHasta: Date
): boolean {
  return fechaDesde <= rangeHasta && fechaHasta >= rangeDesde;
}

/**
 * Procesa tramos con tarifas históricas para obtener versión actual
 */
export function processTramoWithTarifas(
  tramo: unknown,
  mapaTramos: Map<string, unknown>
): Map<string, unknown> {
  if (!isValidTramo(tramo) || !tramo.tarifasHistoricas?.length) {
    return mapaTramos;
  }

  tramo.tarifasHistoricas.forEach((tarifa: unknown) => {
    if (!isValidTarifa(tarifa)) return;

    const tramoConTarifa = {
      ...tramo,
      tipo: tarifa.tipo || 'TRMC',
      metodoCalculo: tarifa.metodoCalculo,
      valor: tarifa.valor,
      valorPeaje: tarifa.valorPeaje,
      vigenciaDesde: tarifa.vigenciaDesde,
      vigenciaHasta: tarifa.vigenciaHasta,
      tarifasHistoricas: tramo.tarifasHistoricas,
    };

    const clave = createTramoKey(tramo.origen, tramo.destino, tarifa.tipo);
    const vigenciaHasta = new Date(tarifa.vigenciaHasta);

    // Actualizar si no existe o si es más reciente
    const existingTramo = mapaTramos.get(clave) as { vigenciaHasta: Date } | undefined;
    if (
      !mapaTramos.has(clave) ||
      (existingTramo && vigenciaHasta > new Date(existingTramo.vigenciaHasta))
    ) {
      mapaTramos.set(clave, tramoConTarifa);
      logger.debug(
        `Actualizado tramo para ${clave} con vigencia hasta ${vigenciaHasta.toISOString()}`
      );
    }
  });

  return mapaTramos;
}

/**
 * Procesa tramo con formato antiguo
 */
export function processTramoLegacyFormat(
  tramo: unknown,
  mapaTramos: Map<string, unknown>
): Map<string, unknown> {
  if (!isValidTramo(tramo) || !tramo.tipo) {
    return mapaTramos;
  }

  const clave = createTramoKey(tramo.origen, tramo.destino, tramo.tipo);

  if (tramo.vigenciaHasta) {
    const vigenciaHasta = new Date(tramo.vigenciaHasta);

    const existingTramo = mapaTramos.get(clave) as { vigenciaHasta: Date } | undefined;
    if (
      !mapaTramos.has(clave) ||
      (existingTramo && vigenciaHasta > new Date(existingTramo.vigenciaHasta))
    ) {
      mapaTramos.set(clave, tramo);
      logger.debug(
        `Actualizado tramo para ${clave} con vigencia hasta ${vigenciaHasta.toISOString()}`
      );
    }
  }

  return mapaTramos;
}

/**
 * Obtiene tramos actuales (más recientes) para cada combinación origen-destino-tipo
 */
export function getTramosActuales(tramos: unknown[]): TramoResult {
  const tramosUnicos = buildTramosUnicosMap(tramos);

  const tramosArray = Array.from(tramosUnicos.values());
  const resultado = sortTramos(tramosArray);

  logger.debug(`Procesados ${resultado.length} tramos únicos de ${tramos.length} totales`);

  return {
    tramos: resultado,
    metadata: {
      totalTramos: tramos.length,
      tramosUnicos: resultado.length,
      combinacionesUnicas: tramosUnicos.size,
    },
  };
}

/**
 * Construye mapa de tramos únicos
 */
function buildTramosUnicosMap(tramos: unknown[]): Map<string, unknown> {
  return tramos.reduce((mapaTramos: Map<string, unknown>, tramo: unknown) => {
    if (!isValidTramo(tramo) || !tramo.origen || !tramo.destino) {
      if (isValidTramo(tramo)) {
        logger.warn('Omitiendo tramo sin origen/destino en procesamiento actual:', tramo._id);
      }
      return mapaTramos;
    }

    // Caso 1: Tramo con tarifas históricas (modelo nuevo)
    if (tramo.tarifasHistoricas?.length) {
      return processTramoWithTarifas(tramo, mapaTramos);
    }

    // Caso 2: Tramo con formato antiguo
    return processTramoLegacyFormat(tramo, mapaTramos);
  }, new Map());
}

/**
 * Filtra tramos por fechas históricas
 */
export function getTramosHistoricos(tramos: unknown[], desde: string, hasta: string): TramoResult {
  logger.debug('Procesando tramos históricos con filtro de fecha');

  const desdeDate = new Date(desde);
  const hastaDate = new Date(hasta);

  logger.debug(
    `Filtrando tramos por rango de fechas: ${desdeDate.toISOString().split('T')[0]} - ${hastaDate.toISOString().split('T')[0]}`
  );

  const tramosUnicos = tramos.reduce((mapaTramos: Map<string, unknown>, tramo: unknown) => {
    if (!isValidTramo(tramo) || !tramo.origen || !tramo.destino) {
      if (isValidTramo(tramo)) {
        logger.warn('Omitiendo tramo sin origen/destino en procesamiento histórico:', tramo._id);
      }
      return mapaTramos;
    }

    // Caso 1: Tramo con tarifas históricas
    if (tramo.tarifasHistoricas?.length) {
      return processHistoricalTarifas(tramo, mapaTramos, desdeDate, hastaDate);
    }

    // Caso 2: Tramo con formato antiguo
    if (tramo.vigenciaDesde && tramo.vigenciaHasta) {
      if (isDateInRange(tramo.vigenciaDesde, tramo.vigenciaHasta, desdeDate, hastaDate)) {
        const clave = createTramoKey(tramo.origen, tramo.destino, tramo.tipo || 'TRMC');
        updateMapWithMoreRecent(mapaTramos, clave, tramo, new Date(tramo.vigenciaHasta));
      }
    }

    return mapaTramos;
  }, new Map());

  const tramosHistoricos = Array.from(tramosUnicos.values());
  logger.debug(`Procesados ${tramosHistoricos.length} tramos históricos filtrados por fecha`);

  return {
    tramos: tramosHistoricos,
    metadata: {
      totalTramos: tramos.length,
      tramosHistoricos: tramosHistoricos.length,
    },
  };
}

/**
 * Procesa tarifas históricas para rango de fechas
 */
function processHistoricalTarifas(
  tramo: { origen: unknown; destino: unknown; tarifasHistoricas: unknown[] },
  mapaTramos: Map<string, unknown>,
  desdeDate: Date,
  hastaDate: Date
): Map<string, unknown> {
  // Filtrar tarifas que se superpongan con el rango de fechas solicitado
  const tarifasEnRango = tramo.tarifasHistoricas.filter((tarifa: unknown) => {
    if (!isValidTarifa(tarifa)) return false;
    return isDateInRange(tarifa.vigenciaDesde, tarifa.vigenciaHasta, desdeDate, hastaDate);
  });

  // Agrupar por tipo y obtener la más reciente para cada tipo
  const tiposTarifa = [...new Set(tarifasEnRango.filter(isValidTarifa).map((t) => t.tipo))];

  tiposTarifa.forEach((tipo: string) => {
    // Obtener la tarifa más reciente de este tipo
    const tarifaMasReciente = tarifasEnRango
      .filter(isValidTarifa)
      .filter((t) => t.tipo === tipo)
      .sort((a, b) => new Date(b.vigenciaHasta).getTime() - new Date(a.vigenciaHasta).getTime())[0];

    if (tarifaMasReciente) {
      const tramoConTarifa = {
        ...tramo,
        tipo,
        metodoCalculo: tarifaMasReciente.metodoCalculo,
        valor: tarifaMasReciente.valor,
        valorPeaje: tarifaMasReciente.valorPeaje,
        vigenciaDesde: tarifaMasReciente.vigenciaDesde,
        vigenciaHasta: tarifaMasReciente.vigenciaHasta,
        tarifasHistoricas: tramo.tarifasHistoricas,
      };

      const clave = createTramoKey(tramo.origen, tramo.destino, tipo);
      updateMapWithMoreRecent(
        mapaTramos,
        clave,
        tramoConTarifa,
        new Date(tarifaMasReciente.vigenciaHasta)
      );
    }
  });

  return mapaTramos;
}

/**
 * Actualiza mapa si el tramo es más reciente
 */
function updateMapWithMoreRecent(
  mapaTramos: Map<string, unknown>,
  clave: string,
  tramoActualizado: unknown,
  fechaHasta: Date
): void {
  const tramoExistente = mapaTramos.get(clave) as { vigenciaHasta: Date } | undefined;
  if (
    !mapaTramos.has(clave) ||
    (tramoExistente && fechaHasta > new Date(tramoExistente.vigenciaHasta))
  ) {
    mapaTramos.set(clave, tramoActualizado);
  }
}

/**
 * Compara dos strings para ordenamiento
 */
function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Obtiene el nombre del site de origen de un tramo
 */
function getOrigenName(tramo: unknown): string {
  return isValidTramo(tramo) ? tramo.origen?.Site || '' : '';
}

/**
 * Obtiene el nombre del site de destino de un tramo
 */
function getDestinoName(tramo: unknown): string {
  return isValidTramo(tramo) ? tramo.destino?.Site || '' : '';
}

/**
 * Obtiene el tipo de un tramo
 */
function getTramoTipo(tramo: unknown): string {
  return isValidTramo(tramo) ? tramo.tipo || 'TRMC' : 'TRMC';
}

/**
 * Función de comparación para ordenar tramos
 */
function compareTramos(a: unknown, b: unknown): number {
  if (!isValidTramo(a) || !isValidTramo(b)) return 0;

  // Comparar por origen
  const origenComparison = compareStrings(getOrigenName(a), getOrigenName(b));
  if (origenComparison !== 0) return origenComparison;

  // Comparar por destino
  const destinoComparison = compareStrings(getDestinoName(a), getDestinoName(b));
  if (destinoComparison !== 0) return destinoComparison;

  // Comparar por tipo
  return getTramoTipo(a).localeCompare(getTramoTipo(b));
}

/**
 * Ordena tramos por origen, destino y tipo
 */
function sortTramos(tramosArray: unknown[]): unknown[] {
  return tramosArray.sort(compareTramos);
}
