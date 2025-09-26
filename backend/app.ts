import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database';
import logger from './utils/logger';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import config from './config/config';
import validateEnv from './config/validateEnv';

// Validar variables de entorno
validateEnv();

const app = express();
app.disable('x-powered-by'); // Deshabilitar header X-Powered-By por seguridad
const port = config.port;

// CORS Configuration - Must be first
const corsOptions = {
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(
  express.json({
    limit: config.bodyLimits.json,
    verify: (req: Request, res: Response, buf: Buffer) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        logger.error('Error al analizar JSON en verify:', (e as Error).message);
        throw new Error('JSON inválido');
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: config.bodyLimits.urlencoded,
    parameterLimit: config.bodyLimits.parameterLimit,
  })
);

app.use(cookieParser());

// Importar y configurar middleware de seguridad
import securityMiddleware from './middleware/security';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
securityMiddleware.forEach((middleware) => app.use(middleware as any));

// Improved request logging
// @ts-expect-error - Express middleware types conflict
app.use((req: Request, res: Response, next: NextFunction) => {
  // En producción, solo registrar errores
  if (process.env.NODE_ENV === 'production') {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        logger.error(
          `[Request Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`
        );
      }
    });
  } else {
    logger.debug(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (['POST', 'PUT'].includes(req.method)) {
      logger.debug('Headers:', req.headers);
      logger.debug('Body:', req.body);
    }
  }
  next();
});

// Test endpoint
// @ts-expect-error - Express route types conflict
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Routes
import authRouter from './routes/auth';
import apiRoutes from './routes/index';
import proxyRouter from './routes/proxy';

// Rate Limiter específico para Proxy
const proxyLimiter = rateLimit({
  windowMs: config.rateLimiting.proxy.windowMs,
  max: config.rateLimiting.proxy.max,
  message: { error: 'Demasiadas solicitudes de geocodificación, por favor intente más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/proxy', proxyLimiter, proxyRouter); // Aplicar limiter específico aquí

// Protected routes
app.use('/api', apiRoutes);

// Middleware para rutas no encontradas (404)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(notFoundHandler as any);

// Middleware para manejo de errores
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(errorHandler as any);

// Función auxiliar para manejo de errores globales
function handleGlobalError(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Loguear el error
  logger.error('Error no controlado:', err);

  // Determinar código de estado HTTP
  const statusCode =
    err && typeof err === 'object' && 'statusCode' in err
      ? (err as { statusCode: number }).statusCode
      : 500;

  // Determinar mensaje de error
  let errorMessage = err instanceof Error ? err.message : 'Error interno del servidor';

  // Para errores de sintaxis JSON, personalizar el mensaje
  if (err instanceof SyntaxError && 'status' in err && 'body' in err) {
    errorMessage = 'JSON inválido';
  }

  // Enviar respuesta estandarizada
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}

// Middleware global para manejo de errores
// Este middleware debe colocarse después de todas las rutas y otros middleware
// @ts-expect-error - Error handler middleware types conflict
app.use(handleGlobalError);

async function startServer(): Promise<void> {
  try {
    await connectDB();
    app.listen(port, () => {
      logger.info(`Servidor ejecutándose en http://localhost:${port}`);
      logger.info('Rutas disponibles:');
      logger.info('- POST /api/auth/login');
      logger.info('- POST /api/auth/register');
      logger.info('- GET /api/test');
    });
  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${(error as Error).message}`);
    process.exit(1);
  }
}

startServer();

// Exportar la app para poder usarla en server.js
export default app;
