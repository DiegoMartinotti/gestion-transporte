/**
 * @module controllers/tramo/verificarPosiblesDuplicados
 * @description Controlador para verificar duplicados potenciales en tramos
 */

import { Request, Response } from 'express';
import Tramo from '../../models/Tramo';
import {
  generarTramoId,
  fechasSuperpuestas,
  Tramo as TramoShape,
} from '../../utils/tramoValidator';
import logger from '../../utils/logger';

/**
 * Interface for API responses
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Interface for tramo duplicate verification
 */
interface DuplicateVerificationResult {
  tramosVerificados: number;
  tramosExistentes: number;
  posiblesDuplicados: Array<{
    tipo: 'superposición';
    nuevo: {
      origen?: string | object;
      destino?: string | object;
      tipo?: string;
      id: string;
    };
    existente: {
      _id?: string;
      origen?: string | object;
      destino?: string | object;
      tipo?: string;
      vigenciaDesde?: string | Date;
      vigenciaHasta?: string | Date;
    };
  }>;
  mapaIds: Record<string, number>;
}

type TramoPayload = TramoShape & {
  _id?: string;
  origenNombre?: string;
  destinoNombre?: string;
};

/**
 * Verifica duplicados potenciales en una lista de tramos
 *
 * @async
 * @function verificarPosiblesDuplicados
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Datos de verificación
 * @param {Array} req.body.tramos - Array de tramos a verificar
 * @param {string} req.body.cliente - ID del cliente
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Resultado de la verificación de duplicados
 * @throws {Error} Error 400 si faltan datos, 500 si hay error del servidor
 */
// eslint-disable-next-line complexity, max-lines-per-function
async function verificarPosiblesDuplicados(
  req: Request<
    object,
    ApiResponse<{ resultado: DuplicateVerificationResult }>,
    { tramos: TramoPayload[]; cliente: string }
  >,
  res: Response<ApiResponse<{ resultado: DuplicateVerificationResult }>>
): Promise<void> {
  try {
    const { tramos, cliente } = req.body;

    if (!Array.isArray(tramos) || !cliente) {
      res.status(400).json({
        success: false,
        message: 'Se requieren tramos y cliente',
      });
      return;
    }

    const tramosExistentes: TramoPayload[] =
      (await Tramo.find({ cliente }).lean<TramoPayload[]>().exec()) ?? [];

    const mapaExistentes: Record<string, TramoPayload[]> = {};
    tramosExistentes.forEach((tramo) => {
      const id = generarTramoId(tramo);
      if (!mapaExistentes[id]) {
        mapaExistentes[id] = [];
      }
      mapaExistentes[id].push(tramo);
    });

    const resultado: DuplicateVerificationResult = {
      tramosVerificados: tramos.length,
      tramosExistentes: tramosExistentes.length,
      posiblesDuplicados: [],
      mapaIds: {},
    };

    for (const tramoData of tramos) {
      const id = generarTramoId(tramoData);

      if (!resultado.mapaIds[id]) {
        resultado.mapaIds[id] = 0;
      }
      resultado.mapaIds[id]++;

      const tramosConMismoId = mapaExistentes[id] || [];

      for (const existente of tramosConMismoId) {
        const nuevoDesde = tramoData.vigenciaDesde;
        const nuevoHasta = tramoData.vigenciaHasta;
        const existenteDesde = existente.vigenciaDesde;
        const existenteHasta = existente.vigenciaHasta;

        if (
          nuevoDesde !== undefined &&
          nuevoHasta !== undefined &&
          existenteDesde !== undefined &&
          existenteHasta !== undefined &&
          fechasSuperpuestas(nuevoDesde, nuevoHasta, existenteDesde, existenteHasta)
        ) {
          resultado.posiblesDuplicados.push({
            tipo: 'superposición',
            nuevo: {
              origen: tramoData.origenNombre || tramoData.origen,
              destino: tramoData.destinoNombre || tramoData.destino,
              tipo: tramoData.tipo,
              id: id,
            },
            existente: {
              _id: existente._id,
              origen: existente.origen,
              destino: existente.destino,
              tipo: existente.tipo,
              vigenciaDesde: existente.vigenciaDesde,
              vigenciaHasta: existente.vigenciaHasta,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      data: { resultado },
    });
  } catch (error: unknown) {
    logger.error('Error al verificar duplicados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar duplicados',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export default verificarPosiblesDuplicados;
