"use strict";
/**
 * Configuración centralizada de Swagger
 * Este módulo genera la documentación interactiva de la API
 */
const swaggerJsdoc = require('swagger-jsdoc');
const logger = require('./utils/logger');
// Definición de la documentación OpenAPI
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sistema de Gestión de Viajes API',
            version: '1.2.0',
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
                        success: {
                            type: 'boolean',
                            description: 'Indica si la operación fue exitosa',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Descripción del error',
                            example: 'Recurso no encontrado'
                        },
                        errors: {
                            type: 'array',
                            description: 'Lista de errores detallados (si aplica)',
                            items: {
                                type: 'string'
                            },
                            example: ['El campo nombre es requerido', 'El ID no es válido']
                        }
                    }
                },
                Response: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indica si la operación fue exitosa',
                            example: true
                        },
                        message: {
                            type: 'string',
                            description: 'Mensaje descriptivo',
                            example: 'Operación completada exitosamente'
                        },
                        data: {
                            type: 'object',
                            description: 'Datos de respuesta',
                            example: {}
                        }
                    }
                },
                Cliente: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'ID único del cliente', example: '60d21b4667d0d8992e610c85' },
                        nombre: { type: 'string', description: 'Nombre del cliente', example: 'Empresa XYZ' },
                        codigo: { type: 'string', description: 'Código único del cliente', example: 'EMP001' },
                        activo: { type: 'boolean', description: 'Estado del cliente', example: true }
                    }
                },
                Tramo: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d21b4667d0d8992e610c86' },
                        origen: {
                            type: 'object',
                            description: 'Sitio de origen',
                            properties: {
                                _id: { type: 'string', example: '60d21b4667d0d8992e610c87' },
                                nombre: { type: 'string', example: 'Centro de Distribución A' }
                            }
                        },
                        destino: {
                            type: 'object',
                            description: 'Sitio de destino',
                            properties: {
                                _id: { type: 'string', example: '60d21b4667d0d8992e610c88' },
                                nombre: { type: 'string', example: 'Tienda B' }
                            }
                        },
                        tipo: {
                            type: 'string',
                            enum: ['TRMC', 'TMRI'],
                            description: 'Tipo de tramo',
                            example: 'TRMC'
                        },
                        cliente: { type: 'string', description: 'ID del cliente', example: '60d21b4667d0d8992e610c85' },
                        vigenciaDesde: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' },
                        vigenciaHasta: { type: 'string', format: 'date-time', example: '2023-12-31T23:59:59Z' },
                        metodoCalculo: {
                            type: 'string',
                            enum: ['Palet', 'Kilometro', 'Fijo'],
                            description: 'Método de cálculo del tramo',
                            example: 'Kilometro'
                        },
                        valorPeaje: { type: 'number', description: 'Valor del peaje', example: 150.50 }
                    }
                },
                Site: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d21b4667d0d8992e610c87' },
                        Site: { type: 'string', description: 'Código del sitio', example: 'CD-001' },
                        Cliente: { type: 'string', description: 'ID del cliente', example: '60d21b4667d0d8992e610c85' },
                        Direccion: { type: 'string', description: 'Dirección del sitio', example: 'Av. Principal 123' },
                        Localidad: { type: 'string', description: 'Localidad del sitio', example: 'Buenos Aires' },
                        Provincia: { type: 'string', description: 'Provincia del sitio', example: 'CABA' },
                        location: {
                            type: 'object',
                            description: 'Coordenadas geográficas',
                            properties: {
                                type: { type: 'string', example: 'Point' },
                                coordinates: {
                                    type: 'array',
                                    items: { type: 'number' },
                                    example: [-58.381592, -34.603722]
                                }
                            }
                        },
                        coordenadas: {
                            type: 'object',
                            description: 'Coordenadas en formato lat/lng',
                            properties: {
                                lat: { type: 'number', example: -34.603722 },
                                lng: { type: 'number', example: -58.381592 }
                            }
                        }
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
                },
                ValidationError: {
                    description: 'Error de validación en los datos enviados',
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
            { name: 'Sites', description: 'Gestión de sitios y ubicaciones' },
            { name: 'Viajes', description: 'Operaciones con viajes' },
            { name: 'Vehículos', description: 'Gestión de vehículos' }
        ]
    },
    // Rutas donde buscar anotaciones de Swagger
    apis: [
        './routes/*.js', // Archivos de rutas antiguos
        './routes/**/*.js', // Rutas modularizadas (incluye subdirectorios)
        './controllers/*.js', // Controladores antiguos
        './controllers/**/*.js', // Controladores modularizados (incluye subdirectorios)
        './models/*.js', // Modelos
        './middleware/*.js' // Middleware
    ]
};
// Generar especificaciones Swagger
let swaggerSpecs;
try {
    swaggerSpecs = swaggerJsdoc(swaggerOptions);
    logger.info('Documentación Swagger generada correctamente');
}
catch (error) {
    logger.error('Error al generar documentación Swagger:', error);
    // Proporcionar especificaciones básicas para que la API siga funcionando
    swaggerSpecs = {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation (Error)',
            version: '1.0.0',
            description: 'Error al generar documentación completa'
        },
        paths: {}
    };
}
module.exports = swaggerSpecs;
//# sourceMappingURL=swaggerConfig.js.map