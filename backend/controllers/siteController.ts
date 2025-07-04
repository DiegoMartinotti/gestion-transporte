import { Request, Response } from 'express';
import Site, { ISite } from '../models/Site';
import { tryCatch } from '../utils/errorHandler';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { ExcelTemplateService } from '../services/excelTemplateService';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
    id: string;
    email: string;
    roles?: string[];
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
}

/**
 * Interface for site data from frontend
 */
interface SiteFormattedData {
    _id: string;
    nombre: string;
    tipo: string;
    codigo: string;
    direccion: string;
    localidad: string;
    provincia: string;
    coordenadas: {
        lng: number;
        lat: number;
    } | null;
}

/**
 * Interface for bulk import site data
 */
interface SiteBulkData {
    site: string;
    codigo?: string;
    cliente: string;
    direccion?: string;
    localidad?: string;
    provincia?: string;
    coordenadas?: {
        lng: number;
        lat: number;
    };
}

/**
 * Interface for bulk import results
 */
interface BulkImportResult {
    mensaje: string;
    resultados: {
        exitosos: number;
        errores: Array<{
            site: string;
            error: string;
        }>;
    };
}

/**
 * Get sites by client
 * @route GET /api/sites
 * @param cliente - Client name
 * @returns List of sites
 */
export const getSites = tryCatch(async (req: AuthenticatedRequest, res: Response<ApiResponse<any[]>>): Promise<void> => {
    const { cliente } = req.query;
    
    // Construir el filtro: si se proporciona cliente, filtra por él; si no, obtiene todos
    const filter = cliente && typeof cliente === 'string' ? { cliente: cliente } : {};

    const sites = await Site.find(filter)
        .populate('cliente', 'nombre')
        .lean()
        .exec();

    // Filtrar sites válidos y mapear los campos para que coincidan con la interfaz Site del frontend
    const sitesFormateados = sites
        .filter(site => site && site._id) // Filtrar elementos null/undefined
        .map(site => ({
            _id: site._id.toString(),
            nombre: site.nombre || '',
            codigo: site.codigo || '',
            direccion: site.direccion || '',
            localidad: site.localidad || '',
            provincia: site.provincia || '',
            cliente: site.cliente, // Ya viene populated con {_id, nombre}
            coordenadas: site.location && Array.isArray(site.location.coordinates)
                ? { lng: site.location.coordinates[0], lat: site.location.coordinates[1] }
                : null,
            createdAt: site.createdAt,
            updatedAt: site.updatedAt
        }));

    logger.debug('Sites procesados:', sitesFormateados);

    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
});

export const createSite = async (req: AuthenticatedRequest, res: Response<ISite | ApiResponse>): Promise<void> => {
    try {
        const nuevoSite = new Site({
            nombre: req.body.site,
            cliente: req.body.cliente,
            direccion: req.body.direccion || '-',
            localidad: req.body.localidad || '',
            provincia: req.body.provincia || '',
            location: req.body.location || null
        });

        await nuevoSite.save();
        res.status(201).json(nuevoSite);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ 
                success: false,
                message: 'Ya existe un site con este nombre para este cliente'
            });
            return;
        }
        logger.error('Error al crear site:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSite = async (req: AuthenticatedRequest, res: Response<ISite | ApiResponse>): Promise<void> => {
    try {
        const site = await Site.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!site) {
            res.status(404).json({ success: false, message: 'Site no encontrado' });
            return;
        }
        res.json(site);
    } catch (error) {
        logger.error('Error al actualizar site:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar site' });
    }
};

export const deleteSite = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
        const site = await Site.findByIdAndDelete(req.params.id);
        if (!site) {
            res.status(404).json({ success: false, message: 'Site no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Site eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar site:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar site' });
    }
};

export const bulkCreateSites = async (req: AuthenticatedRequest, res: Response<BulkImportResult | ApiResponse>): Promise<void> => {
    try {
        const { sites }: { sites: SiteBulkData[] } = req.body;
        logger.debug('Recibidos sites para importación:', sites.length);

        const resultados = {
            exitosos: 0,
            errores: [] as Array<{ site: string; error: string }>
        };

        for (let siteData of sites) {
            try {
                // Convertir coordenadas al formato GeoJSON
                const location = siteData.coordenadas ? {
                    type: 'Point' as const,
                    coordinates: [
                        parseFloat(siteData.coordenadas.lng.toString()),
                        parseFloat(siteData.coordenadas.lat.toString())
                    ]
                } : null;

                const nuevoSite = new Site({
                    nombre: siteData.site,
                    codigo: siteData.codigo || '',
                    cliente: siteData.cliente,
                    direccion: siteData.direccion || '-',
                    localidad: siteData.localidad || '',
                    provincia: siteData.provincia || '',
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

        res.json({
            mensaje: `Importación completada: ${resultados.exitosos} sites creados`,
            resultados
        });
    } catch (error) {
        logger.error('Error en importación masiva:', error);
        res.status(500).json({ success: false, message: 'Error en la importación masiva' });
    }
};

export const searchNearby = async (req: AuthenticatedRequest, res: Response<ISite[] | ApiResponse>): Promise<void> => {
    try {
        const { lng, lat, maxDistance = '5000' } = req.query;

        if (!lng || !lat || typeof lng !== 'string' || typeof lat !== 'string') {
            res.status(400).json({ success: false, message: 'lng y lat son requeridos' });
            return;
        }

        const sites = await Site.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(maxDistance.toString())
                }
            }
        });

        res.json(sites);
    } catch (error) {
        logger.error('Error en búsqueda por proximidad:', error);
        res.status(500).json({ success: false, message: 'Error en la búsqueda' });
    }
};

/**
 * Descargar plantilla Excel para sites
 */
export const getSiteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateSiteTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de sites:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};