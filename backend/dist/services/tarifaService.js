/**
 * @module services/tarifaService
 * @description Servicio para el cálculo y gestión de tarifas de tramos
 */
import { calcularTarifaPaletConFormula } from '../utils/formulaParser';
import logger from '../utils/logger';
/**
 * Calcula la tarifa para un tipo de tramo específico
 *
 * @param tramo - Objeto tramo completo con toda la información
 * @param palets - Cantidad de palets
 * @param tipo - Tipo de tramo
 * @param formulaCliente - Fórmula personalizada del cliente
 * @returns Objeto con tarifaBase, peaje y total
 */
function calcularTarifaTramo(tramo, palets, tipo = 'TRMC', formulaCliente = null) {
    try {
        // Log para ver los parámetros que llegan a la función
        logger.debug(`calcularTarifaTramo - Parámetros recibidos: 
            tramo.valor: ${tramo.valor}
            tramo.valorPeaje: ${tramo.valorPeaje}
            tramo.metodoCalculo: ${tramo.metodoCalculo}
            palets: ${palets}
            tipo: ${tipo}
            formulaCliente: ${formulaCliente}`);
        // Si se proporciona una fórmula específica del cliente, usarla directamente
        if (formulaCliente) {
            logger.debug(`Usando fórmula de cliente proporcionada: ${formulaCliente}`);
            // Usar directamente los valores del tramo que se han pasado
            const valorBaseTramo = tramo.valor || 0;
            const valorPeajeTramo = tramo.valorPeaje || 0;
            logger.debug(`Valores exactos para cálculo con fórmula personalizada: 
                valorBase: ${valorBaseTramo}
                valorPeaje: ${valorPeajeTramo}
                palets: ${palets}`);
            // Llamar al parser con los valores exactos del tramo y la fórmula del cliente
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
                // Si el tramo ya tiene un método de cálculo definido, usarlo en lugar de obtenerlo de la tarifa
                metodoCalculo = tramo.metodoCalculo || tarifaEspecifica.metodoCalculo;
            }
            else {
                // Si no hay tarifa específica, usar valores del tramo
                valorBase = tramo.valor || 0;
                valorPeaje = tramo.valorPeaje || 0;
                metodoCalculo = tramo.metodoCalculo;
                logger.warn(`No se encontró tarifa para tipo ${tipo}, usando valores por defecto`);
            }
        }
        else {
            // Usar los valores del tramo
            valorBase = tramo.valor || 0;
            valorPeaje = tramo.valorPeaje || 0;
            metodoCalculo = tramo.metodoCalculo;
        }
        // Verificar que los valores no sean null, undefined o NaN
        valorBase = valorBase || 0;
        valorPeaje = valorPeaje || 0;
        // Registrar el método de cálculo y valores que se están utilizando
        logger.debug(`Datos para cálculo de tarifa:
            metodoCalculo: ${metodoCalculo}
            valorBase: ${valorBase}
            valorPeaje: ${valorPeaje}
            palets: ${palets}
            distancia: ${tramo.distancia || 0}
            tramo._id: ${tramo._id || 'nuevo'}`);
        // Determinar el cálculo según el método
        if (metodoCalculo === 'Kilometro' && tramo.distancia) {
            // Para cálculo por kilómetro, multiplicamos el valor base por la distancia
            const tarifaBase = valorBase * tramo.distancia;
            const peaje = valorPeaje;
            logger.debug(`Cálculo por Kilometro: valorBase(${valorBase}) * distancia(${tramo.distancia}) = ${tarifaBase}`);
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(peaje * 100) / 100,
                total: Math.round((tarifaBase + peaje) * 100) / 100
            };
        }
        else if (metodoCalculo === 'Fijo') {
            // Para tarifa fija, el valor base ya es el precio total sin considerar palets
            const tarifaBase = valorBase;
            const peaje = valorPeaje;
            logger.debug(`Cálculo Fijo: valorBase(${valorBase})`);
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(peaje * 100) / 100,
                total: Math.round((tarifaBase + peaje) * 100) / 100
            };
        }
        else if (metodoCalculo === 'Palet') {
            // Para cálculo por palet, multiplicamos el valor base por la cantidad de palets
            const tarifaBase = valorBase * palets;
            const peaje = valorPeaje;
            logger.debug(`Cálculo por Palet: valorBase(${valorBase}) * palets(${palets}) = ${tarifaBase}`);
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(peaje * 100) / 100,
                total: Math.round((tarifaBase + peaje) * 100) / 100
            };
        }
        else {
            // Para fórmulas personalizadas o cualquier otro método, usar el parser de fórmulas
            logger.debug(`Utilizando método personalizado/fórmula para el cálculo: ${metodoCalculo}`);
            return calcularTarifaPaletConFormula(valorBase, valorPeaje, palets, metodoCalculo || '');
        }
    }
    catch (error) {
        logger.error('Error al calcular tarifa para tramo:', error);
        // Relanzar el error para que sea manejado por el código que llama a esta función
        throw error;
    }
}
/**
 * Obtiene el precio de un tramo completo incluyendo extras
 *
 * @param tramo - Objeto tramo
 * @param palets - Cantidad de palets
 * @param extras - Lista de extras a aplicar
 * @param tipo - Tipo de tramo
 * @returns Objeto con precio base, extras, peaje y total
 */
function calcularPrecioTramoConExtras(tramo, palets, extras = [], tipo = 'TRMC') {
    try {
        // Calcular tarifa base
        const tarifaBase = calcularTarifaTramo(tramo, palets, tipo);
        // Calcular extras
        let totalExtras = 0;
        const extrasDetalle = [];
        extras.forEach(extra => {
            const valorExtra = parseFloat(extra.valor.toString()) || 0;
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
    }
    catch (error) {
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
export { calcularTarifaTramo, calcularPrecioTramoConExtras };
//# sourceMappingURL=tarifaService.js.map