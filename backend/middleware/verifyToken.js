const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Importar la configuración centralizada
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret); // Usar la clave secreta de la configuración
    req.user = decoded; // Guarda la información del token (por ejemplo, el id del usuario)
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

module.exports = verifyToken;
