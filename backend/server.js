/**
 * Servidor principal de la aplicación
 * Este archivo es el punto de entrada principal y configura todo el servidor Express
 * utilizando configuraciones modularizadas y centralizadas
 */

require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const validateEnv = require('./utils/validateEnv');
const config = require('./config/config');
const { configureMiddlewares, configureErrorHandling } = require('./config/middlewareConfig');
const { configureRoutes, getMainRoutes } = require('./config/routeConfig');

// Validar variables de entorno antes de iniciar la aplicación
validateEnv();

// Crear la aplicación Express
const app = express();

// Configurar middlewares y rutas utilizando los módulos centralizados
try {
  // Configurar middlewares (cors, json parser, cookie parser, seguridad, logging)
  configureMiddlewares(app, config);
  
  // Configurar todas las rutas de la aplicación
  configureRoutes(app);
  
  // Configurar manejadores de errores (siempre al final)
  configureErrorHandling(app);
  
  logger.debug('Aplicación Express configurada correctamente');
} catch (error) {
  logger.critical('Error al configurar la aplicación:', error);
  process.exit(1);
}

/**
 * Inicia el servidor y establece conexión con la base de datos
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    // Determinar el puerto a usar
    const port = process.env.PORT || config.port || 3001;
    
    // Conectar a la base de datos MongoDB
    await connectDB();
    logger.info('Conexión a la base de datos establecida correctamente');
    
    // Iniciar el servidor HTTP
    app.listen(port, () => {
      logger.info(`Servidor ejecutándose en http://localhost:${port}`);
      
      // Mostrar rutas principales disponibles
      logger.info('Rutas principales disponibles:');
      getMainRoutes().forEach(route => logger.info(`- ${route}`));
    });
  } catch (error) {
    logger.critical(`Error fatal al iniciar el servidor: ${error.message}`, error);
    process.exit(1);
  }
}

// Control de procesos y manejo de señales
process.on('SIGTERM', () => {
  logger.info('Señal SIGTERM recibida, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Señal SIGINT recibida, cerrando servidor...');
  process.exit(0);
});

// Si este archivo se ejecuta directamente (no importado por otro módulo)
if (require.main === module) {
  startServer();
}

// Exportar la app para poder usarla en tests y otros contextos
module.exports = app;
