const FormulasPersonalizadasCliente = require('../models/FormulasPersonalizadasCliente');
const logger = require('../utils/logger');

// Definir la fórmula estándar globalmente (o cargarla desde configuración)
const FORMULA_ESTANDAR = "Valor * Palets + Peaje"; // Confirmar si esta es la correcta

/**
 * Obtiene la fórmula de tarifa aplicable para un cliente en una fecha específica.
 * Busca una fórmula personalizada vigente; si no existe, devuelve la estándar.
 *
 * @param {string} clienteId - ID del cliente.
 * @param {string} tipoUnidad - Tipo de unidad (ej. 'Sider', 'Bitren', 'General').
 * @param {Date} fechaDeCalculo - La fecha para la cual se busca la fórmula.
 * @returns {Promise<string>} La fórmula string aplicable.
 */
async function getFormulaAplicable(clienteId, tipoUnidad, fechaDeCalculo) {
  try {
    logger.debug(`Buscando fórmula para cliente ${clienteId}, unidad ${tipoUnidad}, fecha ${fechaDeCalculo.toISOString()}`);

    const fecha = new Date(fechaDeCalculo); // Asegurar que es un objeto Date

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
      logger.debug(`Fórmula personalizada encontrada: ${formulaPersonalizada.formula}`);
      return formulaPersonalizada.formula;
    } else {
      logger.debug(`No se encontró fórmula personalizada para ${tipoUnidad}. Buscando fórmula 'General'.`);
      // Intentar buscar una fórmula 'General' si no se encontró la específica
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
         logger.debug(`Fórmula personalizada general encontrada: ${formulaGeneral.formula}`);
         return formulaGeneral.formula;
      } else {
         logger.debug('No se encontró fórmula general vigente. Usando fórmula estándar global.');
         return FORMULA_ESTANDAR;
      }
    }
  } catch (error) {
    logger.error(`Error buscando fórmula aplicable para cliente ${clienteId}:`, error);
    // En caso de error, devolver la estándar como fallback seguro
    return FORMULA_ESTANDAR;
  }
}

module.exports = {
  getFormulaAplicable,
  FORMULA_ESTANDAR // Exportar por si se necesita en otro lado
}; 