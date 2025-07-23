import express from 'express';
import Site from '../../models/Site';
import { tryCatch } from '../../utils/errorHandler';
import { ValidationError } from '../../utils/errors';

/**
 * Obtiene un sitio por su ID
 */
const getSiteById = tryCatch(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ValidationError('ID de sitio requerido');
  }
  
  const site = await Site.findById(id).lean().exec();
  
  if (!site) {
    return res.status(404).json({
      success: false,
      message: 'Sitio no encontrado'
    });
  }
  
  // Formatear coordenadas
  const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
    lng: site.location.coordinates[0],
    lat: site.location.coordinates[1]
  } : null;
  
  const siteFormateado = {
    ...site,
    coordenadas
  };
  
  return res.json({
    success: true,
    data: siteFormateado
  });
});

export default getSiteById;