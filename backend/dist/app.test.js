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
const request = require('supertest');
const mongoose = require('mongoose'); // Asegurate de importar mongoose
const app = require('./index'); // Ajustá la ruta según tu estructura
describe('Pruebas de la API', () => {
    // Prueba de la ruta de prueba (GET /)
    describe('GET /', () => {
        it('debería retornar el mensaje de bienvenida', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield request(app).get('/');
            expect(res.statusCode).toEqual(200);
            expect(res.text).toBe('¡Hola desde el servidor Express!');
        }));
    });
    // Prueba para el endpoint de login (suponiendo que ya registraste un usuario)
    describe('POST /api/usuarios/login', () => {
        it('debería autenticar al usuario y retornar un token JWT', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield request(app)
                .post('/api/usuarios/login')
                .send({
                email: "juan@example.com",
                password: "123456"
            });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('mensaje', 'Autenticación exitosa');
            expect(res.body).toHaveProperty('token');
        }));
    });
});
// Cerrar la conexión de MongoDB al finalizar las pruebas
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose.connection.close();
}));
//# sourceMappingURL=app.test.js.map