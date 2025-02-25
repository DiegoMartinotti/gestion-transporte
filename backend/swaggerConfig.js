/************************************************************
 * CONFIGURACIÓN SWAGGER (swaggerConfig.js)
 * ---------------------------------------------------------
 * Esta configuración utiliza swagger-jsdoc para generar
 * la documentación interactiva de la API.
 ************************************************************/
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: { // <-- Nota: se usa "definition" en lugar de "swaggerDefinition"
    openapi: '3.0.0',
    info: {
      title: 'API de Viajes',
      version: '1.0.0',
      description: 'Documentación de la API de Viajes desarrollada con Express y MongoDB.',
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:3001',
        description: 'Servidor local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./index.js', './routes/*.js'], // Ajustá las rutas según dónde estén tus archivos con comentarios Swagger
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
module.exports = swaggerSpecs;
// FIN DE CONFIGURACIÓN SWAGGER (swaggerConfig.js)
