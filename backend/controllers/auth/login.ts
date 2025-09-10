// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Usuario, { IUsuario } from '../../models/Usuario';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import logger from '../../utils/logger';
import config from '../../config/config';

/**
 * Interface for login request body
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for JWT payload
 */
interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * Interface for API response
 */
interface ApiResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    nombre: string;
  };
  error?: string;
  message?: string;
}

/**
 * Validates login credentials
 */
const validateCredentials = (email: string, password: string): string | null => {
  if (!email || !password) {
    return 'Email y contraseña son requeridos';
  }
  return null;
};

/**
 * Creates JWT token for user
 */
const createUserToken = (usuario: IUsuario): string => {
  const payload: JWTPayload = {
    userId: (usuario._id as { toString(): string }).toString(),
    email: usuario.email,
    roles: usuario.roles || ['user'],
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  } as jwt.SignOptions);
};

/**
 * Sets secure cookie with JWT token
 */
const setAuthCookie = (res: Response<ApiResponse>, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.env === 'production' || config.env === 'staging',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    maxAge: config.jwtCookieMaxAge,
    path: '/',
    domain: (config as { cookieDomain?: string }).cookieDomain || undefined,
  });
};

/**
 * Autentica a un usuario y genera un token JWT
 */
export const login = async (
  req: Request<Record<string, unknown>, ApiResponse, LoginRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const validationError = validateCredentials(email, password);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      return;
    }

    const token = createUserToken(usuario);
    setAuthCookie(res, token);

    res.json({
      success: true,
      user: {
        id: (usuario._id as { toString(): string }).toString(),
        email: usuario.email,
        nombre: usuario.nombre,
      },
    });
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
};
