const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Liquidaciones',
      version: '1.0.0',
      description: 'Documentación de la API de Liquidaciones',
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:3001',
        description: 'Servidor de desarrollo',
      },
    ],
  },
  apis: ['./routes/*.js'], // archivos que contienen anotaciones
};

module.exports = swaggerJsDoc(swaggerOptions);
