/**
 * Middleware centralizado para validaciones
 * Este archivo contiene validadores para diferentes entidades
 */

const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Valida los datos de un sitio antes de crear o actualizar
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateSite = (req, res, next) => {
  const { nombre, cliente } = req.body;
  
  const errors = [];
  
  // Validaciones para creación (POST)
  if (req.method === 'POST') {
    if (!nombre) errors.push('El nombre del sitio es requerido');
    if (!cliente) errors.push('El cliente asociado es requerido');
  }
  
  // Validaciones para actualización (PUT)
  if (req.method === 'PUT') {
    // Verificar que venga al menos un campo para actualizar
    if (!nombre && !req.body.direccion && !req.body.coordenadas && 
        !req.body.localidad && !req.body.provincia) {
      errors.push('Debe proporcionar al menos un campo para actualizar');
    }
  }
  
  // Validar formato de coordenadas si vienen
  if (req.body.coordenadas) {
    const { lat, lng } = req.body.coordenadas;
    
    if (lat === undefined || lng === undefined) {
      errors.push('Las coordenadas deben incluir lat y lng');
    } else {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.push('La latitud debe ser un número entre -90 y 90');
      }
      
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.push('La longitud debe ser un número entre -180 y 180');
      }
    }
  }
  
  // Si hay errores, devolver respuesta de error
  if (errors.length > 0) {
    logger.warn('Validación fallida:', errors);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }
  
  next();
};

/**
 * Valida los datos de un tramo antes de crear o actualizar
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateTramo = (req, res, next) => {
  const { origen, destino, cliente, tarifa } = req.body;
  
  const errors = [];
  
  // Validaciones básicas
  if (!origen) errors.push('El origen es requerido');
  if (!destino) errors.push('El destino es requerido');
  if (!cliente) errors.push('El cliente es requerido');
  
  // Validar tarifa
  if (tarifa !== undefined) {
    const tarifaNum = parseFloat(tarifa);
    if (isNaN(tarifaNum) || tarifaNum < 0) {
      errors.push('La tarifa debe ser un número positivo');
    }
  }
  
  // Validar fechas de vigencia si vienen
  if (req.body.vigenciaDesde) {
    const fechaDesde = new Date(req.body.vigenciaDesde);
    if (isNaN(fechaDesde.getTime())) {
      errors.push('La fecha de vigencia desde no es válida');
    }
  }
  
  if (req.body.vigenciaHasta) {
    const fechaHasta = new Date(req.body.vigenciaHasta);
    if (isNaN(fechaHasta.getTime())) {
      errors.push('La fecha de vigencia hasta no es válida');
    }
    
    // Validar que la fecha hasta sea posterior a la fecha desde
    if (req.body.vigenciaDesde) {
      const fechaDesde = new Date(req.body.vigenciaDesde);
      if (fechaHasta < fechaDesde) {
        errors.push('La fecha de vigencia hasta debe ser posterior a la fecha desde');
      }
    }
  }
  
  // Si hay errores, devolver respuesta de error
  if (errors.length > 0) {
    logger.warn('Validación de tramo fallida:', errors);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }
  
  next();
};

/**
 * Valida los datos de autenticación
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateAuth = (req, res, next) => {
  const { email, password } = req.body;
  
  const errors = [];
  
  if (!email) errors.push('El email es requerido');
  if (email && !/\S+@\S+\.\S+/.test(email)) {
    errors.push('El formato del email no es válido');
  }
  
  if (!password) errors.push('La contraseña es requerida');
  if (password && password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  // Si hay errores, devolver respuesta de error
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    });
  }
  
  next();
};

module.exports = {
  validateSite,
  validateTramo,
  validateAuth
}; 