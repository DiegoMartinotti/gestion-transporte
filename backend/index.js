require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
// Comentar o remover esta línea si no quieres usar rate limiting por ahora
// const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Middlewares
app.use(cors({
  origin: config.allowedOrigins
}));
app.use(express.json());
// Comentar o remover esta línea si no quieres usar rate limiting por ahora
// app.use(rateLimiter);

// Routes
app.use('/api/usuarios', require('./routes/auth'));
app.use('/api/viajes', require('./routes/viajes'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/sites', require('./routes/sites'));

// Remover esta línea
// app.use('/api-docs', require('./routes/swagger'));

// Reemplazar con estas líneas
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swaggerConfig');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error handling
app.use(errorHandler);

// Conexión a MongoDB y arranque del servidor
mongoose.connect(config.mongoUri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  logger.info('Conexión a MongoDB exitosa');
  app.listen(config.port, () => {
    logger.info(`Servidor ejecutándose en http://localhost:${config.port}`);
  });
})
.catch(error => {
  logger.error('Error de conexión a MongoDB:', error.message);
  process.exit(1);
});

module.exports = app;

