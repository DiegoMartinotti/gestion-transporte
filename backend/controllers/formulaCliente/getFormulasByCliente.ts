// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import FormulasPersonalizadasCliente, {
  IFormulasPersonalizadasCliente,
} from '../../models/FormulasPersonalizadasCliente';
import logger from '../../utils/logger';
import { FormulaQueryParams, ApiResponse } from './types';

export const getFormulasByCliente = async (
  req: Request<
    { clienteId: string },
    IFormulasPersonalizadasCliente[] | ApiResponse,
    Record<string, unknown>,
    FormulaQueryParams
  >,
  res: Response<IFormulasPersonalizadasCliente[] | ApiResponse>
): Promise<void> => {
  try {
    const { clienteId } = req.params;
    const { tipoUnidad, fecha } = req.query;

    if (!Types.ObjectId.isValid(clienteId)) {
      res.status(400).json({ message: 'ID de cliente inválido' });
      return;
    }

    const query: Record<string, unknown> = { clienteId: clienteId };
    if (tipoUnidad) {
      query.tipoUnidad = tipoUnidad;
    }
    if (fecha) {
      const fechaDate = new Date(fecha);
      query.vigenciaDesde = { $lte: fechaDate };
      query.$or = [{ vigenciaHasta: { $gte: fechaDate } }, { vigenciaHasta: null }];
    }

    const formulas = await FormulasPersonalizadasCliente.find(query).sort({
      tipoUnidad: 1,
      vigenciaDesde: -1,
    });

    logger.debug(
      `Encontradas ${formulas.length} fórmulas para cliente ${clienteId} con filtros:`,
      req.query
    );
    res.json(formulas);
  } catch (error: unknown) {
    logger.error(`Error al obtener fórmulas para cliente ${req.params.clienteId}:`, error);
    res
      .status(500)
      .json({
        message: 'Error interno al obtener fórmulas',
        error: error instanceof Error ? error.message : String(error),
      });
  }
};
