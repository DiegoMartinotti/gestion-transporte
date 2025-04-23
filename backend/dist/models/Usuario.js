"use strict";
/**
 * @module models/Usuario
 * @description Modelo para la gestión de usuarios en el sistema
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
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
/**
 * Esquema de usuario para MongoDB
 *
 * @typedef {Object} UsuarioSchema
 * @property {string} email - Correo electrónico del usuario (único)
 * @property {string} password - Contraseña del usuario (encriptada)
 * @property {string} nombre - Nombre completo del usuario
 * @property {Date} createdAt - Fecha de creación (automática)
 * @property {Date} updatedAt - Fecha de última actualización (automática)
 */
const usuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, introduce un email válido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
        // Considerar añadir validación de complejidad con regex si es necesario
    },
    nombre: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
/**
 * Middleware que se ejecuta antes de guardar un usuario
 * Encripta la contraseña si ha sido modificada
 *
 * @async
 * @function preSave
 * @param {Function} next - Función para continuar con el siguiente middleware
 * @returns {void}
 * @throws {Error} Si ocurre un error durante la encriptación
 */
usuarioSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return next();
        try {
            const salt = yield bcrypt.genSalt(10);
            this.password = yield bcrypt.hash(this.password, salt);
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
/**
 * Método para verificar la contraseña del usuario
 *
 * @async
 * @method verificarPassword
 * @param {string} password - Contraseña a verificar
 * @returns {Promise<boolean>} true si la contraseña es correcta, false en caso contrario
 */
usuarioSchema.methods.verificarPassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt.compare(password, this.password);
    });
};
/**
 * Modelo de Usuario basado en el esquema definido
 *
 * @type {mongoose.Model<UsuarioSchema>}
 */
const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario; // FIN DEL MODELO USUARIO
//# sourceMappingURL=Usuario.js.map