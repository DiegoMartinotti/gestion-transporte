const axios = require('axios');

exports.geocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        console.log('Geocoding request for:', { lat, lng });

        if (!lat || !lng) {
            return res.status(400).json({ 
                message: 'Lat y lng son requeridos',
                received: { lat, lng }
            });
        }

        const url = 'https://nominatim.openstreetmap.org/reverse';
        console.log('Requesting:', url);

        const response = await axios.get(url, {
            params: {
                lat,
                lon: lng,
                format: 'json',
                'accept-language': 'es'
            },
            headers: {
                'User-Agent': 'SitesManagerApp/1.0'
            },
            timeout: 5000 // 5 segundos timeout
        });

        console.log('Nominatim response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Geocoding error details:', {
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
