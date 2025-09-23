import { Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

/**
 * Interface for geocoding query parameters
 */
interface GeocodingQuery {
    lat: string;
    lng: string;
}

export const geocode = async (req: Request<never, unknown, unknown, GeocodingQuery>, res: Response<unknown>): Promise<void> => {
    try {
        const { lat, lng } = req.query;
        
        logger.debug('Geocoding request for:', { lat, lng });

        if (!lat || !lng) {
            res.status(400).json({ 
                message: 'Lat y lng son requeridos',
                received: { lat, lng }
            });
            return;
        }

        // Validar que lat y lng sean números y estén en rango
        const numLat = parseFloat(lat);
        const numLng = parseFloat(lng);

        if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
            logger.warn('Coordenadas inválidas recibidas:', { lat, lng });
            res.status(400).json({
                message: 'Latitud y longitud deben ser números válidos en sus rangos respectivos (-90 a 90 para lat, -180 a 180 para lng)',
                received: { lat, lng }
            });
            return;
        }

        const url = 'https://nominatim.openstreetmap.org/reverse';
        logger.debug('Requesting:', url);

        const response = await axios.get(url, {
            params: {
                lat: numLat,
                lon: numLng,
                format: 'json',
                'accept-language': 'es'
            },
            headers: {
                'User-Agent': 'SitesManagerApp/1.0'
            },
            timeout: 5000 // 5 segundos timeout
        });

        logger.debug('Nominatim response:', response.data);
        res.json(response.data);
    } catch (error: unknown) {
        logger.error('Geocoding error details:', {
            message: (error instanceof Error ? error.message : String(error)),
            code: (error as { code?: string }).code,
            response: (error as { response?: { data?: unknown } }).response?.data,
            config: {
                url: (error as { config?: { url?: string } }).config?.url,
                params: (error as { config?: { params?: unknown } }).config?.params
            }
        });

        res.status(500).json({ 
            message: 'Error en geocodificación',
            error: (error instanceof Error ? error.message : String(error)),
            details: (error as { response?: { data?: unknown } }).response?.data
        });
    }
};