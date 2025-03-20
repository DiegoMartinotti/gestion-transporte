const Vehiculo = require('../../models/Vehiculo');
const Empresa = require('../../models/Empresa');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');

/**
 * Obtiene todos los vehículos con información de empresa
 * Optimizado para paginar resultados y mejorar rendimiento
 * @param {Object} opciones - Opciones de filtrado y paginación
 * @param {number} opciones.limite - Número máximo de resultados
 * @param {number} opciones.pagina - Número de página
 * @param {Object} opciones.filtros - Filtros adicionales
 */
const getAllVehiculos = async (opciones = {}) => {
  try {
    const { limite = 50, pagina = 1, filtros = {} } = opciones;
    const skip = (pagina - 1) * limite;
    
    logger.info(`Obteniendo vehículos: página ${pagina}, límite ${limite}, filtros: ${JSON.stringify(filtros)}`);
    
    // Creamos el objeto de consulta con los filtros
    const query = { ...filtros };
    
    // Utilizamos lean() para mejorar rendimiento al obtener objetos simples
    // y limitar los campos que necesitamos con select
    const vehiculos = await Vehiculo.find(query)
      .populate('empresa', 'nombre tipo')
      .limit(limite)
      .skip(skip)
      .lean()
      .exec();
    
    // Obtenemos el total para la paginación
    const total = await Vehiculo.countDocuments(query);
    
    return {
      vehiculos,
      paginacion: {
        total,
        paginas: Math.ceil(total / limite),
        paginaActual: pagina,
        limite
      }
    };
  } catch (error) {
    logger.error('Error al obtener vehículos:', error);
    throw new Error(`Error al obtener vehículos: ${error.message}`);
  }
};

/**
 * Obtiene los vehículos de una empresa específica
 * @param {string} empresaId - ID de la empresa
 * @param {Object} opciones - Opciones de filtrado y paginación
 */
const getVehiculosByEmpresa = async (empresaId, opciones = {}) => {
  try {
    if (!empresaId) {
      logger.warn('Se solicitaron vehículos sin especificar empresa');
      throw new Error('Se requiere el ID de la empresa');
    }
    
    const { limite = 100, pagina = 1 } = opciones;
    const skip = (pagina - 1) * limite;
    
    logger.info(`Consultando vehículos de empresa ${empresaId}`);
    
    // Optimizamos la consulta con índices
    const query = { empresa: empresaId };
    
    const vehiculos = await Vehiculo.find(query)
      .populate('empresa', 'nombre tipo')
      .limit(limite)
      .skip(skip)
      .lean()
      .exec();
    
    return vehiculos;
  } catch (error) {
    logger.error(`Error al obtener vehículos de la empresa ${empresaId}:`, error);
    throw new Error(`Error al obtener vehículos por empresa: ${error.message}`);
  }
};

/**
 * Obtiene un vehículo por su ID
 * @param {string} id - ID del vehículo
 */
const getVehiculoById = async (id) => {
  try {
    if (!id) {
      logger.warn('Se solicitó vehículo sin especificar ID');
      throw new Error('Se requiere el ID del vehículo');
    }
    
    logger.info(`Consultando vehículo con ID ${id}`);
    
    const vehiculo = await Vehiculo.findById(id)
      .populate('empresa', 'nombre tipo')
      .lean()
      .exec();
      
    if (!vehiculo) {
      logger.warn(`Vehículo no encontrado: ${id}`);
      throw new Error('Vehículo no encontrado');
    }
    
    return vehiculo;
  } catch (error) {
    logger.error(`Error al obtener vehículo ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo vehículo con transacción
 * @param {Object} vehiculoData - Datos del vehículo a crear
 */
const createVehiculo = async (vehiculoData) => {
  // Iniciamos sesión para la transacción
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    logger.info('Iniciando transacción para crear vehículo');
    
    // Validaciones previas
    if (!vehiculoData) {
      throw new Error('No se proporcionaron datos del vehículo');
    }
    
    if (!vehiculoData.dominio) {
      throw new Error('El dominio del vehículo es obligatorio');
    }
    
    if (!vehiculoData.empresa) {
      throw new Error('La empresa del vehículo es obligatoria');
    }
    
    // Verificar que la empresa existe
    const empresaExiste = await Empresa.findById(vehiculoData.empresa).session(session);
    if (!empresaExiste) {
      logger.warn(`Empresa no encontrada al crear vehículo: ${vehiculoData.empresa}`);
      throw new Error('La empresa especificada no existe');
    }

    // Normalizamos el dominio (siempre en mayúsculas)
    vehiculoData.dominio = vehiculoData.dominio.toUpperCase();
    
    // Verificar si ya existe un vehículo con el mismo dominio
    const dominioExiste = await Vehiculo.findOne({ 
      dominio: vehiculoData.dominio 
    }).session(session);
    
    if (dominioExiste) {
      logger.warn(`Intento de crear vehículo con dominio duplicado: ${vehiculoData.dominio}`);
      throw new Error('Ya existe un vehículo con ese dominio');
    }

    // Creamos el vehículo dentro de la transacción
    const vehiculo = new Vehiculo(vehiculoData);
    const vehiculoGuardado = await vehiculo.save({ session });
    
    logger.info(`Vehículo creado con ID: ${vehiculoGuardado._id}`);
    
    // Actualizar la referencia en la empresa
    await Empresa.findByIdAndUpdate(
      vehiculoData.empresa,
      { $push: { flota: vehiculoGuardado._id } },
      { session }
    );
    
    logger.info(`Actualizada referencia en empresa ${vehiculoData.empresa}`);

    // Commit de la transacción
    await session.commitTransaction();
    logger.info('Transacción completada: vehículo creado correctamente');
    
    return vehiculoGuardado;
  } catch (error) {
    // Rollback en caso de error
    await session.abortTransaction();
    logger.error('Error en transacción al crear vehículo, rollback aplicado:', error);
    throw error;
  } finally {
    // Finalizamos la sesión
    session.endSession();
  }
};

/**
 * Actualiza un vehículo existente con transacción
 * @param {string} id - ID del vehículo a actualizar
 * @param {Object} vehiculoData - Nuevos datos del vehículo
 */
const updateVehiculo = async (id, vehiculoData) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    logger.info(`Iniciando transacción para actualizar vehículo ${id}`);
    
    // Validaciones previas
    if (!id) {
      throw new Error('Se requiere el ID del vehículo');
    }
    
    if (!vehiculoData) {
      throw new Error('No se proporcionaron datos para actualizar');
    }
    
    // Verificar que la empresa existe si se está cambiando
    if (vehiculoData.empresa) {
      const empresaExiste = await Empresa.findById(vehiculoData.empresa).session(session);
      if (!empresaExiste) {
        logger.warn(`Empresa no encontrada al actualizar vehículo: ${vehiculoData.empresa}`);
        throw new Error('La empresa especificada no existe');
      }
    }

    // Verificar si el vehículo existe
    const vehiculo = await Vehiculo.findById(id).session(session);
    if (!vehiculo) {
      logger.warn(`Vehículo no encontrado al actualizar: ${id}`);
      throw new Error('Vehículo no encontrado');
    }

    // Si se cambia el dominio, verificar que no exista otro con ese dominio
    if (vehiculoData.dominio) {
      // Normalizamos el dominio (siempre en mayúsculas)
      vehiculoData.dominio = vehiculoData.dominio.toUpperCase();
      
      if (vehiculoData.dominio !== vehiculo.dominio) {
        const dominioExiste = await Vehiculo.findOne({ 
          dominio: vehiculoData.dominio,
          _id: { $ne: id } // Excluimos el vehículo actual
        }).session(session);
        
        if (dominioExiste) {
          logger.warn(`Intento de actualizar vehículo con dominio duplicado: ${vehiculoData.dominio}`);
          throw new Error('Ya existe un vehículo con ese dominio');
        }
      }
    }

    // Si se cambia la empresa, actualizar las referencias
    if (vehiculoData.empresa && vehiculoData.empresa.toString() !== vehiculo.empresa.toString()) {
      // Eliminar de la empresa anterior
      logger.info(`Cambiando vehículo de empresa: ${vehiculo.empresa} -> ${vehiculoData.empresa}`);
      
      await Empresa.findByIdAndUpdate(
        vehiculo.empresa,
        { $pull: { flota: vehiculo._id } },
        { session }
      );
      
      // Agregar a la nueva empresa
      await Empresa.findByIdAndUpdate(
        vehiculoData.empresa,
        { $push: { flota: vehiculo._id } },
        { session }
      );
    }

    // Actualizamos el vehículo dentro de la transacción
    const vehiculoActualizado = await Vehiculo.findByIdAndUpdate(
      id,
      vehiculoData,
      { new: true, runValidators: true, session }
    );
    
    logger.info(`Vehículo ${id} actualizado correctamente`);

    // Commit de la transacción
    await session.commitTransaction();
    logger.info('Transacción completada: vehículo actualizado correctamente');
    
    return vehiculoActualizado;
  } catch (error) {
    // Rollback en caso de error
    await session.abortTransaction();
    logger.error(`Error en transacción al actualizar vehículo ${id}, rollback aplicado:`, error);
    throw error;
  } finally {
    // Finalizamos la sesión
    session.endSession();
  }
};

/**
 * Elimina un vehículo con transacción
 * @param {string} id - ID del vehículo a eliminar
 */
const deleteVehiculo = async (id) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    logger.info(`Iniciando transacción para eliminar vehículo ${id}`);
    
    // Validaciones previas
    if (!id) {
      throw new Error('Se requiere el ID del vehículo');
    }
    
    const vehiculo = await Vehiculo.findById(id).session(session);
    
    if (!vehiculo) {
      logger.warn(`Vehículo no encontrado al eliminar: ${id}`);
      throw new Error('Vehículo no encontrado');
    }

    // Eliminar la referencia en la empresa
    await Empresa.findByIdAndUpdate(
      vehiculo.empresa,
      { $pull: { flota: vehiculo._id } },
      { session }
    );
    
    logger.info(`Eliminada referencia en empresa ${vehiculo.empresa}`);

    // Eliminar el vehículo
    await Vehiculo.findByIdAndDelete(id, { session });
    logger.info(`Vehículo ${id} eliminado correctamente`);
    
    // Commit de la transacción
    await session.commitTransaction();
    logger.info('Transacción completada: vehículo eliminado correctamente');
    
    return { message: 'Vehículo eliminado correctamente' };
  } catch (error) {
    // Rollback en caso de error
    await session.abortTransaction();
    logger.error(`Error en transacción al eliminar vehículo ${id}, rollback aplicado:`, error);
    throw error;
  } finally {
    // Finalizamos la sesión
    session.endSession();
  }
};

/**
 * Obtiene vehículos con documentación próxima a vencer
 * @param {number} dias - Días de límite para vencimiento
 */
const getVehiculosConVencimientos = async (dias) => {
  try {
    const diasLimite = parseInt(dias) || 30;
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + diasLimite);
    
    logger.info(`Consultando vehículos con vencimientos en los próximos ${diasLimite} días`);

    // Optimizamos la consulta con índices apropiados y lean()
    const vehiculos = await Vehiculo.find({
      $or: [
        { 'documentacion.seguro.vencimiento': { $gte: hoy, $lte: limite } },
        { 'documentacion.vtv.vencimiento': { $gte: hoy, $lte: limite } },
        { 'documentacion.ruta.vencimiento': { $gte: hoy, $lte: limite } },
        { 'documentacion.senasa.vencimiento': { $gte: hoy, $lte: limite } }
      ]
    })
    .populate('empresa', 'nombre tipo')
    .lean()
    .exec();
    
    return vehiculos;
  } catch (error) {
    logger.error('Error al obtener vehículos con vencimientos próximos:', error);
    throw new Error(`Error al obtener vehículos con vencimientos: ${error.message}`);
  }
};

/**
 * Obtiene vehículos con documentación vencida
 */
const getVehiculosVencidos = async () => {
  try {
    const hoy = new Date();
    
    logger.info('Consultando vehículos con documentación vencida');

    // Optimizamos la consulta con lean()
    const vehiculos = await Vehiculo.find({
      $or: [
        { 'documentacion.seguro.vencimiento': { $lt: hoy } },
        { 'documentacion.vtv.vencimiento': { $lt: hoy } },
        { 'documentacion.ruta.vencimiento': { $lt: hoy } },
        { 'documentacion.senasa.vencimiento': { $lt: hoy } }
      ]
    })
    .populate('empresa', 'nombre tipo')
    .lean()
    .exec();
    
    return vehiculos;
  } catch (error) {
    logger.error('Error al obtener vehículos con documentación vencida:', error);
    throw new Error(`Error al obtener vehículos vencidos: ${error.message}`);
  }
};

/**
 * Crea múltiples vehículos en una operación (carga masiva) con transacción
 * @param {Array} vehiculos - Array de datos de vehículos a crear
 */
const createVehiculosBulk = async (vehiculos) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    logger.info('Iniciando transacción para carga masiva de vehículos');
    
    // Validaciones previas
    if (!vehiculos || !Array.isArray(vehiculos) || vehiculos.length === 0) {
      throw new Error('No se proporcionaron vehículos para cargar');
    }

    logger.info(`Procesando carga masiva de ${vehiculos.length} vehículos`);

    // Validar que todos los vehículos tengan los campos requeridos
    const vehiculosInvalidos = vehiculos.filter(v => !v.dominio || !v.tipo || !v.empresa);
    if (vehiculosInvalidos.length > 0) {
      logger.warn(`Datos inválidos en carga masiva: ${vehiculosInvalidos.length} vehículos sin campos requeridos`);
      throw new Error('Algunos vehículos no tienen los campos requeridos (dominio, tipo, empresa)');
    }

    // Verificar que todas las empresas existan
    const empresasIds = [...new Set(vehiculos.map(v => v.empresa))];
    const empresasExistentes = await Empresa.find({ 
      _id: { $in: empresasIds } 
    }).session(session);
    
    if (empresasExistentes.length !== empresasIds.length) {
      logger.warn('Empresas no encontradas en carga masiva');
      throw new Error('Una o más empresas especificadas no existen');
    }

    // Normalizamos los dominios (siempre en mayúsculas)
    const dominios = vehiculos.map(v => v.dominio.toUpperCase());
    
    // Verificar dominios duplicados en la base de datos
    const dominiosExistentes = await Vehiculo.find({ 
      dominio: { $in: dominios } 
    }).session(session);
    
    if (dominiosExistentes.length > 0) {
      const dominiosRepetidos = dominiosExistentes.map(v => v.dominio).join(', ');
      logger.warn(`Dominios duplicados en carga masiva: ${dominiosRepetidos}`);
      throw new Error(`Algunos dominios ya existen en la base de datos: ${dominiosRepetidos}`);
    }

    // Verificar dominios duplicados en la carga
    const dominiosUnicos = new Set(dominios);
    if (dominiosUnicos.size !== dominios.length) {
      logger.warn('Dominios duplicados dentro de la carga masiva');
      throw new Error('Hay dominios duplicados en la carga');
    }

    // Preparar los vehículos para inserción
    const vehiculosPreparados = vehiculos.map(v => ({
      ...v,
      dominio: v.dominio.toUpperCase()
    }));

    // Insertar los vehículos en la base de datos dentro de la transacción
    const vehiculosInsertados = await Vehiculo.insertMany(
      vehiculosPreparados, 
      { session }
    );
    
    logger.info(`Insertados ${vehiculosInsertados.length} vehículos`);

    // Actualizar las referencias en las empresas
    // Agrupamos por empresa para reducir el número de operaciones
    const vehiculosPorEmpresa = {};
    
    vehiculosInsertados.forEach(vehiculo => {
      const empresaId = vehiculo.empresa.toString();
      if (!vehiculosPorEmpresa[empresaId]) {
        vehiculosPorEmpresa[empresaId] = [];
      }
      vehiculosPorEmpresa[empresaId].push(vehiculo._id);
    });
    
    // Actualizamos cada empresa con todos sus vehículos de una vez
    const actualizacionesEmpresas = Object.entries(vehiculosPorEmpresa).map(([empresaId, vehiculosIds]) => {
      return Empresa.findByIdAndUpdate(
        empresaId,
        { $push: { flota: { $each: vehiculosIds } } },
        { session }
      );
    });
    
    await Promise.all(actualizacionesEmpresas);
    logger.info(`Actualizadas referencias en ${actualizacionesEmpresas.length} empresas`);

    // Commit de la transacción
    await session.commitTransaction();
    logger.info('Transacción completada: carga masiva finalizada correctamente');

    return {
      message: 'Vehículos cargados exitosamente',
      insertados: vehiculosInsertados.length,
      vehiculos: vehiculosInsertados
    };
  } catch (error) {
    // Rollback en caso de error
    await session.abortTransaction();
    logger.error('Error en transacción de carga masiva, rollback aplicado:', error);
    throw error;
  } finally {
    // Finalizamos la sesión
    session.endSession();
  }
};

module.exports = {
  getAllVehiculos,
  getVehiculosByEmpresa,
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getVehiculosConVencimientos,
  getVehiculosVencidos,
  createVehiculosBulk
}; 