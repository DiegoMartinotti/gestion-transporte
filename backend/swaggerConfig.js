/************************************************************
 * CONFIGURACIÓN SWAGGER (swaggerConfig.js)
 * ---------------------------------------------------------
 * Esta configuración utiliza swagger-jsdoc para generar
 * la documentación interactiva de la API.
 ************************************************************/
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión de Viajes API',
      version: '1.0.0',
      description: 'API RESTful para la gestión de viajes, tramos, clientes y sitios.',
      contact: {
        name: 'Soporte Técnico',
        email: 'soporte@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:5000/api',
        description: 'Servidor de desarrollo'
      },
      {
        url: '{protocol}://{host}/api',
        description: 'Servidor dinámico',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          host: {
            default: 'localhost:5000'
          }
        }
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT precedido por la palabra Bearer'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Descripción del error'
                },
                code: {
                  type: 'string',
                  description: 'Código de error único'
                }
              }
            }
          }
        },
        Cliente: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID único del cliente' },
            nombre: { type: 'string', description: 'Nombre del cliente' },
            codigo: { type: 'string', description: 'Código único del cliente' },
            activo: { type: 'boolean', description: 'Estado del cliente' }
          }
        },
        Tramo: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            origen: { type: 'string', description: 'ID del sitio de origen' },
            destino: { type: 'string', description: 'ID del sitio de destino' },
            tipo: { 
              type: 'string',
              enum: ['TRMC', 'TMRI'],
              description: 'Tipo de tramo'
            },
            cliente: { type: 'string', description: 'ID del cliente' },
            vigenciaDesde: { type: 'string', format: 'date-time' },
            vigenciaHasta: { type: 'string', format: 'date-time' },
            metodoCalculo: {
              type: 'string',
              enum: ['Palet', 'Kilometro', 'Fijo'],
              description: 'Método de cálculo del tramo'
            },
            valorPeaje: { type: 'number', description: 'Valor del peaje' }
          }
        },
        Site: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            Site: { type: 'string', description: 'Código del sitio' },
            Descripcion: { type: 'string', description: 'Descripción del sitio' },
            Latitud: { type: 'number', description: 'Latitud geográfica' },
            Longitud: { type: 'number', description: 'Longitud geográfica' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticación faltante o inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticación' },
      { name: 'Clientes', description: 'Operaciones con clientes' },
      { name: 'Tramos', description: 'Gestión de tramos de viaje' },
      { name: 'Sites', description: 'Gestión de sitios' },
      { name: 'Viajes', description: 'Operaciones con viajes' }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
module.exports = swaggerSpecs;
// FIN DE CONFIGURACIÓN SWAGGER (swaggerConfig.js)
