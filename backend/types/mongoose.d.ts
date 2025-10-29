/**
 * Tipos helper para Mongoose con mejor inferencia de tipos
 */
import { Document, Types } from 'mongoose';

/**
 * Documento poblado con mejor tipado
 */
export type PopulatedDoc<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] extends Types.ObjectId
    ? Document & { _id: Types.ObjectId }
    : T[P] extends Types.ObjectId[]
      ? (Document & { _id: Types.ObjectId })[]
      : T[P];
};

/**
 * Filtro de query MongoDB tipado
 */
export type MongoFilter<T> = {
  [K in keyof T]?:
    | T[K]
    | { $regex: string | RegExp; $options?: string }
    | { $in: T[K][] }
    | { $gte?: T[K]; $lte?: T[K] };
} & {
  $or?: Array<Partial<MongoFilter<T>>>;
  $and?: Array<Partial<MongoFilter<T>>>;
};

/**
 * Tipo para cliente poblado en Site
 */
export interface PopulatedCliente {
  _id: Types.ObjectId;
  nombre: string;
  cuit?: string;
}

/**
 * Tipo para site poblado
 */
export interface ISitePopulated {
  _id: Types.ObjectId;
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  cliente: PopulatedCliente;
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
}

/**
 * Tipo para importación de ExcelJS
 */
export interface ExcelJSWorkbook {
  addWorksheet(name: string): ExcelJSWorksheet;
  xlsx: {
    writeBuffer(): Promise<Buffer>;
  };
}

export interface ExcelJSWorksheet {
  columns: Array<{ header: string; key: string; width?: number }>;
  addRow(row: Record<string, unknown>): void;
  getRow(rowNumber: number): ExcelJSRow;
  eachRow(callback: (row: ExcelJSRow, rowNumber: number) => void): void;
}

export interface ExcelJSRow {
  font?: { bold?: boolean; size?: number };
  fill?: {
    type: string;
    pattern: string;
    fgColor: { argb: string };
  };
  getCell(column: number | string): ExcelJSCell;
  values: unknown[];
}

export interface ExcelJSCell {
  value: unknown;
  font?: { bold?: boolean };
  fill?: unknown;
}
