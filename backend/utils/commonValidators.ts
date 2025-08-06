import { Model, Document } from 'mongoose';

/**
 * Validadores comunes reutilizables para todo el sistema
 */

/**
 * Valida que un campo sea único en la base de datos
 */
export async function validateUnique<T extends Document>(
  model: Model<T>,
  field: string,
  value: any,
  excludeId?: string,
  additionalFilter?: Record<string, any>
): Promise<boolean> {
  const query: any = { [field]: value };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  if (additionalFilter) {
    Object.assign(query, additionalFilter);
  }
  
  const exists = await model.findOne(query).lean();
  return !exists;
}

/**
 * Valida que una combinación de campos sea única
 */
export async function validateUniqueComposite<T extends Document>(
  model: Model<T>,
  fields: Record<string, any>,
  excludeId?: string
): Promise<boolean> {
  const query: any = { ...fields };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const exists = await model.findOne(query).lean();
  return !exists;
}

/**
 * Valida formato de CUIT/CUIL argentino
 */
export function validateCUITCUIL(cuitCuil: string): boolean {
  // Remover guiones si existen
  const cleanCuit = cuitCuil.replace(/-/g, '');
  
  // Validar longitud y que sean solo números
  if (!/^\d{11}$/.test(cleanCuit)) {
    return false;
  }
  
  // Validar dígito verificador
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  
  for (let i = 0; i < 10; i++) {
    suma += parseInt(cleanCuit[i]) * multiplicadores[i];
  }
  
  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  
  return digitoVerificador === parseInt(cleanCuit[10]);
}

/**
 * Valida coordenadas geográficas
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Valida rangos de fechas (vigencia)
 */
export function validateDateRange(
  fechaDesde: Date,
  fechaHasta?: Date | null
): boolean {
  if (!fechaHasta) return true;
  return fechaDesde <= fechaHasta;
}

/**
 * Valida superposición de fechas para períodos de vigencia
 */
export async function validateNoDateOverlap<T extends Document>(
  model: Model<T>,
  fechaDesde: Date,
  fechaHasta: Date | null,
  filterFields: Record<string, any>,
  excludeId?: string
): Promise<boolean> {
  const query: any = {
    ...filterFields,
    $or: [
      // El nuevo período empieza dentro de uno existente
      {
        fechaDesde: { $lte: fechaDesde },
        $or: [
          { fechaHasta: null },
          { fechaHasta: { $gte: fechaDesde } }
        ]
      },
      // El nuevo período termina dentro de uno existente (si tiene fecha hasta)
      ...(fechaHasta ? [{
        fechaDesde: { $lte: fechaHasta },
        $or: [
          { fechaHasta: null },
          { fechaHasta: { $gte: fechaHasta } }
        ]
      }] : []),
      // Un período existente está completamente dentro del nuevo
      {
        fechaDesde: { $gte: fechaDesde },
        ...(fechaHasta ? { fechaDesde: { $lte: fechaHasta } } : {})
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlap = await model.findOne(query).lean();
  return !overlap;
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de teléfono argentino
 */
export function validatePhoneNumber(phone: string): boolean {
  // Acepta formatos: +54 11 1234-5678, 011-1234-5678, 11-1234-5678, etc.
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  return /^\d{8,15}$/.test(cleanPhone);
}

/**
 * Valida que un valor esté dentro de un enum
 */
export function validateEnum<T>(value: T, enumValues: T[]): boolean {
  return enumValues.includes(value);
}

/**
 * Valida longitud de string
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number
): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Valida que un valor numérico esté dentro de un rango
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * Valida que una referencia a otra entidad exista
 */
export async function validateReference<T extends Document>(
  model: Model<T>,
  id: string,
  additionalFilter?: Record<string, any>
): Promise<boolean> {
  const query: any = { _id: id };
  
  if (additionalFilter) {
    Object.assign(query, additionalFilter);
  }
  
  const exists = await model.findOne(query).lean();
  return !!exists;
}

/**
 * Valida múltiples referencias
 */
export async function validateReferences<T extends Document>(
  model: Model<T>,
  ids: string[],
  additionalFilter?: Record<string, any>
): Promise<boolean> {
  const query: any = { _id: { $in: ids } };
  
  if (additionalFilter) {
    Object.assign(query, additionalFilter);
  }
  
  const count = await model.countDocuments(query);
  return count === ids.length;
}