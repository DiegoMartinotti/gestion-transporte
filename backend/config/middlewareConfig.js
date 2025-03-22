/**
 * Configuración centralizada de middlewares para la aplicación
 * Este módulo configura todos los middlewares globales usados en la aplicación
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('../utils/logger');
const { notFoundHandler, errorHandler } = require('../middleware/errorHandler');

/**
 * Configura todos los middlewares globales para la aplicación Express
 * @param {express.Application} app - Instancia de la aplicación Express
 * @param {Object} config - Configuración de la aplicación
 */
function configureMiddlewares(app, config) {
  // CORS Configuration
  const corsOptions = {
    origin: config.allowedOrigins || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Origin']
  };

  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        logger.error('Error al analizar JSON en verify:', e);
        throw new Error('JSON inválido');
      }
    }
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 50000
  }));

  app.use(cookieParser());

  // Security headers
  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Request logging middleware
  configureRequestLogging(app);
}

/**
 * Configura el middleware de logging para las peticiones HTTP
 * @param {express.Application} app - Instancia de la aplicación Express
 */
function configureRequestLogging(app) {
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Loguear información básica de la solicitud
    const requestInfo = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    logger.debug('Nueva solicitud recibida:', requestInfo);
    
    // En entorno de desarrollo, loguear también body y headers
    if (process.env.NODE_ENV === 'development') {
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        logger.debug('Body:', req.body);
      }
    }
    
    // Añadir listener para cuando se complete la respuesta
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const logInfo = {
        ...requestInfo,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`
      };
      
      // Loguear según el código de estado
      if (res.statusCode >= 500) {
        logger.error('Respuesta con error del servidor:', logInfo);
      } else if (res.statusCode >= 400) {
        logger.warn('Respuesta con error del cliente:', logInfo);
      } else {
        logger.debug('Respuesta exitosa:', logInfo);
      }
    });
    
    next();
  });
}

/**
 * Configura los middlewares de manejo de errores
 * @param {express.Application} app - Instancia de la aplicación Express
 */
function configureErrorHandling(app) {
  // Middleware para rutas no encontradas (404)
  app.use(notFoundHandler);
  
  // Middleware para manejo de errores generales
  app.use(errorHandler);
  
  // Middleware específico para errores de parsing JSON
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      logger.error(`Error al analizar JSON: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: 'JSON inválido',
        error: err.message
      });
    }
    next(err);
  });
}

module.exports = {
  configureMiddlewares,
  configureErrorHandling
}; 