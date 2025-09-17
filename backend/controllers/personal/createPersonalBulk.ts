// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Types } from 'mongoose';
import Personal from '../../models/Personal';
import Empresa from '../../models/Empresa';
import logger from '../../utils/logger';

/**
 * Interface for bulk create result
 */
interface BulkCreateResult {
    success: boolean;
    insertados: number;
    actualizados: number;
    errores: Array<{
        index?: number | string;
        message: string;
        code?: string | number;
        data?: unknown;
    }>;
}

/**
 * Interface for personal data in bulk operations
 */
interface PersonalBulkData {
    nombre: string;
    apellido: string;
    dni: string;
    tipo: string;
    empresa: string | Types.ObjectId;
    legajo?: string;
    activar?: boolean;
    telefono?: string;
    email?: string;
    direccion?: string;
    fechaNacimiento?: string | Date;
    licenciaConducir?: string;
    cargo?: string;
    observaciones?: string;
}

/**
 * Crea o activa personal masivamente desde la plantilla de corrección.
 * Resuelve la empresa por ID o Nombre.
 * Activa personal existente si se indica.
 * 
 * @param personalData - Array con datos de personal extraídos de la plantilla.
 * @param options - Opciones, incluye la session de mongoose.
 * @returns Resultado con insertados, actualizados y errores.
 */
export const createPersonalBulk = async (personalData: PersonalBulkData[], options: { session?: unknown } = {}): Promise<BulkCreateResult> => {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores: BulkCreateResult['errores'] = [];
    const personalToInsert: unknown[] = [];
    const personalToActivate: Array<{ filter: unknown; update: unknown }> = [];

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
        if (Types.ObjectId.isValid(item.empresa as string)) {
            empresaId = empresaMap.get(item.empresa.toString());
        } else if (typeof empresaKey === 'string') {
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
        } else {
            // Preparar para inserción (asegurándose de que activo sea false)
            personalToInsert.push({ ...newItemData, activo: false });
        }
    }

    // 3. Realizar operaciones de activación (Update)
    if (personalToActivate.length > 0) {
        try {
            // Usar bulkWrite para actualizaciones individuales eficientes
            const activationOps = personalToActivate.map(op => ({updateOne: op }));
            const activationResult = await Personal.bulkWrite(activationOps, { session, ordered: false });
            actualizados = activationResult.modifiedCount || 0;
            logger.info(`[createPersonalBulk] Intentos de activación: ${personalToActivate.length}, Activados/Actualizados: ${actualizados}`);
            
            // Registrar errores de activación si los hubiera (aunque ordered:false los ignora)
            if (activationResult.hasWriteErrors && activationResult.hasWriteErrors()) {
                 (activationResult as unknown).getWriteErrors().forEach((err: unknown) => {
                    // Es difícil mapear el error al índice original aquí sin más lógica
                    errores.push({ index: 'N/A', message: `Error activando personal (DNI: ${(err as any).op?.filter?.dni}): ${err.errmsg}`, code: err.code });
                 });
            }

        } catch (error: unknown) {
            logger.error('[createPersonalBulk] Error durante bulkWrite de activación:', error);
            errores.push({ message: `Error general durante la activación: ${(error instanceof Error ? error.message : String(error))}` });
        }
    }

    // 4. Realizar operaciones de inserción (InsertMany)
    if (personalToInsert.length > 0) {
        try {
            const insertResult = await Personal.insertMany(personalToInsert, { session, ordered: false });
            insertados = insertResult.length;
            logger.info(`[createPersonalBulk] Insertados ${insertados} nuevos registros de personal.`);
        } catch (error: unknown) {
            logger.error('[createPersonalBulk] Error durante insertMany:', error);
            if ((error as any).name === 'MongoBulkWriteError' && error.writeErrors) {
                error.writeErrors.forEach((err: unknown) => {
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
            } else {
                errores.push({ message: `Error inesperado en bulk insert: ${(error instanceof Error ? error.message : String(error))}` });
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