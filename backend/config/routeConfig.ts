/**
 * Configuración centralizada de rutas para la aplicación
 * Este módulo configura todas las rutas disponibles en la aplicación
 */

import { Application, Request, Response } from 'express';
import logger from '../utils/logger';
import swaggerUi from 'swagger-ui-express';

/**
 * Configura todas las rutas para la aplicación Express
 * @param app - Instancia de la aplicación Express
 */
async function configureRoutes(app: Application): Promise<void> {
  configureTestRoute(app);
  await configureApiRoutes(app);
  await configureSwaggerDocs(app);
}

/**
 * Configura la ruta de prueba básica
 * @param app - Instancia de la aplicación Express
 */
function configureTestRoute(app: Application): void {
  // Test endpoint para verificar que la API está funcionando
  // @ts-expect-error - Express route types conflict
  app.get('/api/test', (req: Request, res: Response) => {
    logger.debug('Endpoint de prueba accedido');
    res.json({
      success: true,
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

/**
 * Configura las rutas principales de la API
 * @param app - Instancia de la aplicación Express
 */
async function configureApiRoutes(app: Application): Promise<void> {
  try {
    // Importar routers
    // Importar routers usando dynamic imports para compatibilidad
    const authModule = await import('../routes/auth');
    const apiModule = await import('../routes/index');
    const proxyModule = await import('../routes/proxy');

    const authRouter = authModule.default || authModule;
    const apiRoutes = apiModule.default || apiModule;
    const proxyRouter = proxyModule.default || proxyModule;

    // Rutas públicas que no requieren autenticación
    app.use('/api/auth', authRouter);
    app.use('/api/proxy', proxyRouter);

    // Rutas protegidas (el middleware de auth se aplica en index.js)
    app.use('/api', apiRoutes);

    logger.info('Rutas de API configuradas correctamente');
  } catch (error) {
    logger.error('Error al configurar rutas de API:', error);
    throw error; // Re-lanzar para que se maneje adecuadamente
  }
}

/**
 * Configura la documentación Swagger de la API
 * @param app - Instancia de la aplicación Express
 */
async function configureSwaggerDocs(app: Application): Promise<void> {
  try {
    const swaggerModule = await import('../swaggerConfig');
    const swaggerSpecs = swaggerModule.default || swaggerModule;
    app.use(
      '/api-docs',
      swaggerUi.serve,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      swaggerUi.setup(swaggerSpecs as any, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customfavIcon: '',
        customSiteTitle: 'API Documentation',
      })
    );

    logger.info('Documentación Swagger configurada en /api-docs');
  } catch (error) {
    logger.warn('Error al configurar documentación Swagger:', error);
    // No lanzamos el error aquí porque la documentación no es crítica para el funcionamiento
  }
}

/**
 * Devuelve un array con las rutas principales configuradas
 * Útil para mostrar información en el arranque del servidor
 * @returns Array de rutas principales
 */
function getMainRoutes(): string[] {
  return [
    'POST /api/auth/login - Iniciar sesión',
    'POST /api/auth/register - Registrar nuevo usuario',
    'GET /api/test - Probar conexión API',
    'GET /api-docs - Documentación Swagger',
    'GET /api/clientes - Obtener clientes',
    'GET /api/tramo - Gestionar tramos',
    'GET /api/site - Gestionar sitios',
  ];
}

export { configureRoutes, getMainRoutes };
