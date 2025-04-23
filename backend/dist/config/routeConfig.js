"use strict";
/**
 * Configuración centralizada de rutas para la aplicación
 * Este módulo configura todas las rutas disponibles en la aplicación
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRoutes = configureRoutes;
exports.getMainRoutes = getMainRoutes;
const logger_1 = __importDefault(require("../utils/logger"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
/**
 * Configura todas las rutas para la aplicación Express
 * @param app - Instancia de la aplicación Express
 */
function configureRoutes(app) {
    configureTestRoute(app);
    configureApiRoutes(app);
    configureSwaggerDocs(app);
}
/**
 * Configura la ruta de prueba básica
 * @param app - Instancia de la aplicación Express
 */
function configureTestRoute(app) {
    // Test endpoint para verificar que la API está funcionando
    app.get('/api/test', (req, res) => {
        logger_1.default.debug('Endpoint de prueba accedido');
        res.json({
            success: true,
            message: 'API funcionando correctamente',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });
}
/**
 * Configura las rutas principales de la API
 * @param app - Instancia de la aplicación Express
 */
function configureApiRoutes(app) {
    try {
        // Importar routers
        // Nota: Usamos require en lugar de import porque estamos en una migración gradual
        // y estos módulos aún podrían estar en JavaScript
        const authRouter = require('../routes/auth');
        const apiRoutes = require('../routes/index');
        const proxyRouter = require('../routes/proxy');
        // Rutas públicas que no requieren autenticación
        app.use('/api/auth', authRouter);
        app.use('/api/proxy', proxyRouter);
        // Rutas protegidas (el middleware de auth se aplica en index.js)
        app.use('/api', apiRoutes);
        logger_1.default.info('Rutas de API configuradas correctamente');
    }
    catch (error) {
        logger_1.default.error('Error al configurar rutas de API:', error);
        throw error; // Re-lanzar para que se maneje adecuadamente
    }
}
/**
 * Configura la documentación Swagger de la API
 * @param app - Instancia de la aplicación Express
 */
function configureSwaggerDocs(app) {
    try {
        const swaggerSpecs = require('../swaggerConfig');
        app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpecs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customfavIcon: '',
            customSiteTitle: 'API Documentation'
        }));
        logger_1.default.info('Documentación Swagger configurada en /api-docs');
    }
    catch (error) {
        logger_1.default.warn('Error al configurar documentación Swagger:', error);
        // No lanzamos el error aquí porque la documentación no es crítica para el funcionamiento
    }
}
/**
 * Devuelve un array con las rutas principales configuradas
 * Útil para mostrar información en el arranque del servidor
 * @returns Array de rutas principales
 */
function getMainRoutes() {
    return [
        'POST /api/auth/login - Iniciar sesión',
        'POST /api/auth/register - Registrar nuevo usuario',
        'GET /api/test - Probar conexión API',
        'GET /api-docs - Documentación Swagger',
        'GET /api/clientes - Obtener clientes',
        'GET /api/tramo - Gestionar tramos',
        'GET /api/site - Gestionar sitios'
    ];
}
//# sourceMappingURL=routeConfig.js.map