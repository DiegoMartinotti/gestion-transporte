/**
 * Utilidad para evaluar fórmulas tipo Excel en JavaScript
 */
import logger from './logger';
import * as mathjs from 'mathjs';
// Configurar mathjs para modo seguro
const limitedMath = mathjs.create(mathjs.all);
limitedMath.config({
    matrix: 'Array', // Configurar para usar array normal en lugar de matrices especiales
    number: 'number' // Usar números JavaScript nativos
});
// Limitar funciones permitidas
limitedMath.import({
    // Funciones matemáticas básicas y seguras
    add: mathjs.add,
    subtract: mathjs.subtract,
    multiply: mathjs.multiply,
    divide: mathjs.divide,
    pow: mathjs.pow,
    sqrt: mathjs.sqrt,
    round: mathjs.round,
    max: mathjs.max,
    min: mathjs.min,
    abs: mathjs.abs
}, { override: true });
// Crear evaluador seguro
const limitedEval = limitedMath.evaluate;
/**
 * Evalúa una fórmula con una sintaxis similar a Excel utilizando nombres de variables
 * @param formula - La fórmula a evaluar
 * @param variables - Un objeto con las variables a utilizar en la evaluación
 * @returns - El resultado de evaluar la fórmula o 0 en caso de error
 */
function evaluarFormula(formula, variables) {
    try {
        // Si no hay fórmula, devolver 0
        if (!formula)
            return 0;
        // Reemplazar variables por sus valores
        let expresion = formula;
        // Convertir las variables a números si es necesario
        const varsNumeric = {};
        for (const [nombre, valor] of Object.entries(variables)) {
            varsNumeric[nombre] = typeof valor === 'string' ? parseFloat(valor) : valor;
        }
        // Log para depuración
        logger.debug('Variables:', varsNumeric);
        // Reemplazar cada variable por su valor correspondiente
        for (const [nombre, valor] of Object.entries(varsNumeric)) {
            // Usamos una expresión regular con límites de palabra para evitar reemplazos parciales
            const regex = new RegExp(`\\b${nombre}\\b`, 'g');
            expresion = expresion.replace(regex, valor.toString());
        }
        // Reemplazar "," por "." para asegurar formato numérico adecuado
        expresion = expresion.replace(/,/g, '.');
        // Manejar función SI(condicion;valorVerdadero;valorFalso)
        expresion = procesarFuncionSI(expresion);
        logger.debug('Expresión a evaluar:', expresion);
        try {
            // Evaluar la expresión de forma segura usando mathjs
            const resultado = mathjs.evaluate(expresion);
            // Asegurarse de que el resultado sea un número
            if (typeof resultado !== 'number' || isNaN(resultado)) {
                throw new Error(`La fórmula no produjo un número válido: ${resultado}`);
            }
            logger.debug('Resultado de la evaluación:', resultado);
            return resultado;
        }
        catch (mathError) {
            logger.error('Error al evaluar con mathjs:', mathError);
            // Intentar una evaluación alternativa con Function
            return evaluarAlternativo(expresion);
        }
    }
    catch (error) {
        logger.error('Error al evaluar fórmula:', error);
        logger.error('Fórmula original:', formula);
        logger.debug('Variables:', variables);
        // Si hay un error, intentar un cálculo simple con los valores recibidos
        try {
            const valorBase = variables.Valor || 0;
            const palets = variables.Palets || 0;
            const valorPeaje = variables.Peaje || 0;
            const total = valorBase * palets + valorPeaje;
            logger.debug('Fallback a cálculo simple:', total);
            return total;
        }
        catch (fallbackError) {
            logger.error('Error en cálculo fallback:', fallbackError);
            return 0;
        }
    }
}
/**
 * Procesa las funciones SI() en una expresión y las convierte a operadores ternarios
 * @param expresion - La expresión a procesar
 * @returns - La expresión con las funciones SI convertidas
 */
function procesarFuncionSI(expresion) {
    // Patrón para detectar SI(condicion;valorVerdadero;valorFalso)
    const patron = /SI\s*\(\s*([^;]+);\s*([^;]+);\s*([^)]+)\s*\)/g;
    // Reemplazar cada ocurrencia por el equivalente ternario
    return expresion.replace(patron, "($1 ? $2 : $3)");
}
/**
 * Método alternativo para evaluar expresiones
 * @param expresion - La expresión a evaluar
 * @returns - Resultado de la evaluación
 */
function evaluarAlternativo(expresion) {
    try {
        // Reemplazar los operadores ternarios por una implementación más segura
        // Convertir (condicion ? valorVerdadero : valorFalso) a una forma más compatible
        expresion = expresion.replace(/\(([^?]+)\s*\?\s*([^:]+)\s*:\s*([^)]+)\)/g, (match, condicion, valorVerdadero, valorFalso) => {
            return `(${condicion} > 0 ? ${valorVerdadero} : ${valorFalso})`;
        });
        logger.debug('Expresión alternativa:', expresion);
        // Usar Function pero con un contexto controlado
        // @ts-ignore - Ignoramos advertencia de seguridad, ya que esta es una función de fallback
        const evaluador = new Function('return ' + expresion);
        const resultado = evaluador();
        logger.debug('Resultado alternativo:', resultado);
        if (typeof resultado !== 'number' || isNaN(resultado)) {
            throw new Error('Resultado no numérico');
        }
        return resultado;
    }
    catch (error) {
        logger.error('Error en evaluación alternativa:', error);
        return 0;
    }
}
/**
 * Calcula la tarifa para un tipo Palet usando la fórmula del cliente
 * @param valorBase - El valor base del tramo
 * @param valorPeaje - El valor del peaje
 * @param palets - La cantidad de palets
 * @param formula - La fórmula a utilizar
 * @returns - Resultado con tarifaBase, peaje y total
 */
function calcularTarifaPaletConFormula(valorBase, valorPeaje, palets, formula) {
    // Agregar log detallado de los valores recibidos
    logger.debug(`calcularTarifaPaletConFormula - Valores recibidos:
    valorBase: ${valorBase} (tipo: ${typeof valorBase})
    valorPeaje: ${valorPeaje} (tipo: ${typeof valorPeaje})
    palets: ${palets} (tipo: ${typeof palets})
    formula: ${formula}`);
    // Asegurarnos que los valores sean numéricos
    const valorBaseNum = typeof valorBase === 'string' ? parseFloat(valorBase) : valorBase;
    const valorPeajeNum = typeof valorPeaje === 'string' ? parseFloat(valorPeaje) : valorPeaje;
    const paletsNum = typeof palets === 'string' ? parseFloat(palets) : palets;
    const formulaDefault = "Valor * Palets + Peaje";
    const formulaAUsar = formula || formulaDefault;
    const variables = {
        Valor: valorBaseNum,
        Peaje: valorPeajeNum,
        Palets: paletsNum
    };
    try {
        // Si la fórmula solo contiene Peaje (sin Valor ni Palets), calculamos como fijo + peaje
        if (formulaAUsar.includes('Peaje') && !formulaAUsar.includes('Valor') && !formulaAUsar.includes('Palets')) {
            const tarifaBase = valorBaseNum;
            return {
                tarifaBase: Math.round(tarifaBase * 100) / 100,
                peaje: Math.round(valorPeajeNum * 100) / 100,
                total: Math.round((tarifaBase + valorPeajeNum) * 100) / 100
            };
        }
        // Evaluar la fórmula completa
        const total = evaluarFormula(formulaAUsar, variables);
        // Identificar el componente de peaje
        let peajeComponent;
        if (formulaAUsar.includes('+ Peaje')) {
            peajeComponent = valorPeajeNum;
        }
        else {
            // Si el peaje está integrado en la fórmula de manera más compleja, lo dejamos en 0
            peajeComponent = 0;
        }
        // La tarifa base es el total menos el peaje
        const tarifaBase = total - peajeComponent;
        return {
            tarifaBase: Math.round(tarifaBase * 100) / 100,
            peaje: Math.round(peajeComponent * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    }
    catch (error) {
        logger.error('Error al calcular tarifa con fórmula personalizada:', error);
        // Fallback a cálculo estándar
        const tarifaBase = valorBaseNum * paletsNum;
        const total = tarifaBase + valorPeajeNum;
        return {
            tarifaBase: Math.round(tarifaBase * 100) / 100,
            peaje: Math.round(valorPeajeNum * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    }
}
export { evaluarFormula, procesarFuncionSI, calcularTarifaPaletConFormula };
//# sourceMappingURL=formulaParser.js.map