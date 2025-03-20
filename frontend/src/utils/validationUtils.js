/**
 * @module utils/validationUtils
 * @description Utilidades de validación reutilizables para la importación de datos mediante Excel
 */

/**
 * Valida que un campo sea requerido
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isRequired = (value, fieldName, rowIndex) => {
  if (value === undefined || value === null || value === '') {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} es requerido`;
  }
  return null;
};

/**
 * Valida que un valor sea un número
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} options - Opciones adicionales de validación
 * @param {number} [options.min] - Valor mínimo permitido
 * @param {number} [options.max] - Valor máximo permitido
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isNumber = (value, fieldName, rowIndex, { min, max, allowEmpty = false } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser un número válido`;
  }

  if (min !== undefined && num < min) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser mayor o igual a ${min}`;
  }

  if (max !== undefined && num > max) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser menor o igual a ${max}`;
  }

  return null;
};

/**
 * Valida que un valor sea una fecha válida en formato DD/MM/YYYY
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} options - Opciones adicionales de validación
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @param {Date} [options.minDate] - Fecha mínima permitida
 * @param {Date} [options.maxDate] - Fecha máxima permitida
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isDate = (value, fieldName, rowIndex, { allowEmpty = false, minDate, maxDate } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  if (!dateRegex.test(value)) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe tener formato DD/MM/AAAA`;
  }

  const [_, day, month, year] = value.match(dateRegex);
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Verificar que la fecha sea válida (evitar 31/02/2023 por ejemplo)
  if (
    date.getFullYear() !== parseInt(year) ||
    date.getMonth() !== parseInt(month) - 1 ||
    date.getDate() !== parseInt(day)
  ) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} contiene una fecha inválida`;
  }

  if (minDate && date < minDate) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser posterior a ${minDate.toLocaleDateString('es-AR')}`;
  }

  if (maxDate && date > maxDate) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser anterior a ${maxDate.toLocaleDateString('es-AR')}`;
  }

  return null;
};

/**
 * Valida que un valor esté dentro de un conjunto de opciones válidas
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Array} validOptions - Opciones válidas
 * @param {Object} options - Opciones adicionales de validación
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @param {boolean} [options.caseInsensitive=false] - Indica si la comparación ignora mayúsculas/minúsculas
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isValidOption = (value, fieldName, rowIndex, validOptions, { allowEmpty = false, caseInsensitive = false } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  let isValid = false;
  if (caseInsensitive && typeof value === 'string') {
    isValid = validOptions.some(option => 
      typeof option === 'string' && option.toLowerCase() === value.toLowerCase()
    );
  } else {
    isValid = validOptions.includes(value);
  }

  if (!isValid) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser uno de los siguientes valores: ${validOptions.join(', ')}`;
  }

  return null;
};

/**
 * Valida un correo electrónico
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} options - Opciones adicionales de validación
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isEmail = (value, fieldName, rowIndex, { allowEmpty = false } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser un correo electrónico válido`;
  }

  return null;
};

/**
 * Valida un CUIT argentino en formato XX-XXXXXXXX-X
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} options - Opciones adicionales de validación 
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isCUIT = (value, fieldName, rowIndex, { allowEmpty = false } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!cuitRegex.test(value)) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe tener formato XX-XXXXXXXX-X`;
  }

  // Validación del dígito verificador
  const cuitDigits = value.replace(/-/g, '');
  
  if (cuitDigits.length !== 11) {
    return `Fila ${rowIndex + 1}: El CUIT debe tener 11 dígitos`;
  }

  let acumulado = 0;
  let digitos = cuitDigits.split('');
  let digito = parseInt(digitos.pop());

  for (let i = 0; i < digitos.length; i++) {
    acumulado += digitos[9 - i] * (2 + (i % 6));
  }

  let verif = 11 - (acumulado % 11);
  if (verif === 11) {
    verif = 0;
  }

  if (digito !== verif) {
    return `Fila ${rowIndex + 1}: El dígito verificador del CUIT es incorrecto`;
  }

  return null;
};

/**
 * Valida un DNI argentino (7-8 dígitos)
 * @param {string|number} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} options - Opciones adicionales de validación
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isDNI = (value, fieldName, rowIndex, { allowEmpty = false } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  const dniRegex = /^\d{7,8}$/;
  if (!dniRegex.test(value.toString())) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe tener 7 u 8 dígitos numéricos`;
  }

  return null;
};

/**
 * Valida que un valor booleano representado como texto sea válido
 * Valores válidos: SI/NO, TRUE/FALSE, 1/0
 * @param {string|number|boolean} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} options - Opciones adicionales de validación
 * @param {boolean} [options.allowEmpty=false] - Indica si se permite un valor vacío
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const isBooleanText = (value, fieldName, rowIndex, { allowEmpty = false } = {}) => {
  if ((value === undefined || value === null || value === '') && allowEmpty) {
    return null;
  }

  const stringValue = value.toString().toUpperCase();
  const validValues = ['SI', 'NO', 'TRUE', 'FALSE', '1', '0'];

  if (!validValues.includes(stringValue)) {
    return `Fila ${rowIndex + 1}: El campo ${fieldName} debe ser uno de los siguientes valores: SI, NO, TRUE, FALSE, 1, 0`;
  }

  return null;
};

/**
 * Convierte un valor booleano en texto a un booleano real
 * @param {string|number|boolean} value - Valor a convertir
 * @returns {boolean} Valor booleano
 */
export const parseBooleanText = (value) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  const stringValue = value.toString().toUpperCase();
  return ['SI', 'TRUE', '1', true, 1].includes(stringValue);
};

/**
 * Valida múltiples condiciones y devuelve todos los errores encontrados
 * @param {Array<Function>} validations - Array de funciones de validación a ejecutar
 * @returns {Array<string>} Array de mensajes de error
 */
export const validateAll = (validations) => {
  const errors = [];
  
  for (const validation of validations) {
    const error = validation();
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
};

/**
 * Valida un objeto usando un esquema de validación
 * @param {Object} row - El objeto a validar
 * @param {number} rowIndex - Índice de la fila (base 0)
 * @param {Object} schema - Esquema de validación
 * @returns {Array<string>} Array de mensajes de error
 */
export const validateSchema = (row, rowIndex, schema) => {
  const errors = [];
  
  for (const field in schema) {
    if (schema.hasOwnProperty(field)) {
      const fieldDef = schema[field];
      const value = row[field];
      const fieldName = fieldDef.label || field;
      
      // Aplicar validaciones definidas en el esquema
      for (const validator of fieldDef.validators || []) {
        const error = validator(value, fieldName, rowIndex, fieldDef.options || {});
        if (error) {
          errors.push(error);
          break; // No seguir validando este campo si ya hay un error
        }
      }
    }
  }
  
  return errors;
};

/**
 * Parsea una fecha en formato DD/MM/AAAA
 * @param {string} dateString - Fecha en formato DD/MM/AAAA
 * @returns {Date|null} Objeto Date o null si la fecha es inválida
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  if (!dateRegex.test(dateString)) return null;
  
  const [_, day, month, year] = dateString.match(dateRegex);
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Verificar que la fecha sea válida
  if (
    date.getFullYear() !== parseInt(year) ||
    date.getMonth() !== parseInt(month) - 1 ||
    date.getDate() !== parseInt(day)
  ) {
    return null;
  }
  
  return date;
};

export default {
  isRequired,
  isNumber,
  isDate,
  isValidOption,
  isEmail,
  isCUIT,
  isDNI,
  isBooleanText,
  parseBooleanText,
  validateAll,
  validateSchema,
  parseDate
}; 