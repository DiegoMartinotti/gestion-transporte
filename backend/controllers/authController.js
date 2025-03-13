/**
 * @module controllers/authController
 * @description Controlador para gestionar la autenticación de usuarios en el sistema
 */

const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Autentica a un usuario y genera un token JWT
 * 
 * @async
 * @function login
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.email - Email del usuario
 * @param {string} req.body.password - Contraseña del usuario
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Objeto JSON con el token y datos del usuario
 * @throws {Error} Error 400 si faltan credenciales
 * @throws {Error} Error 401 si las credenciales son inválidas
 * @throws {Error} Error 500 si hay un error en el servidor
 */
exports.login = async (req, res) => {
    try {
        logger.debug('Datos recibidos:', req.body);
        
        const { email, password } = req.body;

        if (!email || !password) {
            logger.debug('Faltan campos:', { email: !!email, password: !!password });
            return res.status(400).json({ 
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            logger.debug('Usuario no encontrado:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const token = jwt.sign(
            { 
                userId: usuario._id,
                email: usuario.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Asegurar que los headers CORS estén presentes
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            success: true,
            token,
            user: {
                id: usuario._id,
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
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.nombre - Nombre completo del usuario
 * @param {string} req.body.email - Email del usuario
 * @param {string} req.body.password - Contraseña del usuario
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Objeto JSON con mensaje de éxito
 * @throws {Error} Error 400 si el usuario ya existe
 * @throws {Error} Error 500 si hay un error en el servidor
 */
exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        let usuario = await Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }

        usuario = new Usuario({
            nombre,
            email,
            password // No hacer hash aquí, el modelo ya lo hace
        });

        await usuario.save();
        logger.debug('Usuario registrado:', email);
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        logger.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
