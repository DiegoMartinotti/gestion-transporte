const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
    try {
        // Verificar la existencia del token en la cookie
        const token = req.cookies.token;
        
        if (!token) {
            logger.debug('Token no proporcionado en cookies');
            return res.status(401).json({ 
                message: 'No autorizado - Token no proporcionado' 
            });
        }
        
        // Verificar el token
        const jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, jwtSecret);
        logger.debug('Token decodificado:', decoded);
        
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = authMiddleware;
