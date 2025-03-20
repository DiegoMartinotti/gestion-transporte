const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');

/**
 * Valida los datos de entrada para la creación de un vehículo
 * @param {Object} data - Datos del vehículo a validar
 * @returns {Object} - Resultado de la validación { valido, errores }
 */
const validarDatosVehiculo = (data) => {
  const errores = [];
  
  // Validar campos obligatorios
  if (!data) {
    errores.push('No se proporcionaron datos del vehículo');
    return { valido: false, errores };
  }
  
  if (!data.dominio) {
    errores.push('El dominio del vehículo es obligatorio');
  } else if (typeof data.dominio !== 'string' || data.dominio.trim().length < 3) {
    errores.push('El dominio debe tener al menos 3 caracteres');
  }
  
  if (!data.empresa) {
    errores.push('La empresa asociada es obligatoria');
  }
  
  if (!data.tipo) {
    errores.push('El tipo de vehículo es obligatorio');
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
 * @desc    Crear un nuevo vehículo
 * @route   POST /api/vehiculos
 * @access  Private
 */
const createVehiculo = async (req, res) => {
  const inicioTiempo = Date.now();
  logger.info(`Petición recibida: POST /api/vehiculos`);
  
  try {
    // Validar datos de entrada
    const { valido, errores } = validarDatosVehiculo(req.body);
    
    if (!valido) {
      logger.warn(`Validación fallida al crear vehículo: ${errores.join(', ')}`);
      return res.status(400).json({ 
        exito: false,
        mensaje: 'Datos de vehículo inválidos',
        errores 
      });
    }
    
    // Normalizar el dominio (siempre en mayúsculas)
    if (req.body.dominio) {
      req.body.dominio = req.body.dominio.toUpperCase().trim();
    }
    
    // Crear el vehículo
    const vehiculoGuardado = await vehiculoService.createVehiculo(req.body);
    
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Vehículo creado con ID ${vehiculoGuardado._id} (tiempo: ${tiempoTotal}ms)`);
    
    res.status(201).json({
      exito: true,
      mensaje: 'Vehículo creado correctamente',
      datos: vehiculoGuardado
    });
  } catch (error) {
    const tiempoTotal = Date.now() - inicioTiempo;
    
    // Manejar errores específicos
    if (error.message.includes('empresa') || 
        error.message.includes('La empresa especificada no existe')) {
      logger.warn(`Error al crear vehículo - Empresa no válida: ${error.message} (tiempo: ${tiempoTotal}ms)`);
      return res.status(400).json({ 
        exito: false,
        mensaje: 'La empresa especificada no existe',
        error: error.message 
      });
    }
    
    if (error.message.includes('dominio') || 
        error.message.includes('Ya existe un vehículo con ese dominio')) {
      logger.warn(`Error al crear vehículo - Dominio duplicado: ${error.message} (tiempo: ${tiempoTotal}ms)`);
      return res.status(400).json({ 
        exito: false,
        mensaje: 'Ya existe un vehículo con ese dominio',
        error: error.message 
      });
    }
    
    // Error genérico
    logger.error(`Error al crear vehículo: ${error.message} (tiempo: ${tiempoTotal}ms)`, error);
    res.status(500).json({ 
      exito: false,
      mensaje: 'Error al crear vehículo', 
      error: error.message 
    });
  }
};

module.exports = createVehiculo; 