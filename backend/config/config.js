require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: '1h',
  allowedOrigins: ['http://localhost:3000'],
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de solicitudes por ventana
  }
};
