/**
 * @module services/tarifaService
 * @description Servicio para el cálculo y gestión de tarifas de tramos
 */

const { calcularTarifaPaletConFormula } = require('../utils/formulaParser');
const logger = require('../utils/logger');

/**
 * Calcula la tarifa para un tipo de tramo específico
 * 
 * @param {Object} tramo - Objeto tramo completo con toda la información
 * @param {number} palets - Cantidad de palets
 * @param {string} [tipo='TRMC'] - Tipo de tramo
 * @param {string} [formulaCliente=null] - Fórmula personalizada del cliente
 * @returns {Object} Objeto con tarifaBase, peaje y total
 */
function calcularTarifaTramo(tramo, palets, tipo = 'TRMC', formulaCliente = null) {
    try {
        // Si se proporciona una fórmula específica del cliente, usarla directamente
        if (formulaCliente) {
            logger.debug(`Usando fórmula de cliente proporcionada: ${formulaCliente}`);
            // Necesitamos valorBase y valorPeaje del tramo para el parser
            let valorBaseTramo, valorPeajeTramo;
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                const tarifaEspecifica = tramo.tarifasHistoricas.find(t => t.tipo === tipo);
                if (tarifaEspecifica) {
                    valorBaseTramo = tarifaEspecifica.valor || 0;
                    valorPeajeTramo = tarifaEspecifica.valorPeaje || 0;
                } else {
                    valorBaseTramo = tramo.valor || 0;
                    valorPeajeTramo = tramo.valorPeaje || 0;
                }
            } else {
                valorBaseTramo = tramo.valor || 0;
                valorPeajeTramo = tramo.valorPeaje || 0;
            }
            // Llamar al parser con los valores del tramo y la fórmula del cliente
            return calcularTarifaPaletConFormula(valorBaseTramo, valorPeajeTramo, palets, formulaCliente);
        }
        
        let valorBase, valorPeaje, metodoCalculo;

        // Determinar qué tarifa usar dependiendo del tipo
        if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
            // Buscar la tarifa específica por tipo
            const tarifaEspecifica = tramo.tarifasHistoricas.find(t => t.tipo === tipo);
            
            if (tarifaEspecifica) {
                valorBase = tarifaEspecifica.valor || 0;
                valorPeaje = tarifaEspecifica.valorPeaje || 0;
                metodoCalculo = tarifaEspecifica.metodoCalculo;
            } else {
                // Si no hay tarifa específica, usar valores del tramo
                valorBase = tramo.valor || 0;
                valorPeaje = tramo.valorPeaje || 0;
                metodoCalculo = tramo.metodoCalculo;
                
                logger.warn(`No se encontró tarifa para tipo ${tipo}, usando valores por defecto`);
            }
        } else {
            // Usar los valores del tramo
            valorBase = tramo.valor || 0;
            valorPeaje = tramo.valorPeaje || 0;
            metodoCalculo = tramo.metodoCalculo;
        }

        // Determinar el cálculo según el método
        if (metodoCalculo === 'Kilometro' && tramo.distancia) {
            // Para cálculo por kilómetro, multiplicamos el valor base por la distancia
            const tarifaBase = valorBase * tramo.distancia;
            const peaje = valorPeaje;
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(peaje * 100) / 100,
                total: Math.round((tarifaBase + peaje) * 100) / 100
            };
        } else if (metodoCalculo === 'Fijo') {
            // Para tarifa fija, el valor base ya es el precio total sin considerar palets
            const tarifaBase = valorBase;
            const peaje = valorPeaje;
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(peaje * 100) / 100,
                total: Math.round((tarifaBase + peaje) * 100) / 100
            };
        } else if (metodoCalculo === 'Palet') {
            // Para cálculo por palet, multiplicamos el valor base por la cantidad de palets
            const tarifaBase = valorBase * palets;
            const peaje = valorPeaje;
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(peaje * 100) / 100,
                total: Math.round((tarifaBase + peaje) * 100) / 100
            };
        } else {
            // Para fórmulas personalizadas o cualquier otro método, usar el parser de fórmulas
            return calcularTarifaPaletConFormula(valorBase, valorPeaje, palets, metodoCalculo);
        }
    } catch (error) {
        logger.error('Error al calcular tarifa para tramo:', error);
        // Relanzar el error para que sea manejado por el código que llama a esta función
        throw error;
    }
}

/**
 * Obtiene el precio de un tramo completo incluyendo extras
 * 
 * @param {Object} tramo - Objeto tramo
 * @param {number} palets - Cantidad de palets
 * @param {Array<Object>} extras - Lista de extras a aplicar
 * @param {string} [tipo='TRMC'] - Tipo de tramo
 * @returns {Object} Objeto con precio base, extras, peaje y total
 */
function calcularPrecioTramoConExtras(tramo, palets, extras = [], tipo = 'TRMC') {
    try {
        // Calcular tarifa base
        const tarifaBase = calcularTarifaTramo(tramo, palets, tipo);
        
        // Calcular extras
        let totalExtras = 0;
        const extrasDetalle = [];
        
        extras.forEach(extra => {
            const valorExtra = parseFloat(extra.valor) || 0;
            totalExtras += valorExtra;
            extrasDetalle.push({
                id: extra.id,
                nombre: extra.nombre,
                valor: valorExtra
            });
        });
        
        // Calcular total
        const total = tarifaBase.total + totalExtras;
        
        return {
            base: tarifaBase.tarifaBase,
            peaje: tarifaBase.peaje,
            extras: extrasDetalle,
            totalExtras,
            total: Math.round(total * 100) / 100
        };
    } catch (error) {
        logger.error('Error al calcular precio de tramo con extras:', error);
        // Devolver valores por defecto en caso de error
        return {
            base: 0,
            peaje: 0,
            extras: [],
            totalExtras: 0,
            total: 0
        };
    }
}

module.exports = {
    calcularTarifaTramo,
    calcularPrecioTramoConExtras
}; 