/**
 * Configuración de índices recomendados para MongoDB
 * Ejecutar estos índices mejorará significativamente el rendimiento de las consultas
 */

import mongoose from 'mongoose';

export interface IndexDefinition {
  collection: string;
  index: Record<string, 1 | -1 | 'text' | '2dsphere'>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
    name?: string;
    expireAfterSeconds?: number;
  };
  description: string;
}

export const recommendedIndexes: IndexDefinition[] = [
  // ========== CLIENTES ==========
  {
    collection: 'clientes',
    index: { nombre: 1 },
    options: { unique: true },
    description: 'Índice único para búsquedas por nombre de cliente',
  },
  {
    collection: 'clientes',
    index: { cuit: 1 },
    options: { unique: true, sparse: true },
    description: 'Índice único para búsquedas por CUIT',
  },
  {
    collection: 'clientes',
    index: { activo: 1, nombre: 1 },
    description: 'Índice compuesto para filtrar clientes activos ordenados por nombre',
  },
  {
    collection: 'clientes',
    index: { nombre: 'text', direccion: 'text' },
    description: 'Índice de texto para búsquedas full-text en clientes',
  },

  // ========== SITES ==========
  {
    collection: 'sites',
    index: { cliente: 1, activo: 1 },
    description: 'Índice compuesto para búsquedas de sites por cliente',
  },
  {
    collection: 'sites',
    index: { nombre: 1, cliente: 1 },
    description: 'Índice compuesto para búsquedas de sites por nombre y cliente',
  },
  {
    collection: 'sites',
    index: { 'coordenadas.lat': 1, 'coordenadas.lng': 1 },
    description: 'Índice para búsquedas por coordenadas',
  },
  {
    collection: 'sites',
    index: { coordenadas: '2dsphere' },
    options: { sparse: true },
    description: 'Índice geoespacial para búsquedas de proximidad',
  },

  // ========== TRAMOS ==========
  {
    collection: 'tramos',
    index: { cliente: 1, activo: 1 },
    description: 'Índice para búsquedas de tramos por cliente',
  },
  {
    collection: 'tramos',
    index: { origen: 1, destino: 1, cliente: 1 },
    options: { unique: true },
    description: 'Índice único para evitar tramos duplicados',
  },
  {
    collection: 'tramos',
    index: { tarifaActual: 1 },
    description: 'Índice para búsquedas por tarifa actual',
  },
  {
    collection: 'tramos',
    index: { fechaDesde: -1, fechaHasta: -1 },
    description: 'Índice para búsquedas por rangos de fechas de vigencia',
  },

  // ========== VIAJES ==========
  {
    collection: 'viajes',
    index: { fecha: -1 },
    description: 'Índice para ordenamiento por fecha descendente',
  },
  {
    collection: 'viajes',
    index: { tramo: 1, fecha: -1 },
    description: 'Índice compuesto para búsquedas de viajes por tramo',
  },
  {
    collection: 'viajes',
    index: { estado: 1, fecha: -1 },
    description: 'Índice para filtrar viajes por estado',
  },
  {
    collection: 'viajes',
    index: { 'vehiculos.vehiculo': 1 },
    description: 'Índice para búsquedas de viajes por vehículo',
  },
  {
    collection: 'viajes',
    index: { numeroViaje: 1 },
    options: { unique: true, sparse: true },
    description: 'Índice único para número de viaje',
  },

  // ========== VEHICULOS ==========
  {
    collection: 'vehiculos',
    index: { patente: 1 },
    options: { unique: true },
    description: 'Índice único para búsquedas por patente',
  },
  {
    collection: 'vehiculos',
    index: { activo: 1, tipo: 1 },
    description: 'Índice para filtrar vehículos activos por tipo',
  },
  {
    collection: 'vehiculos',
    index: { empresa: 1, activo: 1 },
    description: 'Índice para búsquedas de vehículos por empresa',
  },

  // ========== PERSONAL ==========
  {
    collection: 'personals',
    index: { cuil: 1 },
    options: { unique: true },
    description: 'Índice único para búsquedas por CUIL',
  },
  {
    collection: 'personals',
    index: { empresa: 1, activo: 1 },
    description: 'Índice para búsquedas de personal por empresa',
  },
  {
    collection: 'personals',
    index: { tipo: 1, activo: 1 },
    description: 'Índice para filtrar personal por tipo',
  },
  {
    collection: 'personals',
    index: { nombre: 'text', apellido: 'text' },
    description: 'Índice de texto para búsquedas de personal',
  },

  // ========== EMPRESAS ==========
  {
    collection: 'empresas',
    index: { nombre: 1 },
    options: { unique: true },
    description: 'Índice único para búsquedas por nombre de empresa',
  },
  {
    collection: 'empresas',
    index: { cuit: 1 },
    options: { unique: true },
    description: 'Índice único para búsquedas por CUIT de empresa',
  },
  {
    collection: 'empresas',
    index: { activo: 1 },
    description: 'Índice para filtrar empresas activas',
  },

  // ========== TARIFAS ==========
  {
    collection: 'tarifas',
    index: { tramo: 1, fechaDesde: -1 },
    description: 'Índice para búsquedas de tarifas por tramo y fecha',
  },
  {
    collection: 'tarifas',
    index: { vigente: 1, tramo: 1 },
    description: 'Índice para obtener tarifas vigentes por tramo',
  },

  // ========== EXTRAS ==========
  {
    collection: 'extras',
    index: { nombre: 1 },
    options: { unique: true },
    description: 'Índice único para búsquedas por nombre de extra',
  },
  {
    collection: 'extras',
    index: { activo: 1, tipo: 1 },
    description: 'Índice para filtrar extras activos por tipo',
  },
];

/**
 * Función para crear todos los índices recomendados
 */
const NO_CONNECTION_ERROR = 'No hay conexión a la base de datos';

export async function createIndexes(): Promise<void> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(NO_CONNECTION_ERROR);
  }

  console.log('🔧 Creando índices recomendados para MongoDB...');

  for (const indexDef of recommendedIndexes) {
    try {
      const collection = db.collection(indexDef.collection);

      // Verificar si el índice ya existe
      const existingIndexes = await collection.indexes();

      const indexExists = existingIndexes.some((idx) => {
        const keys = Object.keys(idx.key || {});
        const defKeys = Object.keys(indexDef.index);
        return keys.length === defKeys.length && keys.every((k) => defKeys.includes(k));
      });

      if (!indexExists) {
        await collection.createIndex(indexDef.index, {
          background: true,
          ...indexDef.options,
        });
        console.log(`✅ Índice creado en ${indexDef.collection}: ${indexDef.description}`);
      } else {
        console.log(`⏭️  Índice ya existe en ${indexDef.collection}: ${indexDef.description}`);
      }
    } catch (error) {
      console.error(`❌ Error creando índice en ${indexDef.collection}:`, error);
    }
  }

  console.log('✨ Proceso de creación de índices completado');
}

/**
 * Función para analizar el uso de índices en una colección
 */
export async function analyzeIndexUsage(collectionName: string): Promise<unknown[]> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(NO_CONNECTION_ERROR);
  }

  const collection = db.collection(collectionName);
  return await collection.aggregate([{ $indexStats: {} }]).toArray();
}

/**
 * Función para obtener el tamaño de los índices
 */
export async function getIndexSizes(): Promise<
  Record<string, { totalIndexSize: number; indexSizes: Record<string, number> }>
> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(NO_CONNECTION_ERROR);
  }

  const result: Record<string, { totalIndexSize: number; indexSizes: Record<string, number> }> = {};

  for (const indexDef of recommendedIndexes) {
    const stats = await db.command({ collStats: indexDef.collection });

    if (!result[indexDef.collection]) {
      result[indexDef.collection] = {
        totalIndexSize: stats.totalIndexSize,
        indexSizes: stats.indexSizes,
      };
    }
  }

  return result;
}
