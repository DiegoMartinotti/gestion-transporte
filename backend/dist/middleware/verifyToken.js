import jwt from 'jsonwebtoken';
import config from '../config/config';
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"
    if (!token) {
        res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
        return;
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // Guarda la información del token (por ejemplo, el id del usuario)
        next();
    }
    catch (error) {
        res.status(403).json({ error: 'Token inválido' });
    }
}
export default verifyToken;
//# sourceMappingURL=verifyToken.js.map