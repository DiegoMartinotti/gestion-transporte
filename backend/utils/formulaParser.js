/**
 * Utilidad para evaluar fórmulas tipo Excel en JavaScript
 */

/**
 * Evalúa una fórmula con una sintaxis similar a Excel utilizando nombres de variables
 * @param {string} formula - La fórmula a evaluar
 * @param {object} variables - Un objeto con las variables a utilizar en la evaluación
 * @returns {number} - El resultado de evaluar la fórmula
 */
function evaluarFormula(formula, variables) {
  try {
    // Si no hay fórmula, devolver 0
    if (!formula) return 0;

    // Reemplazar variables por sus valores
    let expresion = formula;
    
    // Reemplazar cada variable por su valor correspondiente
    for (const [nombre, valor] of Object.entries(variables)) {
      // Usamos una expresión regular con límites de palabra para evitar reemplazos parciales
      const regex = new RegExp(`\\b${nombre}\\b`, 'g');
      expresion = expresion.replace(regex, valor);
    }
    
    // Reemplazar "," por "." para asegurar formato numérico adecuado
    expresion = expresion.replace(/,/g, '.');
    
    // Manejar función SI(condicion;valorVerdadero;valorFalso)
    expresion = procesarFuncionSI(expresion);
    
    // Evaluar la expresión resultante
    // eslint-disable-next-line no-new-func
    const resultado = Function('return ' + expresion)();
    
    // Asegurarse de que el resultado sea un número
    if (typeof resultado !== 'number' || isNaN(resultado)) {
      throw new Error(`La fórmula no produjo un número válido: ${resultado}`);
    }
    
    return resultado;
  } catch (error) {
    console.error('Error al evaluar fórmula:', error);
    console.error('Fórmula original:', formula);
    console.error('Variables:', variables);
    // En caso de error, devolver 0 o un valor por defecto
    return 0;
  }
}

/**
 * Procesa las funciones SI() en una expresión y las convierte a operadores ternarios
 * @param {string} expresion - La expresión a procesar
 * @returns {string} - La expresión con las funciones SI convertidas
 */
function procesarFuncionSI(expresion) {
  // Patrón para detectar SI(condicion;valorVerdadero;valorFalso)
  const patron = /SI\s*\(\s*([^;]+);\s*([^;]+);\s*([^)]+)\s*\)/g;
  
  // Reemplazar cada ocurrencia por el equivalente ternario
  return expresion.replace(patron, "($1 ? $2 : $3)");
}

/**
 * Calcula la tarifa para un tipo Palet usando la fórmula del cliente
 * @param {number} valorBase - El valor base del tramo
 * @param {number} valorPeaje - El valor del peaje
 * @param {number} palets - La cantidad de palets
 * @param {string} formula - La fórmula a utilizar
 * @returns {object} - Resultado con tarifaBase, peaje y total
 */
function calcularTarifaPaletConFormula(valorBase, valorPeaje, palets, formula) {
  const formulaDefault = "Valor * Palets + Peaje";
  
  const formulaAUsar = formula || formulaDefault;
  
  const variables = {
    Valor: valorBase,
    Peaje: valorPeaje,
    Palets: palets
  };
  
  try {
    // Si la fórmula solo contiene Peaje (sin Valor ni Palets), calculamos como fijo + peaje
    if (formulaAUsar.includes('Peaje') && !formulaAUsar.includes('Valor') && !formulaAUsar.includes('Palets')) {
      const tarifaBase = valorBase;
      return {
        tarifaBase: Math.round(tarifaBase * 100) / 100,
        peaje: Math.round(valorPeaje * 100) / 100,
        total: Math.round((tarifaBase + valorPeaje) * 100) / 100
      };
    }
    
    // Evaluar la fórmula completa
    const total = evaluarFormula(formulaAUsar, variables);
    
    // Identificar el componente de peaje
    let peajeComponent;
    if (formulaAUsar.includes('+ Peaje')) {
      peajeComponent = valorPeaje;
    } else {
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
  } catch (error) {
    console.error('Error al calcular tarifa con fórmula personalizada:', error);
    
    // Fallback a cálculo estándar
    const tarifaBase = valorBase * palets;
    const total = tarifaBase + valorPeaje;
    
    return {
      tarifaBase: Math.round(tarifaBase * 100) / 100,
      peaje: Math.round(valorPeaje * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}

module.exports = {
  evaluarFormula,
  procesarFuncionSI,
  calcularTarifaPaletConFormula
};