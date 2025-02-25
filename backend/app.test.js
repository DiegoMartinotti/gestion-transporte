const request = require('supertest');
const mongoose = require('mongoose'); // Asegurate de importar mongoose
const app = require('./index'); // Ajustá la ruta según tu estructura

describe('Pruebas de la API', () => {
  // Prueba de la ruta de prueba (GET /)
  describe('GET /', () => {
    it('debería retornar el mensaje de bienvenida', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe('¡Hola desde el servidor Express!');
    });
  });

  // Prueba para el endpoint de login (suponiendo que ya registraste un usuario)
  describe('POST /api/usuarios/login', () => {
    it('debería autenticar al usuario y retornar un token JWT', async () => {
      const res = await request(app)
        .post('/api/usuarios/login')
        .send({
          email: "juan@example.com",
          password: "123456"
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('mensaje', 'Autenticación exitosa');
      expect(res.body).toHaveProperty('token');
    });
  });
});

// Cerrar la conexión de MongoDB al finalizar las pruebas
afterAll(async () => {
  await mongoose.connection.close();
});

