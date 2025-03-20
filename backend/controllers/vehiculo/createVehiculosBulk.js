const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');

/**
 * Valida los datos de entrada para la carga masiva
 * @param {Array} vehiculos - Lista de vehículos a validar
 * @returns {Object} - Resultado de la validación { valido, errores, advertencias }
 */
const validarDatosMasivos = (vehiculos) => {
  const errores = [];
  const advertencias = [];
  
  // Validar que se proporcionó un array
  if (!vehiculos) {
    errores.push('No se proporcionaron datos de vehículos');
    return { valido: false, errores, advertencias };
  }
  
  if (!Array.isArray(vehiculos)) {
    errores.push('El formato de datos no es válido, se espera un array de vehículos');
    return { valido: false, errores, advertencias };
  }
  
  if (vehiculos.length === 0) {
    errores.push('La lista de vehículos está vacía');
    return { valido: false, errores, advertencias };
  }
  
  if (vehiculos.length > 500) {
    errores.push(`La carga masiva está limitada a 500 vehículos por lote (recibidos: ${vehiculos.length})`);
    return { valido: false, errores, advertencias };
  }
  
  // Validar cada vehículo individualmente
  const vehiculosInvalidos = [];
  const dominios = new Set();
  
  vehiculos.forEach((vehiculo, index) => {
    const erroresVehiculo = [];
    
    // Comprobar campos obligatorios
    if (!vehiculo.dominio) {
      erroresVehiculo.push('Dominio requerido');
    } else if (typeof vehiculo.dominio !== 'string' || vehiculo.dominio.trim().length < 3) {
      erroresVehiculo.push('Dominio inválido');
    } else {
      // Normalizar el dominio para verificar duplicados
      const dominioNormalizado = vehiculo.dominio.toUpperCase().trim();
      
      if (dominios.has(dominioNormalizado)) {
        erroresVehiculo.push('Dominio duplicado en la carga');
      } else {
        dominios.add(dominioNormalizado);
        
        // Normalizar el dominio en los datos
        vehiculo.dominio = dominioNormalizado;
      }
    }
    
    if (!vehiculo.empresa) {
      erroresVehiculo.push('Empresa requerida');
    }
    
    if (!vehiculo.tipo) {
      erroresVehiculo.push('Tipo de vehículo requerido');
    }
    
    // Validar fechas si se proporcionan
    if (vehiculo.documentacion) {
      const docs = ['seguro', 'vtv', 'ruta', 'senasa'];
      docs.forEach(doc => {
        if (vehiculo.documentacion[doc] && vehiculo.documentacion[doc].vencimiento) {
          const fecha = new Date(vehiculo.documentacion[doc].vencimiento);
          if (isNaN(fecha.getTime())) {
            erroresVehiculo.push(`Fecha de vencimiento de ${doc} inválida`);
          }
        }
      });
    }
    
    // Si tiene errores, agregarlo a la lista
    if (erroresVehiculo.length > 0) {
      vehiculosInvalidos.push({
        indice: index,
        dominio: vehiculo.dominio || '[Sin dominio]',
        errores: erroresVehiculo
      });
    }
  });
  
  // Si hay vehículos inválidos, agregar error general
  if (vehiculosInvalidos.length > 0) {
    errores.push(`${vehiculosInvalidos.length} vehículos contienen errores`);
    
    // Añadir detalles de los primeros 10 vehículos con errores
    vehiculosInvalidos.slice(0, 10).forEach(v => {
      errores.push(`Vehículo ${v.dominio} (índice ${v.indice}): ${v.errores.join(', ')}`);
    });
    
    if (vehiculosInvalidos.length > 10) {
      advertencias.push(`Se omitieron detalles de ${vehiculosInvalidos.length - 10} vehículos con errores adicionales`);
    }
  }
  
  // Advertencia si el lote es grande
  if (vehiculos.length > 100) {
    advertencias.push(`Carga masiva grande (${vehiculos.length} vehículos). Esto puede tardar varios segundos.`);
  }
  
  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    vehiculos // Devolvemos los vehículos con los dominios normalizados
  };
};

/**
 * @desc    Crear múltiples vehículos mediante carga masiva
 * @route   POST /api/vehiculos/bulk
 * @access  Private
 */
const createVehiculosBulk = async (req, res) => {
  const inicioTiempo = Date.now();
  logger.info(`Petición recibida: POST /api/vehiculos/bulk`);
  
  try {
    // Obtener los datos de los vehículos del cuerpo de la petición
    const { vehiculos } = req.body;
    
    if (!vehiculos) {
      logger.warn('Intento de carga masiva sin datos de vehículos');
      return res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionaron datos de vehículos',
        errores: ['Se requiere un array de vehículos en el campo "vehiculos"']
      });
    }
    
    logger.info(`Recibidos ${vehiculos.length} vehículos para carga masiva`);
    
    // Validar los datos de entrada
    const { valido, errores, advertencias, vehiculos: vehiculosValidados } = validarDatosMasivos(vehiculos);
    
    if (!valido) {
      logger.warn(`Validación fallida en carga masiva: ${errores.join(', ')}`);
      return res.status(400).json({
        exito: false,
        mensaje: 'La validación de datos ha fallado',
        errores,
        advertencias
      });
    }
    
    // Si hay advertencias, las registramos
    if (advertencias.length > 0) {
      logger.info(`Advertencias en carga masiva: ${advertencias.join(', ')}`);
    }
    
    // Procesar la carga masiva
    const resultado = await vehiculoService.createVehiculosBulk(vehiculosValidados);
    
    const tiempoTotal = Date.now() - inicioTiempo;
    logger.info(`Carga masiva completada: ${resultado.insertados} vehículos insertados (tiempo: ${tiempoTotal}ms)`);
    
    // Responder con éxito
    res.status(201).json({
      exito: true,
      mensaje: `Se cargaron ${resultado.insertados} vehículos correctamente`,
      datos: {
        total: resultado.insertados,
        tiempo: tiempoTotal,
        advertencias
      }
    });
  } catch (error) {
    const tiempoTotal = Date.now() - inicioTiempo;
    
    // Clasificar el tipo de error para dar respuestas específicas
    if (error.message.includes('dominios duplicados') || 
        error.message.includes('ya existen en la base de datos')) {
      logger.warn(`Error en carga masiva - Dominios duplicados: ${error.message} (tiempo: ${tiempoTotal}ms)`);
      return res.status(400).json({
        exito: false,
        mensaje: 'Hay dominios duplicados en la base de datos',
        error: error.message
      });
    }
    
    if (error.message.includes('empresas especificadas no existen')) {
      logger.warn(`Error en carga masiva - Empresas no válidas: ${error.message} (tiempo: ${tiempoTotal}ms)`);
      return res.status(400).json({
        exito: false,
        mensaje: 'Una o más empresas no existen en el sistema',
        error: error.message
      });
    }
    
    // Error general
    logger.error(`Error en carga masiva de vehículos: ${error.message} (tiempo: ${tiempoTotal}ms)`, error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar la carga masiva de vehículos',
      error: error.message
    });
  }
};

module.exports = createVehiculosBulk; 