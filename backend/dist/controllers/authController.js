"use strict";
/**
 * @module controllers/authController
 * @description Controlador para gestionar la autenticación de usuarios en el sistema
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config/config');
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
exports.login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const usuario = yield Usuario.findOne({ email });
        if (!usuario) {
            logger.debug('Usuario no encontrado:', email);
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        const isMatch = yield bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        const token = jwt.sign({
            userId: usuario._id,
            email: usuario.email
        }, config.jwtSecret, { expiresIn: config.jwtExpiration });
        // Set token in HTTP-only cookie con configuración de seguridad mejorada
        res.cookie('token', token, {
            httpOnly: true, // Impide acceso por JavaScript del cliente
            secure: config.env === 'production' || config.env === 'staging', // HTTPS en producción y staging
            sameSite: 'strict', // Previene CSRF
            maxAge: config.jwtCookieMaxAge, // Tiempo de vida en milisegundos
            path: '/', // La cookie es válida para todo el dominio
            domain: config.cookieDomain || undefined // Dominio específico si está configurado
        });
        // No enviar el token en la respuesta JSON, solo información del usuario
        res.json({
            success: true,
            user: {
                id: usuario._id,
                email: usuario.email,
                nombre: usuario.nombre
            }
        });
    }
    catch (error) {
        logger.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
});
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
exports.register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre, email, password } = req.body;
        let usuario = yield Usuario.findOne({ email });
        if (usuario) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }
        usuario = new Usuario({
            nombre,
            email,
            password // No hacer hash aquí, el modelo ya lo hace
        });
        yield usuario.save();
        logger.debug('Usuario registrado:', email);
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    }
    catch (error) {
        logger.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
//# sourceMappingURL=authController.js.map