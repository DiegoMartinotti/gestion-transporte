import { Types } from 'mongoose';
import Personal from '../models/Personal';
import Empresa from '../models/Empresa';
import logger from '../utils/logger';
/**
 * Obtener todos los registros de personal
 */
export const getAllPersonal = async (req, res) => {
    try {
        const { empresaId } = req.query;
        let query = {};
        if (empresaId && typeof empresaId === 'string') {
            query.empresa = empresaId;
        }
        const personal = await Personal.find(query)
            .populate('empresa', 'nombre tipo')
            .sort({ nombre: 1 });
        res.status(200).json(personal);
    }
    catch (error) {
        logger.error('Error al obtener personal:', error);
        res.status(500).json({ error: 'Error al obtener personal' });
    }
};
/**
 * Obtener un registro de personal por ID
 */
export const getPersonalById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: 'ID de personal inválido' });
            return;
        }
        const personal = await Personal.findById(id)
            .populate('empresa', 'nombre tipo');
        if (!personal) {
            res.status(404).json({ error: 'Personal no encontrado' });
            return;
        }
        res.status(200).json(personal);
    }
    catch (error) {
        logger.error('Error al obtener personal por ID:', error);
        res.status(500).json({ error: 'Error al obtener personal por ID' });
    }
};
/**
 * Crear un nuevo registro de personal
 */
export const createPersonal = async (req, res) => {
    try {
        const personalData = req.body;
        // Verificar si la empresa existe
        if (personalData.empresa) {
            const empresaExists = await Empresa.findById(personalData.empresa);
            if (!empresaExists) {
                res.status(400).json({ error: 'La empresa especificada no existe' });
                return;
            }
        }
        // Si no se proporciona un período de empleo, crear uno con la fecha actual
        if (!personalData.periodosEmpleo || personalData.periodosEmpleo.length === 0) {
            personalData.periodosEmpleo = [{
                    fechaIngreso: new Date(),
                    categoria: 'Inicial'
                }];
        }
        // Crear el registro de personal
        const personal = new Personal(personalData);
        await personal.save();
        res.status(201).json(personal);
    }
    catch (error) {
        logger.error('Error al crear personal:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.code === 11000) {
            res.status(400).json({ error: 'Ya existe un registro con ese DNI' });
            return;
        }
        res.status(500).json({ error: 'Error al crear personal' });
    }
};
/**
 * Actualizar un registro de personal
 */
export const updatePersonal = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: 'ID de personal inválido' });
            return;
        }
        // Verificar si la empresa existe si se está actualizando
        if (updateData.empresa) {
            const empresaExists = await Empresa.findById(updateData.empresa);
            if (!empresaExists) {
                res.status(400).json({ error: 'La empresa especificada no existe' });
                return;
            }
        }
        const personal = await Personal.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!personal) {
            res.status(404).json({ error: 'Personal no encontrado' });
            return;
        }
        res.status(200).json(personal);
    }
    catch (error) {
        logger.error('Error al actualizar personal:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error.code === 11000) {
            res.status(400).json({ error: 'Ya existe un registro con ese DNI' });
            return;
        }
        res.status(500).json({ error: 'Error al actualizar personal' });
    }
};
/**
 * Eliminar un registro de personal
 */
export const deletePersonal = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: 'ID de personal inválido' });
            return;
        }
        const personal = await Personal.findByIdAndDelete(id);
        if (!personal) {
            res.status(404).json({ error: 'Personal no encontrado' });
            return;
        }
        res.status(200).json({ message: 'Personal eliminado correctamente' });
    }
    catch (error) {
        logger.error('Error al eliminar personal:', error);
        res.status(500).json({ error: 'Error al eliminar personal' });
    }
};
/**
 * Importar personal masivamente
 */
export const bulkImportPersonal = async (req, res) => {
    try {
        const { personal } = req.body;
        if (!Array.isArray(personal) || personal.length === 0) {
            res.status(400).json({ error: 'No se proporcionaron datos de personal para importar' });
            return;
        }
        const results = {
            total: personal.length,
            exitosos: 0,
            errores: []
        };
        // Procesar cada registro de personal
        for (let i = 0; i < personal.length; i++) {
            try {
                const item = personal[i];
                // Verificar si la empresa existe
                if (item.empresaId) {
                    const empresaExists = await Empresa.findById(item.empresaId);
                    if (!empresaExists) {
                        throw new Error(`La empresa con ID ${item.empresaId} no existe`);
                    }
                    // Asignar el ID de empresa al campo correcto
                    item.empresa = item.empresaId;
                    delete item.empresaId;
                }
                else {
                    throw new Error('El ID de empresa es obligatorio');
                }
                // Crear un objeto con la estructura correcta para el modelo
                const personalData = {
                    nombre: item.nombre,
                    apellido: item.apellido,
                    dni: item.dni,
                    empresa: item.empresa,
                    activo: item.activo
                };
                // Agregar campos opcionales si existen
                if (item.telefono) {
                    personalData.contacto = {
                        telefono: item.telefono
                    };
                }
                if (item.email) {
                    if (!personalData.contacto)
                        personalData.contacto = {};
                    personalData.contacto.email = item.email;
                }
                if (item.direccion) {
                    personalData.direccion = {
                        calle: item.direccion
                    };
                }
                if (item.fechaNacimiento) {
                    personalData.fechaNacimiento = new Date(item.fechaNacimiento);
                }
                if (item.licenciaConducir) {
                    personalData.documentacion = {
                        licenciaConducir: {
                            numero: item.licenciaConducir
                        }
                    };
                }
                if (item.cargo) {
                    personalData.tipo = item.cargo;
                }
                else {
                    personalData.tipo = 'Otro';
                }
                if (item.observaciones) {
                    personalData.observaciones = item.observaciones;
                }
                // Agregar período de empleo con fecha actual
                personalData.periodosEmpleo = [{
                        fechaIngreso: new Date(),
                        categoria: item.cargo || 'Inicial'
                    }];
                // Crear el registro de personal
                const nuevoPersonal = new Personal(personalData);
                await nuevoPersonal.save();
                results.exitosos++;
            }
            catch (error) {
                logger.error(`Error al procesar registro de personal #${i + 1}:`, error);
                results.errores.push({
                    indice: i,
                    registro: personal[i],
                    error: error.message
                });
            }
        }
        res.status(200).json(results);
    }
    catch (error) {
        logger.error('Error al importar personal masivamente:', error);
        res.status(500).json({ error: 'Error al importar personal masivamente' });
    }
};
/**
 * Crea o activa personal masivamente desde la plantilla de corrección.
 * Resuelve la empresa por ID o Nombre.
 * Activa personal existente si se indica.
 *
 * @param personalData - Array con datos de personal extraídos de la plantilla.
 * @param options - Opciones, incluye la session de mongoose.
 * @returns Resultado con insertados, actualizados y errores.
 */
export const createPersonalBulk = async (personalData, options = {}) => {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores = [];
    const personalToInsert = [];
    const personalToActivate = [];
    if (!Array.isArray(personalData) || personalData.length === 0) {
        return { success: false, insertados, actualizados, errores: [{ message: 'No personal data provided for bulk operation.' }] };
    }
    // 1. Resolver Empresas (Obtener todos los nombres/IDs necesarios)
    const empresaIdentifiers = [...new Set(personalData.map(p => p.empresa).filter(e => e))];
    const empresaIds = empresaIdentifiers.filter(id => Types.ObjectId.isValid(id));
    const empresaNombres = empresaIdentifiers.filter(id => !Types.ObjectId.isValid(id));
    const empresasFoundById = await Empresa.find({ _id: { $in: empresaIds } }).session(session).lean();
    const empresasFoundByName = await Empresa.find({ nombre: { $in: empresaNombres } }).session(session).lean();
    const empresaMap = new Map();
    [...empresasFoundById, ...empresasFoundByName].forEach(emp => {
        empresaMap.set(emp._id.toString(), emp._id); // Mapear por ID
        if (emp.nombre) {
            empresaMap.set(emp.nombre.toLowerCase(), emp._id); // Mapear por nombre (lowercase)
        }
    });
    // 2. Procesar cada registro
    for (const [index, item] of personalData.entries()) {
        // Validar campos básicos
        if (!item.nombre || !item.apellido || !item.dni || !item.tipo || !item.empresa) {
            errores.push({ index, message: 'Faltan campos requeridos (Nombre, Apellido, DNI, Tipo, Empresa)', data: item });
            continue;
        }
        // Resolver Empresa ID
        let empresaId = null;
        const empresaKey = typeof item.empresa === 'string' ? item.empresa.toLowerCase() : item.empresa;
        if (Types.ObjectId.isValid(item.empresa)) {
            empresaId = empresaMap.get(item.empresa.toString());
        }
        else if (typeof empresaKey === 'string') {
            empresaId = empresaMap.get(empresaKey);
        }
        if (!empresaId) {
            errores.push({ index, message: `Empresa '${item.empresa}' no encontrada o inválida`, data: item });
            continue;
        }
        const newItemData = {
            nombre: item.nombre,
            apellido: item.apellido,
            dni: item.dni,
            legajo: item.legajo || null,
            tipo: item.tipo,
            empresa: empresaId,
            activo: item.activar || false // Por defecto inactivo si no se especifica activar
            // Añadir otros campos por defecto si es necesario
        };
        if (item.activar) {
            // Buscar personal inactivo por DNI para activarlo
            personalToActivate.push({
                filter: { dni: item.dni, activo: false },
                update: { $set: { ...newItemData, activo: true } } // Actualizar con los nuevos datos y activar
            });
        }
        else {
            // Preparar para inserción (asegurándose de que activo sea false)
            personalToInsert.push({ ...newItemData, activo: false });
        }
    }
    // 3. Realizar operaciones de activación (Update)
    if (personalToActivate.length > 0) {
        try {
            // Usar bulkWrite para actualizaciones individuales eficientes
            const activationOps = personalToActivate.map(op => ({ updateOne: op }));
            const activationResult = await Personal.bulkWrite(activationOps, { session, ordered: false });
            actualizados = activationResult.modifiedCount || 0;
            logger.info(`[createPersonalBulk] Intentos de activación: ${personalToActivate.length}, Activados/Actualizados: ${actualizados}`);
            // Registrar errores de activación si los hubiera (aunque ordered:false los ignora)
            if (activationResult.hasWriteErrors && activationResult.hasWriteErrors()) {
                activationResult.getWriteErrors().forEach((err) => {
                    // Es difícil mapear el error al índice original aquí sin más lógica
                    errores.push({ index: 'N/A', message: `Error activando personal (DNI: ${err.op?.filter?.dni}): ${err.errmsg}`, code: err.code });
                });
            }
        }
        catch (error) {
            logger.error('[createPersonalBulk] Error durante bulkWrite de activación:', error);
            errores.push({ message: `Error general durante la activación: ${error.message}` });
        }
    }
    // 4. Realizar operaciones de inserción (InsertMany)
    if (personalToInsert.length > 0) {
        try {
            const insertResult = await Personal.insertMany(personalToInsert, { session, ordered: false });
            insertados = insertResult.length;
            logger.info(`[createPersonalBulk] Insertados ${insertados} nuevos registros de personal.`);
        }
        catch (error) {
            logger.error('[createPersonalBulk] Error durante insertMany:', error);
            if (error.name === 'MongoBulkWriteError' && error.writeErrors) {
                error.writeErrors.forEach((err) => {
                    // Mapear error al índice original si es posible (requiere mantener correlación)
                    const originalIndex = personalData.findIndex(p => p.dni === personalToInsert[err.index]?.dni && !p.activar); // Intento de mapeo
                    errores.push({
                        index: originalIndex !== -1 ? originalIndex : 'N/A',
                        message: `Error al insertar DNI ${personalToInsert[err.index]?.dni}: ${err.errmsg}`,
                        code: err.code,
                        data: personalToInsert[err.index]
                    });
                });
                insertados = error.result?.nInserted || (personalToInsert.length - error.writeErrors.length);
            }
            else {
                errores.push({ message: `Error inesperado en bulk insert: ${error.message}` });
                insertados = 0;
            }
        }
    }
    return {
        success: errores.length === 0,
        insertados,
        actualizados,
        errores
    };
};
//# sourceMappingURL=personalController.js.map