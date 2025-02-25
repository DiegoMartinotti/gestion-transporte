const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const limiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.max,
  message: {
    error: 'Demasiadas solicitudes, por favor intente más tarde'
  }
});

module.exports = limiter;
