import rateLimit from 'express-rate-limit';
import config from '../config/config';

const limiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.max,
  message: {
    error: 'Demasiadas solicitudes, por favor intente más tarde'
  }
});

export default limiter; 