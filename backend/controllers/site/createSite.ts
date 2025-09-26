import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Site, { ISite } from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';

/**
 * Interface for create site request body
 */
interface CreateSiteRequest {
  nombre: string;
  cliente: Types.ObjectId;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigo?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
}

/**
 * Interface for API response
 */
interface ApiResponse {
  success: boolean;
  data?: ISite;
  message?: string;
}

/**
 * Create a new site
 * @route POST /api/site
 * @param req.body - Site data
 * @returns Created site
 */
const createSite = tryCatch(
  async (
    req: Request<Record<string, unknown>, ApiResponse, CreateSiteRequest>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const nuevoSite = new Site({
      nombre: req.body.nombre,
      cliente: req.body.cliente,
      direccion: req.body.direccion || '-',
      localidad: req.body.localidad || '',
      provincia: req.body.provincia || '',
      codigo: req.body.codigo || '',
      location: req.body.location || null,
    });

    await nuevoSite.save();

    logger.info(`Nuevo site creado: ${nuevoSite.nombre} para cliente ${nuevoSite.cliente}`);

    res.status(201).json({
      success: true,
      data: nuevoSite,
    });
  }
);

export default createSite;
