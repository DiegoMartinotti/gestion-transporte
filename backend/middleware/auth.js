const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        logger.debug('Auth header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.debug('Token no proporcionado o formato inválido');
            return res.status(401).json({ 
                message: 'No autorizado - Token no proporcionado o inválido' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('Token decodificado:', decoded);
        
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = authMiddleware;
