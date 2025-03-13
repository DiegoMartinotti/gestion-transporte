import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Configuración global de dayjs
dayjs.locale('es');

// Formato estándar para mostrar fechas en la aplicación
export const DATE_FORMAT = 'DD/MM/YYYY';

// Función para formatear fechas
export const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format(DATE_FORMAT);
};

// Función para formatear fechas desde ISO string
export const formatISODate = (isoString) => {
  if (!isoString) return '';
  return dayjs(isoString).format(DATE_FORMAT);
};

// Función para obtener la fecha actual formateada
export const getCurrentDate = () => {
  return dayjs().format(DATE_FORMAT);
};

// Función para validar si una fecha es válida
export const isValidDate = (date) => {
  return dayjs(date).isValid();
}; 