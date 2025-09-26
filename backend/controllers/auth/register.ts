// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request, Response } from 'express';
import Usuario, { IUsuario } from '../../models/Usuario';
import logger from '../../utils/logger';

/**
 * Interface for register request body
 */
interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  roles?: string[];
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
 * Registra un nuevo usuario en el sistema
 *
 * @async
 * @function register
 * @param req - Objeto de solicitud Express
 * @param res - Objeto de respuesta Express
 * @returns Objeto JSON con mensaje de éxito
 * @throws Error 400 si el usuario ya existe
 * @throws Error 500 si hay un error en el servidor
 */
export const register = async (
  req: Request<Record<string, unknown>, ApiResponse, RegisterRequest>,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const { nombre, email, password, roles } = req.body;

    const usuarioExistente: IUsuario | null = await Usuario.findOne({ email });
    if (usuarioExistente) {
      res.status(400).json({
        success: false,
        message: 'Usuario ya existe',
      });
      return;
    }

    const usuario = new Usuario({
      nombre,
      email,
      password, // No hacer hash aquí, el modelo ya lo hace
      roles: roles || ['user'],
    });

    await usuario.save();
    logger.debug('Usuario registrado:', email);
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
    });
  }
};
