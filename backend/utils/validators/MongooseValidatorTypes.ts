/**
 * Tipos correctos para validadores Mongoose
 * Solución para TS2322 en validadores custom
 */

import { Document } from 'mongoose';

/**
 * Función validadora asíncrona tipada correctamente
 */
export type AsyncValidator<T = unknown> = (value: T) => Promise<boolean>;

/**
 * Función validadora síncrona tipada correctamente
 */
export type SyncValidator<T = unknown> = (value: T) => boolean;

/**
 * Configuración de validador Mongoose
 */
export interface ValidatorConfig<T = unknown> {
  validator: AsyncValidator<T> | SyncValidator<T>;
  message: string | ((props: { value: T }) => string);
}

/**
 * Helper para crear validador asíncrono tipado
 */
export const createAsyncValidator = <T = unknown>(
  validatorFn: AsyncValidator<T>,
  message: string | ((props: { value: T }) => string)
): ValidatorConfig<T> => ({
  validator: validatorFn,
  message,
});

/**
 * Helper para crear validador síncrono tipado
 */
export const createSyncValidator = <T = unknown>(
  validatorFn: SyncValidator<T>,
  message: string | ((props: { value: T }) => string)
): ValidatorConfig<T> => ({
  validator: validatorFn,
  message,
});

/**
 * Validador para unicidad (común en Mongoose)
 */
export const createUniquenessValidator = <TDoc extends Document>(
  model: typeof Document & { findOne: (filter: Record<string, unknown>) => Promise<TDoc | null> },
  field: string,
  message = `El ${field} ya existe`
): ValidatorConfig<string> => {
  return createAsyncValidator<string>(async function (this: TDoc, value: string): Promise<boolean> {
    const found = await model.findOne({ [field]: value });
    if (!found) return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return String((found as any)._id) === String((this as any)._id);
  }, message);
};
