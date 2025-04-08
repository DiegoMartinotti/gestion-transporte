const axios = require('axios');
const logger = require('../utils/logger');

exports.geocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        logger.debug('Geocoding request for:', { lat, lng });

        if (!lat || !lng) {
            return res.status(400).json({ 
                message: 'Lat y lng son requeridos',
                received: { lat, lng }
            });
        }

        // Validar que lat y lng sean números y estén en rango
        const numLat = parseFloat(lat);
        const numLng = parseFloat(lng);

        if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
            logger.warn('Coordenadas inválidas recibidas:', { lat, lng });
            return res.status(400).json({
                message: 'Latitud y longitud deben ser números válidos en sus rangos respectivos (-90 a 90 para lat, -180 a 180 para lng)',
                received: { lat, lng }
            });
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
    } catch (error) {
        logger.error('Geocoding error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            config: {
                url: error.config?.url,
                params: error.config?.params
            }
        });

        res.status(500).json({ 
            message: 'Error en geocodificación',
            error: error.message,
            details: error.response?.data
        });
    }
};
