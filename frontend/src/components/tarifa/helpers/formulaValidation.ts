import { IVariableDefinition, IValidacionFormula, FUNCIONES_FORMULA } from '../../../types/tarifa';

export const validateFormula = (
  formula: string,
  variables: IVariableDefinition[]
): IValidacionFormula => {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const variablesUsadas: string[] = [];
  const funcionesUsadas: string[] = [];

  try {
    if (!formula.trim()) {
      return {
        valida: false,
        errores: ['La fórmula no puede estar vacía'],
        advertencias,
        variablesUsadas,
        funcionesUsadas,
      };
    }

    // Extraer variables y funciones
    const { variablesEncontradas, funcionesEncontradas } = extractVariablesAndFunctions(formula);
    variablesUsadas.push(...variablesEncontradas);
    funcionesUsadas.push(...funcionesEncontradas);

    // Validar variables
    const erroresVariables = validateVariables(variablesUsadas, variables);
    errores.push(...erroresVariables);

    // Validar sintaxis
    const erroresSintaxis = validateSyntax(formula);
    errores.push(...erroresSintaxis);

    // Advertencias
    if (variablesUsadas.length === 0) {
      advertencias.push('La fórmula no utiliza ninguna variable');
    }

    return {
      valida: errores.length === 0,
      errores,
      advertencias,
      variablesUsadas,
      funcionesUsadas,
    };
  } catch (error) {
    return {
      valida: false,
      errores: [`Error de sintaxis: ${error}`],
      advertencias,
      variablesUsadas,
      funcionesUsadas,
    };
  }
};

const extractVariablesAndFunctions = (formula: string) => {
  const variablesUsadas: string[] = [];
  const funcionesUsadas: string[] = [];
  
  // Extraer variables de la fórmula
  const variablesEnFormula = formula.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || [];
  
  // Separar funciones conocidas de variables
  const funcionesConocidas = FUNCIONES_FORMULA.map((f) => f.nombre);

  for (const item of variablesEnFormula) {
    const upperItem = item.toUpperCase();
    if (funcionesConocidas.includes(upperItem as string)) {
      if (!funcionesUsadas.includes(upperItem)) {
        funcionesUsadas.push(upperItem);
      }
    } else {
      if (!variablesUsadas.includes(item)) {
        variablesUsadas.push(item);
      }
    }
  }

  return {
    variablesEncontradas: variablesUsadas,
    funcionesEncontradas: funcionesUsadas,
  };
};

const validateVariables = (variablesUsadas: string[], variables: IVariableDefinition[]): string[] => {
  const errores: string[] = [];
  const variablesDefinidas = variables.map((v) => v.nombre);
  const variablesEstandar = ['Valor', 'Peaje', 'Cantidad'];
  const todasLasVariables = [...variablesDefinidas, ...variablesEstandar];

  for (const variable of variablesUsadas) {
    if (!todasLasVariables.includes(variable)) {
      errores.push(`Variable no definida: ${variable}`);
    }
  }

  return errores;
};

const validateSyntax = (formula: string): string[] => {
  const errores: string[] = [];

  // Validar paréntesis balanceados
  const errorParentesis = validateParentheses(formula);
  if (errorParentesis) {
    errores.push(errorParentesis);
  }

  // Validar caracteres permitidos
  const errorCaracteres = validateCharacters(formula);
  if (errorCaracteres) {
    errores.push(errorCaracteres);
  }

  return errores;
};

const validateParentheses = (formula: string): string | null => {
  let parentesisBalance = 0;
  for (const char of formula) {
    if (char === '(') parentesisBalance++;
    if (char === ')') parentesisBalance--;
    if (parentesisBalance < 0) {
      return 'Paréntesis no balanceados';
    }
  }
  if (parentesisBalance !== 0) {
    return 'Paréntesis no balanceados';
  }
  return null;
};

const validateCharacters = (formula: string): string | null => {
  const caracteresPermitidos = /^[A-Za-z0-9_+\-*/().>, <>=!&|%\s]+$/;
  if (!caracteresPermitidos.test(formula)) {
    return 'La fórmula contiene caracteres no permitidos';
  }
  return null;
};