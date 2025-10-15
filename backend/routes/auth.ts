import express from 'express';
const router = express.Router();
import { login, register } from '../controllers/auth';
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import config from '../config/config';
import Usuario from '../models/Usuario';
import Cliente from '../models/Cliente';

const toHandler = (handler: unknown): express.RequestHandler => {
  return (req, res, next) => {
    try {
      const request = req as unknown as express.Request;
      const response = res as unknown as express.Response;
      const result = (
        handler as (
          req: express.Request,
          res: express.Response,
          next?: express.NextFunction
        ) => unknown
      )(request, response, next);
      Promise.resolve(result).catch(next);
    } catch (error) {
      next(error as Error);
    }
  };
};

const ensureAuthenticated = authenticateToken as unknown as express.RequestHandler;

type AuthenticatedRequest = express.Request & {
  user?: {
    id?: string;
    userId?: string;
    email?: string;
    roles?: string[];
  };
};

// Middleware de logging para rutas de auth
const logAuthRequests: express.RequestHandler = (req, _res, next) => {
  logger.debug(`Auth Route: ${req.method} ${req.path}`);
  next();
};

router.use(logAuthRequests);

// Rutas de autenticación
router.post('/login', toHandler(login));
router.post('/register', toHandler(register));

// Nueva ruta para obtener datos del usuario
router.get(
  '/me',
  ensureAuthenticated,
  toHandler(async (req: express.Request, res: express.Response) => {
    const { user } = req as AuthenticatedRequest;

    if (!user || (!user.userId && !user.id) || !user.email) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.userId ?? user.id ?? '',
        email: user.email,
      },
    });
  })
);

// Ruta para cerrar sesión
const logoutHandler: express.RequestHandler = (req, res, next) => {
  try {
    // Limpiar la cookie del token
    res.clearCookie('token', {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
    });

    logger.debug('Sesión cerrada exitosamente');

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

router.post('/logout', logoutHandler);

// Ruta temporal para actualizar roles de usuario (SOLO PARA DESARROLLO)
router.post(
  '/update-roles',
  toHandler(async (req: express.Request, res: express.Response): Promise<void> => {
    const { email, roles } = req.body as { email?: string; roles?: string[] };

    if (!email || !Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Email y roles son requeridos',
      });
      return;
    }

    const user = await Usuario.findOneAndUpdate(
      { email: email },
      { $set: { roles: roles } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    logger.info(`Roles actualizados para ${email}: ${roles.join(', ')}`);

    res.json({
      success: true,
      message: 'Roles actualizados correctamente',
      user: {
        email: user.email,
        roles: user.roles,
      },
    });
  })
);

// Ruta temporal para actualizar campo activo de cliente (SOLO PARA DESARROLLO)
router.post(
  '/fix-cliente',
  toHandler(async (_req: express.Request, res: express.Response): Promise<void> => {
    const cliente = await Cliente.findOneAndUpdate(
      { _id: '67b8e22f8495fb070f964159' },
      { $set: { activo: true } },
      { new: true }
    );

    if (!cliente) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
      return;
    }

    logger.info(`Campo activo actualizado para cliente: ${cliente.nombre}`);

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      cliente: {
        nombre: cliente.nombre,
        activo: cliente.activo,
      },
    });
  })
);

export default router;
