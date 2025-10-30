/**
 * Interface base con index signature para entidades
 * Solución para TS2345 (no index signature) en operaciones genéricas
 */

/**
 * Entity base con index signature
 */
export interface IndexableEntity {
  _id?: string;
  [key: string]: unknown;
}

/**
 * Helper para convertir cualquier objeto a IndexableEntity
 */
export const toIndexable = <T extends Record<string, unknown>>(obj: T): T & IndexableEntity => {
  return obj as T & IndexableEntity;
};

/**
 * Helper para array de IndexableEntity
 */
export const toIndexableArray = <T extends Record<string, unknown>>(
  arr: T[]
): (T & IndexableEntity)[] => {
  return arr as (T & IndexableEntity)[];
};

/**
 * Type guard para verificar si un objeto tiene index signature
 */
export const isIndexable = (obj: unknown): obj is IndexableEntity => {
  return typeof obj === 'object' && obj !== null;
};
