const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');
const { APIError } = require('../../middleware/errorHandler');
const mongoose = require('mongoose');

/**
 * Valida que el ID proporcionado sea un ObjectId válido de MongoDB
 * @param {string} id - ID a validar
 * @returns {boolean} true si es válido
 */
const validarObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Valida los datos de actualización de un vehículo
 * @param {Object} data - Datos a validar
 * @returns {Object} - Resultado de la validación { valido, errores }
 */
const validarDatosActualizacion = (data) => {
  const errores = [];
  
  // Validar campos si están presentes
  if (!data || Object.keys(data).length === 0) {
    errores.push('No se proporcionaron datos para actualizar');
    return { valido: false, errores };
  }
  
  if (data.dominio !== undefined) {
    if (typeof data.dominio !== 'string' || data.dominio.trim().length < 3) {
      errores.push('El dominio debe tener al menos 3 caracteres');
    }
  }
  
  if (data.empresa !== undefined) {
    if (!validarObjectId(data.empresa)) {
      errores.push('El ID de empresa no tiene un formato válido');
    }
  }
  
  if (data.activo !== undefined && typeof data.activo !== 'boolean') {
    errores.push('El campo activo debe ser un valor booleano');
  }
  
  if (data.capacidad !== undefined) {
    const capacidad = Number(data.capacidad);
    if (isNaN(capacidad) || capacidad <= 0) {
      errores.push('La capacidad debe ser un número positivo');
    }
  }
  
  // Validar formato de fechas en la documentación
  if (data.documentacion) {
    const docs = ['seguro', 'vtv', 'ruta', 'senasa'];
    docs.forEach(doc => {
      if (data.documentacion[doc] && data.documentacion[doc].vencimiento) {
        const fecha = new Date(data.documentacion[doc].vencimiento);
        if (isNaN(fecha.getTime())) {
          errores.push(`La fecha de vencimiento de ${doc} no es válida`);
        }
      }
    });
  }
  
  return { 
    valido: errores.length === 0,
    errores
  };
};

/**
 * @desc    Actualizar un vehículo existente
 * @route   PUT /api/vehiculos/:id
 * @access  Private
 */
const updateVehiculo = async (req, res, next) => {
  const inicioTiempo = Date.now();
  const { id } = req.params;
  
  logger.info(`Petición recibida: PUT /api/vehiculos/${id}`);
  
  try {
    // Validar formato del ID
    if (!id) {
      throw APIError.validacion('Se requiere el ID del vehículo');
    }
    
    if (!validarObjectId(id)) {
      logger.warn(`ID de vehículo inválido: ${id}`);
      throw APIError.validacion('El ID proporcionado no tiene un formato válido');
    }
    
    // Validar datos de actualización
    const { valido, errores } = validarDatosActualizacion(req.body);
    
    if (!valido) {
      logger.warn(`Validación fallida al actualizar vehículo ${id}: ${errores.join(', ')}`);
      throw APIError.validacion('Datos de actualización inválidos', { errores });
    }
    
    // Normalizar el dominio si está presente (siempre en mayúsculas)
    if (req.body.dominio) {
      req.body.dominio = req.body.dominio.toUpperCase().trim();
    }
    
    // Actualizar el vehículo
    const vehiculoActualizado = await vehiculoService.updateVehiculo(id, req.body);
    
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Vehículo ${id} actualizado correctamente (tiempo: ${tiempoTotal}ms)`);
    
    // Responder con éxito
    res.status(200).json({
      exito: true,
      mensaje: 'Vehículo actualizado correctamente',
      datos: vehiculoActualizado
    });
  } catch (error) {
    // Si es un error de la API lo pasamos al middleware
    if (error instanceof APIError) {
      return next(error);
    }
    
    const tiempoTotal = Date.now() - inicioTiempo;
    
    // Manejar errores específicos
    if (error.message.includes('empresa') || 
        error.message.includes('La empresa especificada no existe')) {
      logger.warn(`Error al actualizar vehículo - Empresa no válida: ${error.message} (tiempo: ${tiempoTotal}ms)`);
      return next(APIError.validacion('La empresa especificada no existe', { campo: 'empresa' }));
    }
    
    if (error.message.includes('dominio') || 
        error.message.includes('Ya existe un vehículo con ese dominio')) {
      logger.warn(`Error al actualizar vehículo - Dominio duplicado: ${error.message} (tiempo: ${tiempoTotal}ms)`);
      return next(APIError.conflicto('Ya existe un vehículo con ese dominio', { campo: 'dominio' }));
    }
    
    if (error.message.includes('no encontrado')) {
      logger.warn(`Vehículo no encontrado al actualizar: ${id} (tiempo: ${tiempoTotal}ms)`);
      return next(APIError.noEncontrado(`Vehículo con ID ${id} no encontrado`, 'vehiculo'));
    }
    
    // Error general
    logger.error(`Error al actualizar vehículo ${id}: ${error.message} (tiempo: ${tiempoTotal}ms)`, error);
    next(new APIError(`Error al actualizar vehículo: ${error.message}`));
  }
};

module.exports = updateVehiculo; 