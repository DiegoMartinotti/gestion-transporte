import { Request, Response } from 'express';
import Usuario, { IUsuario } from '../models/Usuario';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import config from '../config/config';

/**
 * Interface for login request body
 */
interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Interface for register request body
 */
interface RegisterRequest {
    nombre: string;
    email: string;
    password: string;
}

/**
 * Interface for JWT payload
 */
interface JWTPayload {
    userId: string;
    email: string;
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
 * Autentica a un usuario y genera un token JWT
 * 
 * @async
 * @function login
 * @param req - Objeto de solicitud Express
 * @param res - Objeto de respuesta Express
 * @returns Objeto JSON con el token y datos del usuario
 * @throws Error 400 si faltan credenciales
 * @throws Error 401 si las credenciales son inválidas
 * @throws Error 500 si hay un error en el servidor
 */
export const login = async (req: Request<{}, ApiResponse, LoginRequest>, res: Response<ApiResponse>): Promise<void> => {
    try {
        logger.debug('Datos recibidos:', req.body);
        
        const { email, password } = req.body;

        if (!email || !password) {
            logger.debug('Faltan campos:', { email: !!email, password: !!password });
            res.status(400).json({ 
                success: false,
                error: 'Email y contraseña son requeridos'
            });
            return;
        }

        const usuario: IUsuario | null = await Usuario.findOne({ email });
        if (!usuario) {
            logger.debug('Usuario no encontrado:', email);
            res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas'
            });
            return;
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas'
            });
            return;
        }

        const payload: JWTPayload = {
            userId: usuario._id.toString(),
            email: usuario.email
        };

        const token = jwt.sign(
            payload,
            config.jwtSecret,
            { expiresIn: config.jwtExpiration } as jwt.SignOptions
        );

        // Set token in HTTP-only cookie con configuración de seguridad mejorada
        res.cookie('token', token, {
            httpOnly: true, // Impide acceso por JavaScript del cliente
            secure: config.env === 'production' || config.env === 'staging', // HTTPS en producción y staging
            sameSite: 'strict', // Previene CSRF
            maxAge: config.jwtCookieMaxAge, // Tiempo de vida en milisegundos
            path: '/', // La cookie es válida para todo el dominio
            domain: (config as any).cookieDomain || undefined // Dominio específico si está configurado
        });

        // No enviar el token en la respuesta JSON, solo información del usuario
        res.json({
            success: true,
            user: {
                id: usuario._id.toString(),
                email: usuario.email,
                nombre: usuario.nombre
            }
        });
    } catch (error) {
        logger.error('Error en login:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error en el servidor'
        });
    }
};

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
export const register = async (req: Request<{}, ApiResponse, RegisterRequest>, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { nombre, email, password } = req.body;
        
        const usuarioExistente: IUsuario | null = await Usuario.findOne({ email });
        if (usuarioExistente) {
            res.status(400).json({ 
                success: false,
                message: 'Usuario ya existe' 
            });
            return;
        }

        const usuario = new Usuario({
            nombre,
            email,
            password // No hacer hash aquí, el modelo ya lo hace
        });

        await usuario.save();
        logger.debug('Usuario registrado:', email);
        res.status(201).json({ 
            success: true,
            message: 'Usuario registrado exitosamente' 
        });
    } catch (error) {
        logger.error('Error en registro:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};