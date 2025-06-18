import Vehiculo from '../../models/Vehiculo';
import Empresa from '../../models/Empresa';
import mongoose from 'mongoose';
import logger from '../../utils/logger';

interface PaginationOptions {
  limite?: number;
  pagina?: number;
  filtros?: Record<string, any>;
}

interface PaginationResult<T> {
  vehiculos: T[];
  paginacion: {
    total: number;
    paginas: number;
    paginaActual: number;
    limite: number;
  };
}

interface VehiculoData {
  dominio?: string;
  empresa?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  documentacion?: {
    seguro?: { vencimiento?: Date };
    vtv?: { vencimiento?: Date };
    ruta?: { vencimiento?: Date };
    senasa?: { vencimiento?: Date };
  };
}

interface VehiculoBulkData {
  patenteFaltante: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  empresa: string;
}

interface BulkCreateResult {
  success: boolean;
  insertados: number;
  actualizados: number;
  errores: Array<{
    index?: number | string;
    message: string;
    code?: number;
    data?: any;
  }>;
}

/**
 * Obtiene todos los vehículos con información de empresa
 * Optimizado para paginar resultados y mejorar rendimiento
 * @param opciones - Opciones de filtrado y paginación
 */
const getAllVehiculos = async (opciones: PaginationOptions = {}): Promise<PaginationResult<any>> => {
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
    throw new Error(`Error al obtener vehículos: ${(error as Error).message}`);
  }
};

/**
 * Obtiene los vehículos de una empresa específica
 * @param empresaId - ID de la empresa
 * @param opciones - Opciones de filtrado y paginación
 */
const getVehiculosByEmpresa = async (empresaId: string, opciones: PaginationOptions = {}): Promise<any[]> => {
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
    throw new Error(`Error al obtener vehículos por empresa: ${(error as Error).message}`);
  }
};

/**
 * Obtiene un vehículo por su ID
 * @param id - ID del vehículo
 */
const getVehiculoById = async (id: string): Promise<any> => {
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
 * @param vehiculoData - Datos del vehículo a crear
 */
const createVehiculo = async (vehiculoData: VehiculoData): Promise<any> => {
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
 * @param id - ID del vehículo a actualizar
 * @param vehiculoData - Nuevos datos del vehículo
 */
const updateVehiculo = async (id: string, vehiculoData: VehiculoData): Promise<any> => {
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
 * @param id - ID del vehículo a eliminar
 */
const deleteVehiculo = async (id: string): Promise<{ message: string }> => {
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
 * @param dias - Días de límite para vencimiento
 */
const getVehiculosConVencimientos = async (dias: number): Promise<any[]> => {
  try {
    const diasLimite = parseInt(String(dias)) || 30;
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
    throw new Error(`Error al obtener vehículos con vencimientos: ${(error as Error).message}`);
  }
};

/**
 * Obtiene vehículos con documentación vencida
 */
const getVehiculosVencidos = async (): Promise<any[]> => {
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
    throw new Error(`Error al obtener vehículos vencidos: ${(error as Error).message}`);
  }
};

/**
 * Crea o actualiza vehículos masivamente desde la plantilla de corrección.
 * Resuelve la empresa por ID o Nombre.
 * Usa 'patenteFaltante' para buscar; si existe, actualiza; si no, crea.
 *
 * @param vehiculosData - Array con datos de vehículos extraídos de la plantilla.
 * @param options - Opciones, incluye la session de mongoose.
 * @returns Resultado con insertados, actualizados y errores.
 */
const createVehiculosBulk = async (vehiculosData: VehiculoBulkData[], options: { session?: mongoose.ClientSession } = {}): Promise<BulkCreateResult> => {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores: BulkCreateResult['errores'] = [];
    const operations: any[] = []; // Array para bulkWrite [{updateOne: {...}}, {insertOne: {...}}]

    if (!Array.isArray(vehiculosData) || vehiculosData.length === 0) {
        return { success: false, insertados, actualizados, errores: [{ message: 'No vehicle data provided for bulk operation.' }] };
    }
    logger.info(`[createVehiculosBulk] Iniciando proceso para ${vehiculosData.length} vehículos.`);

    // 1. Resolver Empresas
    const empresaIdentifiers = [...new Set(vehiculosData.map(v => v.empresa).filter(e => e))];
    const empresaIds = empresaIdentifiers.filter(id => mongoose.Types.ObjectId.isValid(id));
    const empresaNombres = empresaIdentifiers.filter(id => !mongoose.Types.ObjectId.isValid(id));

    const empresasFoundById = await Empresa.find({ _id: { $in: empresaIds } }).session(session).lean();
    const empresasFoundByName = await Empresa.find({ nombre: { $in: empresaNombres } }).session(session).lean();
    const empresaMap = new Map();
    [...empresasFoundById, ...empresasFoundByName].forEach(emp => {
        empresaMap.set(emp._id.toString(), emp._id);
        if (emp.nombre) {
            empresaMap.set(emp.nombre.toLowerCase(), emp._id);
        }
    });
    logger.debug(`[createVehiculosBulk] Empresas resueltas: ${empresaMap.size} encontradas.`);

    // 2. Buscar Vehículos Existentes por patenteFaltante (dominio)
    const patentesFaltantes = vehiculosData.map(v => String(v.patenteFaltante || '').trim().toUpperCase()).filter(p => p);
    const vehiculosExistentes = await Vehiculo.find({ dominio: { $in: patentesFaltantes } }).session(session).lean();
    const vehiculosExistentesMap = new Map(vehiculosExistentes.map(v => [v.dominio, v]));
    logger.debug(`[createVehiculosBulk] Vehículos existentes encontrados: ${vehiculosExistentesMap.size}`);

    // 3. Procesar cada registro y preparar operaciones
    for (const [index, item] of vehiculosData.entries()) {
        const patente = String(item.patenteFaltante || '').trim().toUpperCase();

        // Validar campos básicos (patente, tipo, empresa)
        if (!patente || !item.tipo || !item.empresa) {
            errores.push({ index, message: 'Faltan campos requeridos (Patente Faltante, Tipo, Empresa)', data: item });
            continue;
        }

        // Resolver Empresa ID
        let empresaId: mongoose.Types.ObjectId | null = null;
        const empresaKey = typeof item.empresa === 'string' ? item.empresa.toLowerCase() : item.empresa;
        if (mongoose.Types.ObjectId.isValid(item.empresa)) {
            empresaId = empresaMap.get(item.empresa.toString());
        } else if (typeof empresaKey === 'string') {
            empresaId = empresaMap.get(empresaKey);
        }

        if (!empresaId) {
            errores.push({ index, message: `Empresa '${item.empresa}' no encontrada o inválida`, data: item });
            continue;
        }

        const vehiculoDataToSet = {
            tipo: item.tipo,
            marca: item.marca || null,
            modelo: item.modelo || null,
            anio: item.anio || null,
            empresa: empresaId,
            // Otros campos relevantes del modelo Vehiculo podrían ir aquí
        };

        const vehiculoExistente = vehiculosExistentesMap.get(patente);

        if (vehiculoExistente) {
            // Preparar actualización
            operations.push({
                updateOne: {
                    filter: { _id: vehiculoExistente._id },
                    update: { $set: vehiculoDataToSet }
                }
            });
        } else {
            // Preparar inserción
            operations.push({
                insertOne: {
                    document: {
                        dominio: patente, // Usar patenteFaltante como dominio
                        ...vehiculoDataToSet
                    }
                }
            });
        }
    }

    // 4. Ejecutar bulkWrite
    if (operations.length > 0) {
        try {
            const result = await Vehiculo.bulkWrite(operations, { session, ordered: false });
            insertados = result.insertedCount;
            actualizados = result.modifiedCount;
            logger.info(`[createVehiculosBulk] BulkWrite completado. Insertados: ${insertados}, Actualizados: ${actualizados}`);

            // Manejar errores de escritura individuales
            if (result.hasWriteErrors()) {
                 result.getWriteErrors().forEach(err => {
                     // Intentar mapear el error al índice original (puede ser complejo)
                     const opType = err.op.insertOne ? 'insert' : 'update';
                     const targetDomain = err.op.insertOne ? err.op.insertOne.document.dominio : err.op.updateOne?.filter?.dominio; // Puede ser _id
                     const originalIndex = vehiculosData.findIndex(v => String(v.patenteFaltante || '').trim().toUpperCase() === targetDomain);

                    errores.push({
                        index: originalIndex !== -1 ? originalIndex : 'N/A',
                        message: `Error en operación ${opType} para patente ${targetDomain || 'desconocida'}: ${err.errmsg}`,
                        code: err.code,
                        data: err.op // Contiene la operación fallida
                    });
                 });
                 logger.warn(`[createVehiculosBulk] ${errores.length} errores durante bulkWrite.`);
            }

             // Actualizar referencias en empresas (solo para los insertados)
             const insertedIds = result.getInsertedIds().map(idInfo => idInfo._id);
             if (insertedIds.length > 0) {
                 const vehiculosInsertados = await Vehiculo.find({ _id: { $in: insertedIds } }).session(session).lean();
                 const vehiculosPorEmpresa: Record<string, mongoose.Types.ObjectId[]> = {};
                 vehiculosInsertados.forEach(vehiculo => {
                     const empresaIdStr = vehiculo.empresa.toString();
                     if (!vehiculosPorEmpresa[empresaIdStr]) vehiculosPorEmpresa[empresaIdStr] = [];
                     vehiculosPorEmpresa[empresaIdStr].push(vehiculo._id);
                 });

                 const actualizacionesEmpresas = Object.entries(vehiculosPorEmpresa).map(([empresaId, vehiculosIds]) =>
                     Empresa.findByIdAndUpdate(empresaId, { $push: { flota: { $each: vehiculosIds } } }, { session })
                 );
                 await Promise.all(actualizacionesEmpresas);
                 logger.info(`[createVehiculosBulk] Actualizadas referencias en ${actualizacionesEmpresas.length} empresas para vehículos nuevos.`);
             }

        } catch (error) {
            logger.error('[createVehiculosBulk] Error durante bulkWrite:', error);
            errores.push({ message: `Error general durante bulkWrite: ${(error as Error).message}` });
        }
    } else {
        logger.info('[createVehiculosBulk] No se prepararon operaciones válidas.');
    }

    return {
        success: errores.length === 0,
        insertados,
        actualizados,
        errores
    };
};

export {
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