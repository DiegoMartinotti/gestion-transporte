/**
 * Helpers tipados para operaciones Mongoose
 * Solución para TS2769 (overload mismatch) en queries
 */

import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

/**
 * Wrapper tipado para findByIdAndUpdate
 */
export const updateById = async <T extends Document>(
  model: Model<T>,
  id: string,
  update: Partial<T> | UpdateQuery<T>,
  options?: QueryOptions
): Promise<T | null> => {
  return model.findByIdAndUpdate(id, update as UpdateQuery<T>, {
    new: true,
    runValidators: true,
    ...options,
  });
};

/**
 * Wrapper tipado para findOneAndUpdate
 */
export const updateOne = async <T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: Partial<T> | UpdateQuery<T>,
  options?: QueryOptions
): Promise<T | null> => {
  return model.findOneAndUpdate(filter, update as UpdateQuery<T>, {
    new: true,
    runValidators: true,
    ...options,
  });
};

/**
 * Wrapper tipado para updateMany
 */
export const updateMany = async <T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: Partial<T> | UpdateQuery<T>,
  options?: QueryOptions
): Promise<{ matchedCount: number; modifiedCount: number }> => {
  const result = await model.updateMany(filter, update as UpdateQuery<T>, {
    runValidators: true,
    ...options,
  });
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

/**
 * Wrapper tipado para create con validación
 */
export const createDocument = async <T extends Document>(
  model: Model<T>,
  data: Partial<T>
): Promise<T> => {
  const doc = new model(data);
  await doc.validate();
  return doc.save();
};

/**
 * Wrapper tipado para delete con soft delete opcional
 */
export const deleteById = async <T extends Document>(
  model: Model<T>,
  id: string,
  softDelete = false
): Promise<T | null> => {
  if (softDelete) {
    return model.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() } as UpdateQuery<T>,
      { new: true }
    );
  }
  return model.findByIdAndDelete(id);
};

/**
 * Helper para construir FilterQuery de forma segura
 */
export const buildFilter = <T extends Document>(
  conditions: Partial<Record<keyof T, unknown>>
): FilterQuery<T> => {
  return conditions as FilterQuery<T>;
};

/**
 * Helper para construir UpdateQuery de forma segura
 */
export const buildUpdate = <T extends Document>(update: Partial<T>): UpdateQuery<T> => {
  return { $set: update } as UpdateQuery<T>;
};
