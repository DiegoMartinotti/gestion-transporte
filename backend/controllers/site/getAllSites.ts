import { Request, Response } from 'express';
import Site from '../../models/Site';
import { tryCatch } from '../../utils/errorHandler';
import logger from '../../utils/logger';

/**
 * Interface for query parameters
 */
interface GetSitesQuery {
    cliente?: string;
}

/**
 * Interface for formatted site response
 */
interface FormattedSite {
    _id: any;
    nombre: string;
    cliente: any;
    codigo?: string;
    direccion?: string;
    localidad?: string;
    provincia?: string;
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
    coordenadas?: {
        lng: number;
        lat: number;
    } | null;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Interface for API response
 */
interface ApiResponse {
    success: boolean;
    count?: number;
    data?: FormattedSite[];
    message?: string;
}

/**
 * Get all sites
 * @route GET /api/site
 * @param cliente - Client name (optional)
 * @returns List of sites
 */
const getAllSites = tryCatch(async (req: Request<{}, ApiResponse, {}, GetSitesQuery>, res: Response<ApiResponse>): Promise<void> => {
    const { cliente } = req.query;
    
    const query: any = {};
    
    if (cliente) {
        // Buscar por ID del cliente, no por nombre
        query.cliente = cliente;
    }

    const sites = await Site.find(query)
        .populate('cliente', 'nombre')
        .lean()
        .exec();

    const sitesFormateados: FormattedSite[] = sites.map((site: any) => {
        // Convertir coordenadas de GeoJSON a formato lat/lng
        const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
            lng: site.location.coordinates[0],
            lat: site.location.coordinates[1]
        } : null;

        return {
            ...site,
            coordenadas
        };
    });

    logger.debug('Sites procesados:', sitesFormateados.length);

    res.json({
        success: true,
        count: sitesFormateados.length,
        data: sitesFormateados
    });
});

export default getAllSites;