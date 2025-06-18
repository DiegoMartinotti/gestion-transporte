import express from 'express';
import Site from '../../models/Site';
import logger from '../../utils/logger';
import { tryCatch } from '../../utils/errorHandler';

interface SiteData {
  site: string;
  cliente: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigo?: string;
  coordenadas?: {
    lng: number;
    lat: number;
  };
}

interface BulkCreateBody {
  sites: SiteData[];
}

interface BulkResults {
  exitosos: number;
  errores: Array<{
    site: string;
    error: string;
  }>;
}

/**
 * Bulk create sites
 * @route POST /api/site/bulk
 * @param {Array} req.body.sites - Array of sites to create
 * @returns {object} Results of operation
 */
const bulkCreateSites = tryCatch(async (req: express.Request, res: express.Response) => {
    const { sites }: BulkCreateBody = req.body;
    logger.debug('Recibidos sites para importación:', sites.length);

    const resultados: BulkResults = {
        exitosos: 0,
        errores: []
    };

    for (let siteData of sites) {
        try {
            // Convertir coordenadas al formato GeoJSON
            const location = siteData.coordenadas ? {
                type: 'Point' as const,
                coordinates: [
                    parseFloat(String(siteData.coordenadas.lng)),
                    parseFloat(String(siteData.coordenadas.lat))
                ] as [number, number]
            } : undefined;

            const nuevoSite = new Site({
                nombre: siteData.site,
                cliente: siteData.cliente,
                direccion: siteData.direccion || '-',
                localidad: siteData.localidad || '',
                provincia: siteData.provincia || '',
                codigo: siteData.codigo || '',
                location
            });

            await nuevoSite.save();
            resultados.exitosos++;
        } catch (error: any) {
            resultados.errores.push({
                site: siteData.site,
                error: error.code === 11000 ? 
                    'Site duplicado para este cliente' : 
                    error.message
            });
        }
    }

    logger.info(`Importación de sites completada: ${resultados.exitosos} creados, ${resultados.errores.length} errores`);
    
    res.json({
        success: true,
        mensaje: `Importación completada: ${resultados.exitosos} sites creados`,
        resultados
    });
});

export default bulkCreateSites;