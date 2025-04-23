import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import config from '../config/config';

interface UserPayload {
  id: string;
  email: string;
  roles?: string[];
  [key: string]: any;
}

interface RequestWithUser extends Request {
  user?: UserPayload;
}

const authMiddleware = (req: RequestWithUser, res: Response, next: NextFunction): void => {
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
        const decoded = jwt.verify(token, jwtSecret as string) as UserPayload;
        logger.debug('Token decodificado:', decoded);
        
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

export default authMiddleware; 