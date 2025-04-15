/**
 * Utilidades para el módulo de tarifario
 */
import dayjs from 'dayjs';
import { isWithinInterval, parseISO } from 'date-fns';

// Constantes para formatos de fecha
export const DATE_FORMAT = 'DD/MM/YYYY';
export const ISO_FORMAT = 'YYYY-MM-DD';

/**
 * Formatea un valor numérico como moneda
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado como moneda
 */
export const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formatea una fecha ISO a formato legible, asegurando que se use UTC
 * para evitar problemas de un día menos por zona horaria.
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Crear una fecha en UTC sin importar la zona horaria
    const date = new Date(dateString);
    
    // Extraer los componentes de la fecha en UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;  // En JavaScript los meses empiezan en 0
    const day = date.getUTCDate();
    
    // Formatear con padding de ceros y según formato DD/MM/YYYY
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

/**
 * Procesa una fecha desde un string
 * @param {string} dateString - Fecha como string
 * @returns {string|null} Fecha procesada o null
 */
export const parseDate = (dateString) => {
    if (!dateString) return null;
    return dayjs(dateString).format(ISO_FORMAT);
};

/**
 * Obtiene las tarifas vigentes de un tramo para el período especificado
 * Esta función evita duplicaciones y maneja correctamente las tarifas históricas
 * 
 * @param {Object} tramo - Objeto tramo con sus datos
 * @param {string} fechaDesde - Fecha desde (YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (YYYY-MM-DD)
 * @returns {Array} - Array de tarifas vigentes en el período
 */
export const obtenerTarifasVigentes = (tramo, fechaDesde, fechaHasta) => {
  // Si no especifica fechas, devolver tarifa actual
  if (!fechaDesde || !fechaHasta) {
    // Si tiene tarifa actual directa
    if (tramo.tarifa != null) {
      return [{
        ...tramo.tarifa,
        tipo: tramo.tarifa.tipo || (tramo.trmi ? 'TRMI' : 'TRMC'),
        valor: tramo.tarifa.valor != null ? tramo.tarifa.valor : tramo.valor,
        vigenciaDesde: tramo.tarifa.vigenciaDesde || tramo.vigenciaDesde,
        vigenciaHasta: tramo.tarifa.vigenciaHasta || tramo.vigenciaHasta
      }];
    }
    
    // Para formato antiguo
    return [{
      tipo: tramo.trmi ? 'TRMI' : 'TRMC',
      valor: tramo.valor,
      vigenciaDesde: tramo.vigenciaDesde,
      vigenciaHasta: tramo.vigenciaHasta,
      detalle: tramo.detalle || '-'
    }];
  }
  
  // Si no hay tarifas históricas o tienen formato diferente
  if (!tramo.tarifasHistoricas || !Array.isArray(tramo.tarifasHistoricas) || tramo.tarifasHistoricas.length === 0) {
    // Usar formato antiguo y verificar si está en rango
    const tarifaActual = {
      tipo: tramo.trmi ? 'TRMI' : 'TRMC',
      valor: tramo.valor,
      vigenciaDesde: tramo.vigenciaDesde,
      vigenciaHasta: tramo.vigenciaHasta,
      detalle: tramo.detalle || '-'
    };
    
    // Verificar si está en el rango solicitado
    if (tarifaActual.vigenciaDesde && tarifaActual.vigenciaHasta) {
      const [tramoDesde] = tarifaActual.vigenciaDesde.split('T');
      const [tramoHasta] = tarifaActual.vigenciaHasta.split('T');
      
      if (tramoDesde <= fechaHasta && tramoHasta >= fechaDesde) {
        return [tarifaActual];
      }
    }
    
    return [];
  }
  
  // Filtrar tarifas históricas que están en el rango de fechas
  // y usar un Set para guardar los tipos únicos y evitar duplicados
  const tiposUnicos = new Set();
  const tarifasEnRango = [];
  
  for (const tarifa of tramo.tarifasHistoricas) {
    if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta) {
      continue;
    }
    
    const [tarifaDesde] = tarifa.vigenciaDesde.split('T');
    const [tarifaHasta] = tarifa.vigenciaHasta.split('T');
    
    if (tarifaDesde <= fechaHasta && tarifaHasta >= fechaDesde) {
      const tipo = tarifa.tipo || (tarifa.trmi ? 'TRMI' : 'TRMC');
      
      // Solo agregar esta tarifa si su tipo no se ha agregado antes
      if (!tiposUnicos.has(tipo)) {
        tiposUnicos.add(tipo);
        tarifasEnRango.push({
          ...tarifa,
          tipo
        });
      }
    }
  }
  
  return tarifasEnRango;
}; 