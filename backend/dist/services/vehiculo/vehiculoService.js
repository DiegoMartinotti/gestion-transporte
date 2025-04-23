"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const getAllVehiculos = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (opciones = {}) {
    try {
        const { limite = 50, pagina = 1, filtros = {} } = opciones;
        const skip = (pagina - 1) * limite;
        logger.info(`Obteniendo vehículos: página ${pagina}, límite ${limite}, filtros: ${JSON.stringify(filtros)}`);
        // Creamos el objeto de consulta con los filtros
        const query = Object.assign({}, filtros);
        // Utilizamos lean() para mejorar rendimiento al obtener objetos simples
        // y limitar los campos que necesitamos con select
        const vehiculos = yield Vehiculo.find(query)
            .populate('empresa', 'nombre tipo')
            .limit(limite)
            .skip(skip)
            .lean()
            .exec();
        // Obtenemos el total para la paginación
        const total = yield Vehiculo.countDocuments(query);
        return {
            vehiculos,
            paginacion: {
                total,
                paginas: Math.ceil(total / limite),
                paginaActual: pagina,
                limite
            }
        };
    }
    catch (error) {
        logger.error('Error al obtener vehículos:', error);
        throw new Error(`Error al obtener vehículos: ${error.message}`);
    }
});
/**
 * Obtiene los vehículos de una empresa específica
 * @param {string} empresaId - ID de la empresa
 * @param {Object} opciones - Opciones de filtrado y paginación
 */
const getVehiculosByEmpresa = (empresaId_1, ...args_1) => __awaiter(void 0, [empresaId_1, ...args_1], void 0, function* (empresaId, opciones = {}) {
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
        const vehiculos = yield Vehiculo.find(query)
            .populate('empresa', 'nombre tipo')
            .limit(limite)
            .skip(skip)
            .lean()
            .exec();
        return vehiculos;
    }
    catch (error) {
        logger.error(`Error al obtener vehículos de la empresa ${empresaId}:`, error);
        throw new Error(`Error al obtener vehículos por empresa: ${error.message}`);
    }
});
/**
 * Obtiene un vehículo por su ID
 * @param {string} id - ID del vehículo
 */
const getVehiculoById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!id) {
            logger.warn('Se solicitó vehículo sin especificar ID');
            throw new Error('Se requiere el ID del vehículo');
        }
        logger.info(`Consultando vehículo con ID ${id}`);
        const vehiculo = yield Vehiculo.findById(id)
            .populate('empresa', 'nombre tipo')
            .lean()
            .exec();
        if (!vehiculo) {
            logger.warn(`Vehículo no encontrado: ${id}`);
            throw new Error('Vehículo no encontrado');
        }
        return vehiculo;
    }
    catch (error) {
        logger.error(`Error al obtener vehículo ${id}:`, error);
        throw error;
    }
});
/**
 * Crea un nuevo vehículo con transacción
 * @param {Object} vehiculoData - Datos del vehículo a crear
 */
const createVehiculo = (vehiculoData) => __awaiter(void 0, void 0, void 0, function* () {
    // Iniciamos sesión para la transacción
    const session = yield mongoose.startSession();
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
        const empresaExiste = yield Empresa.findById(vehiculoData.empresa).session(session);
        if (!empresaExiste) {
            logger.warn(`Empresa no encontrada al crear vehículo: ${vehiculoData.empresa}`);
            throw new Error('La empresa especificada no existe');
        }
        // Normalizamos el dominio (siempre en mayúsculas)
        vehiculoData.dominio = vehiculoData.dominio.toUpperCase();
        // Verificar si ya existe un vehículo con el mismo dominio
        const dominioExiste = yield Vehiculo.findOne({
            dominio: vehiculoData.dominio
        }).session(session);
        if (dominioExiste) {
            logger.warn(`Intento de crear vehículo con dominio duplicado: ${vehiculoData.dominio}`);
            throw new Error('Ya existe un vehículo con ese dominio');
        }
        // Creamos el vehículo dentro de la transacción
        const vehiculo = new Vehiculo(vehiculoData);
        const vehiculoGuardado = yield vehiculo.save({ session });
        logger.info(`Vehículo creado con ID: ${vehiculoGuardado._id}`);
        // Actualizar la referencia en la empresa
        yield Empresa.findByIdAndUpdate(vehiculoData.empresa, { $push: { flota: vehiculoGuardado._id } }, { session });
        logger.info(`Actualizada referencia en empresa ${vehiculoData.empresa}`);
        // Commit de la transacción
        yield session.commitTransaction();
        logger.info('Transacción completada: vehículo creado correctamente');
        return vehiculoGuardado;
    }
    catch (error) {
        // Rollback en caso de error
        yield session.abortTransaction();
        logger.error('Error en transacción al crear vehículo, rollback aplicado:', error);
        throw error;
    }
    finally {
        // Finalizamos la sesión
        session.endSession();
    }
});
/**
 * Actualiza un vehículo existente con transacción
 * @param {string} id - ID del vehículo a actualizar
 * @param {Object} vehiculoData - Nuevos datos del vehículo
 */
const updateVehiculo = (id, vehiculoData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose.startSession();
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
            const empresaExiste = yield Empresa.findById(vehiculoData.empresa).session(session);
            if (!empresaExiste) {
                logger.warn(`Empresa no encontrada al actualizar vehículo: ${vehiculoData.empresa}`);
                throw new Error('La empresa especificada no existe');
            }
        }
        // Verificar si el vehículo existe
        const vehiculo = yield Vehiculo.findById(id).session(session);
        if (!vehiculo) {
            logger.warn(`Vehículo no encontrado al actualizar: ${id}`);
            throw new Error('Vehículo no encontrado');
        }
        // Si se cambia el dominio, verificar que no exista otro con ese dominio
        if (vehiculoData.dominio) {
            // Normalizamos el dominio (siempre en mayúsculas)
            vehiculoData.dominio = vehiculoData.dominio.toUpperCase();
            if (vehiculoData.dominio !== vehiculo.dominio) {
                const dominioExiste = yield Vehiculo.findOne({
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
            yield Empresa.findByIdAndUpdate(vehiculo.empresa, { $pull: { flota: vehiculo._id } }, { session });
            // Agregar a la nueva empresa
            yield Empresa.findByIdAndUpdate(vehiculoData.empresa, { $push: { flota: vehiculo._id } }, { session });
        }
        // Actualizamos el vehículo dentro de la transacción
        const vehiculoActualizado = yield Vehiculo.findByIdAndUpdate(id, vehiculoData, { new: true, runValidators: true, session });
        logger.info(`Vehículo ${id} actualizado correctamente`);
        // Commit de la transacción
        yield session.commitTransaction();
        logger.info('Transacción completada: vehículo actualizado correctamente');
        return vehiculoActualizado;
    }
    catch (error) {
        // Rollback en caso de error
        yield session.abortTransaction();
        logger.error(`Error en transacción al actualizar vehículo ${id}, rollback aplicado:`, error);
        throw error;
    }
    finally {
        // Finalizamos la sesión
        session.endSession();
    }
});
/**
 * Elimina un vehículo con transacción
 * @param {string} id - ID del vehículo a eliminar
 */
const deleteVehiculo = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose.startSession();
    try {
        session.startTransaction();
        logger.info(`Iniciando transacción para eliminar vehículo ${id}`);
        // Validaciones previas
        if (!id) {
            throw new Error('Se requiere el ID del vehículo');
        }
        const vehiculo = yield Vehiculo.findById(id).session(session);
        if (!vehiculo) {
            logger.warn(`Vehículo no encontrado al eliminar: ${id}`);
            throw new Error('Vehículo no encontrado');
        }
        // Eliminar la referencia en la empresa
        yield Empresa.findByIdAndUpdate(vehiculo.empresa, { $pull: { flota: vehiculo._id } }, { session });
        logger.info(`Eliminada referencia en empresa ${vehiculo.empresa}`);
        // Eliminar el vehículo
        yield Vehiculo.findByIdAndDelete(id, { session });
        logger.info(`Vehículo ${id} eliminado correctamente`);
        // Commit de la transacción
        yield session.commitTransaction();
        logger.info('Transacción completada: vehículo eliminado correctamente');
        return { message: 'Vehículo eliminado correctamente' };
    }
    catch (error) {
        // Rollback en caso de error
        yield session.abortTransaction();
        logger.error(`Error en transacción al eliminar vehículo ${id}, rollback aplicado:`, error);
        throw error;
    }
    finally {
        // Finalizamos la sesión
        session.endSession();
    }
});
/**
 * Obtiene vehículos con documentación próxima a vencer
 * @param {number} dias - Días de límite para vencimiento
 */
const getVehiculosConVencimientos = (dias) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const diasLimite = parseInt(dias) || 30;
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(limite.getDate() + diasLimite);
        logger.info(`Consultando vehículos con vencimientos en los próximos ${diasLimite} días`);
        // Optimizamos la consulta con índices apropiados y lean()
        const vehiculos = yield Vehiculo.find({
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
    }
    catch (error) {
        logger.error('Error al obtener vehículos con vencimientos próximos:', error);
        throw new Error(`Error al obtener vehículos con vencimientos: ${error.message}`);
    }
});
/**
 * Obtiene vehículos con documentación vencida
 */
const getVehiculosVencidos = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hoy = new Date();
        logger.info('Consultando vehículos con documentación vencida');
        // Optimizamos la consulta con lean()
        const vehiculos = yield Vehiculo.find({
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
    }
    catch (error) {
        logger.error('Error al obtener vehículos con documentación vencida:', error);
        throw new Error(`Error al obtener vehículos vencidos: ${error.message}`);
    }
});
/**
 * Crea o actualiza vehículos masivamente desde la plantilla de corrección.
 * Resuelve la empresa por ID o Nombre.
 * Usa 'patenteFaltante' para buscar; si existe, actualiza; si no, crea.
 *
 * @param {Array<Object>} vehiculosData - Array con datos de vehículos extraídos de la plantilla.
 * @param {Object} options - Opciones, incluye la session de mongoose.
 * @returns {Promise<Object>} - Resultado con insertados, actualizados y errores.
 */
const createVehiculosBulk = (vehiculosData_1, ...args_1) => __awaiter(void 0, [vehiculosData_1, ...args_1], void 0, function* (vehiculosData, options = {}) {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores = [];
    const operations = []; // Array para bulkWrite [{updateOne: {...}}, {insertOne: {...}}]
    if (!Array.isArray(vehiculosData) || vehiculosData.length === 0) {
        return { success: false, insertados, actualizados, errores: [{ message: 'No vehicle data provided for bulk operation.' }] };
    }
    logger.info(`[createVehiculosBulk] Iniciando proceso para ${vehiculosData.length} vehículos.`);
    // 1. Resolver Empresas
    const empresaIdentifiers = [...new Set(vehiculosData.map(v => v.empresa).filter(e => e))];
    const empresaIds = empresaIdentifiers.filter(id => mongoose.Types.ObjectId.isValid(id));
    const empresaNombres = empresaIdentifiers.filter(id => !mongoose.Types.ObjectId.isValid(id));
    const empresasFoundById = yield Empresa.find({ _id: { $in: empresaIds } }).session(session).lean();
    const empresasFoundByName = yield Empresa.find({ nombre: { $in: empresaNombres } }).session(session).lean();
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
    const vehiculosExistentes = yield Vehiculo.find({ dominio: { $in: patentesFaltantes } }).session(session).lean();
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
        let empresaId = null;
        const empresaKey = typeof item.empresa === 'string' ? item.empresa.toLowerCase() : item.empresa;
        if (mongoose.Types.ObjectId.isValid(item.empresa)) {
            empresaId = empresaMap.get(item.empresa.toString());
        }
        else if (typeof empresaKey === 'string') {
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
        }
        else {
            // Preparar inserción
            operations.push({
                insertOne: {
                    document: Object.assign({ dominio: patente }, vehiculoDataToSet)
                }
            });
        }
    }
    // 4. Ejecutar bulkWrite
    if (operations.length > 0) {
        try {
            const result = yield Vehiculo.bulkWrite(operations, { session, ordered: false });
            insertados = result.insertedCount;
            actualizados = result.modifiedCount;
            logger.info(`[createVehiculosBulk] BulkWrite completado. Insertados: ${insertados}, Actualizados: ${actualizados}`);
            // Manejar errores de escritura individuales
            if (result.hasWriteErrors()) {
                result.getWriteErrors().forEach(err => {
                    var _a, _b;
                    // Intentar mapear el error al índice original (puede ser complejo)
                    const opType = err.op.insertOne ? 'insert' : 'update';
                    const targetDomain = err.op.insertOne ? err.op.insertOne.document.dominio : (_b = (_a = err.op.updateOne) === null || _a === void 0 ? void 0 : _a.filter) === null || _b === void 0 ? void 0 : _b.dominio; // Puede ser _id
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
                const vehiculosInsertados = yield Vehiculo.find({ _id: { $in: insertedIds } }).session(session).lean();
                const vehiculosPorEmpresa = {};
                vehiculosInsertados.forEach(vehiculo => {
                    const empresaIdStr = vehiculo.empresa.toString();
                    if (!vehiculosPorEmpresa[empresaIdStr])
                        vehiculosPorEmpresa[empresaIdStr] = [];
                    vehiculosPorEmpresa[empresaIdStr].push(vehiculo._id);
                });
                const actualizacionesEmpresas = Object.entries(vehiculosPorEmpresa).map(([empresaId, vehiculosIds]) => Empresa.findByIdAndUpdate(empresaId, { $push: { flota: { $each: vehiculosIds } } }, { session }));
                yield Promise.all(actualizacionesEmpresas);
                logger.info(`[createVehiculosBulk] Actualizadas referencias en ${actualizacionesEmpresas.length} empresas para vehículos nuevos.`);
            }
        }
        catch (error) {
            logger.error('[createVehiculosBulk] Error durante bulkWrite:', error);
            errores.push({ message: `Error general durante bulkWrite: ${error.message}` });
        }
    }
    else {
        logger.info('[createVehiculosBulk] No se prepararon operaciones válidas.');
    }
    return {
        success: errores.length === 0,
        insertados,
        actualizados,
        errores
    };
});
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
//# sourceMappingURL=vehiculoService.js.map