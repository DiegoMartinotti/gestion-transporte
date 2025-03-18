/**
 * Formatea un valor numérico como moneda
 * @param {number} value - Valor a formatear
 * @param {string} locale - Configuración regional (por defecto es-ES)
 * @param {string} currency - Moneda (por defecto EUR)
 * @returns {string} - Valor formateado
 */
export const formatCurrency = (value, locale = 'es-ES', currency = 'EUR') => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Configuración regional (por defecto es-ES)
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, locale = 'es-ES') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Fecha inválida';
  
  return dateObj.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha y hora en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Configuración regional (por defecto es-ES)
 * @returns {string} - Fecha y hora formateada
 */
export const formatDateTime = (date, locale = 'es-ES') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Fecha inválida';
  
  return dateObj.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea un número con separador de miles y decimales
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 2)
 * @param {string} locale - Configuración regional (por defecto es-ES)
 * @returns {string} - Número formateado
 */
export const formatNumber = (value, decimals = 2, locale = 'es-ES') => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Trunca un texto si excede una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima (por defecto 50)
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}; 