import FormulasPersonalizadasCliente from '../models/FormulasPersonalizadasCliente';
import logger from '../utils/logger';

// Definir la fórmula estándar globalmente (o cargarla desde configuración)
const FORMULA_ESTANDAR = "Valor * Palets + Peaje"; // Confirmar si esta es la correcta

/**
 * Obtiene la fórmula de tarifa aplicable para un cliente en una fecha específica.
 * Busca una fórmula personalizada vigente; si no existe, devuelve la estándar.
 *
 * @param clienteId - ID del cliente.
 * @param tipoUnidad - Tipo de unidad (ej. 'Sider', 'Bitren', 'General').
 * @param fechaDeCalculo - La fecha para la cual se busca la fórmula.
 * @returns La fórmula string aplicable.
 */
async function getFormulaAplicable(clienteId: string, tipoUnidad: string, fechaDeCalculo: Date): Promise<string> {
  try {
    logger.debug(`Buscando fórmula para cliente ${clienteId}, unidad ${tipoUnidad}, fecha ${fechaDeCalculo.toISOString()}`);

    const fecha = new Date(fechaDeCalculo); // Asegurar que es un objeto Date
    
    // Validación de parámetros
    if (!clienteId) {
      logger.warn('clienteId no proporcionado para buscar fórmula');
      return FORMULA_ESTANDAR;
    }
    
    if (!tipoUnidad) {
      logger.warn('tipoUnidad no proporcionado, asumiendo Sider');
      tipoUnidad = 'Sider';
    }

    // Buscar todas las fórmulas del cliente para entender qué tenemos disponible
    const todasLasFormulas = await FormulasPersonalizadasCliente.find({
      clienteId: clienteId
    }).sort({ vigenciaDesde: -1 });

    logger.debug(`Total de fórmulas encontradas para cliente ${clienteId}: ${todasLasFormulas.length}`);
    todasLasFormulas.forEach((formula, index) => {
      logger.debug(`Fórmula ${index + 1}: ${formula.formula}, Tipo: ${formula.tipoUnidad}, Vigencia: ${formula.vigenciaDesde} - ${formula.vigenciaHasta || 'indefinida'}`);
    });

    logger.debug(`Buscando fórmula personalizada exacta para clienteId=${clienteId}, tipoUnidad=${tipoUnidad}, fecha=${fecha.toISOString()}`);

    // 1. Buscar fórmula específica para el tipo de unidad y fecha exacta
    const formulaPersonalizada = await FormulasPersonalizadasCliente.findOne({
      clienteId: clienteId,
      tipoUnidad: tipoUnidad,
      vigenciaDesde: { $lte: fecha },
      $or: [
        { vigenciaHasta: { $gte: fecha } },
        { vigenciaHasta: null } // Considera las fórmulas activas sin fecha de fin
      ]
    })
    .sort({ vigenciaDesde: -1 }); // Prioriza la más reciente si hay solapamiento accidental

    if (formulaPersonalizada) {
      logger.debug(`Fórmula personalizada encontrada: ${formulaPersonalizada.formula} (ID: ${formulaPersonalizada._id})`);
      logger.debug(`Vigencia: ${formulaPersonalizada.vigenciaDesde?.toISOString()} - ${formulaPersonalizada.vigenciaHasta?.toISOString() || 'indefinida'}`);
      return formulaPersonalizada.formula;
    } 
    
    // 2. Si no encuentra fórmula específica, buscar una fórmula 'General'
    logger.debug(`No se encontró fórmula específica para ${tipoUnidad} en fecha ${fecha.toISOString()}. Buscando fórmula 'General'.`);
    
    const formulaGeneral = await FormulasPersonalizadasCliente.findOne({
      clienteId: clienteId,
      tipoUnidad: 'General', // Busca tipo 'General' como fallback
      vigenciaDesde: { $lte: fecha },
      $or: [
        { vigenciaHasta: { $gte: fecha } },
        { vigenciaHasta: null }
      ]
    }).sort({ vigenciaDesde: -1 });

    if (formulaGeneral) {
      logger.debug(`Fórmula personalizada general encontrada: ${formulaGeneral.formula} (ID: ${formulaGeneral._id})`);
      logger.debug(`Vigencia: ${formulaGeneral.vigenciaDesde?.toISOString()} - ${formulaGeneral.vigenciaHasta?.toISOString() || 'indefinida'}`);
      return formulaGeneral.formula;
    } 
    
    // 3. Buscar la fórmula más reciente antes de la fecha especificada (histórica)
    logger.debug(`No se encontró fórmula vigente. Buscando fórmula histórica más reciente para ${tipoUnidad}`);
    
    const formulaHistorica = await FormulasPersonalizadasCliente.findOne({
      clienteId: clienteId,
      tipoUnidad: tipoUnidad,
      vigenciaDesde: { $lte: fecha }
    }).sort({ vigenciaDesde: -1 });
    
    if (formulaHistorica) {
      logger.debug(`Fórmula histórica encontrada: ${formulaHistorica.formula} (ID: ${formulaHistorica._id})`);
      logger.debug(`Vigencia: ${formulaHistorica.vigenciaDesde?.toISOString()} - ${formulaHistorica.vigenciaHasta?.toISOString() || 'indefinida'}`);
      return formulaHistorica.formula;
    }
    
    // 4. Buscar cualquier fórmula para el cliente como último recurso
    logger.debug(`No se encontró fórmula histórica. Buscando cualquier fórmula disponible.`);
    
    const cualquierFormula = await FormulasPersonalizadasCliente.findOne({
      clienteId: clienteId,
      $or: [
        { tipoUnidad: tipoUnidad },
        { tipoUnidad: 'General' }
      ]
    }).sort({ vigenciaDesde: -1 });
    
    if (cualquierFormula) {
      logger.debug(`Encontrada fórmula alternativa: ${cualquierFormula.formula} (ID: ${cualquierFormula._id})`);
      logger.debug(`Tipo: ${cualquierFormula.tipoUnidad}, Vigencia: ${cualquierFormula.vigenciaDesde?.toISOString()} - ${cualquierFormula.vigenciaHasta?.toISOString() || 'indefinida'}`);
      return cualquierFormula.formula;
    }
    
    // 5. Sin fórmulas disponibles, usar la estándar
    logger.debug('No se encontró ninguna fórmula para el cliente. Usando fórmula estándar global.');
    return FORMULA_ESTANDAR;
  } catch (error) {
    logger.error(`Error buscando fórmula aplicable para cliente ${clienteId}:`, error);
    // En caso de error, devolver la estándar como fallback seguro
    return FORMULA_ESTANDAR;
  }
}

export {
  getFormulaAplicable,
  FORMULA_ESTANDAR // Exportar por si se necesita en otro lado
};