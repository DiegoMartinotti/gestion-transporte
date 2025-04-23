"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger.info('Intentando conectar a MongoDB...');
            logger.info('URI:', process.env.MONGODB_URI);
            yield mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            logger.info('¡Conexión exitosa a MongoDB!');
            // Intentar crear un usuario de prueba
            const Usuario = require('./models/Usuario');
            const testUser = new Usuario({
                email: 'test@test.com',
                password: '123456',
                nombre: 'Test User'
            });
            yield testUser.save();
            logger.info('Usuario de prueba creado exitosamente');
            // Buscar el usuario recién creado
            const foundUser = yield Usuario.findOne({ email: 'test@test.com' });
            logger.info('Usuario encontrado:', foundUser);
        }
        catch (error) {
            logger.error('Error de conexión:', error);
        }
        finally {
            yield mongoose.disconnect();
            logger.info('Conexión cerrada');
        }
    });
}
testConnection();
//# sourceMappingURL=test-connection.js.map