import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import config from '../config/config';
const authMiddleware = (req, res, next) => {
    try {
        // Verificar la existencia del token en la cookie
        const token = req.cookies.token;
        if (!token) {
            logger.debug('Token no proporcionado en cookies');
            res.status(401).json({
                message: 'No autorizado - Token no proporcionado'
            });
            return;
        }
        // Verificar el token
        const jwtSecret = config.jwtSecret || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, jwtSecret);
        logger.debug('Token decodificado:', decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        logger.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};
export default authMiddleware;
//# sourceMappingURL=auth.js.map