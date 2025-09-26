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
 * Resuelve empresas por ID o nombre y crea un mapa para búsquedas rápidas
 */
async function resolveEmpresas(personalData: PersonalBulkData[], session: unknown) {
  const empresaIdentifiers = [...new Set(personalData.map((p) => p.empresa).filter((e) => e))];
  const empresaIds = empresaIdentifiers.filter((id) => Types.ObjectId.isValid(id));
  const empresaNombres = empresaIdentifiers.filter((id) => !Types.ObjectId.isValid(id));

  const empresasFoundById = await Empresa.find({ _id: { $in: empresaIds } })
    .session(session)
    .lean();
  const empresasFoundByName = await Empresa.find({ nombre: { $in: empresaNombres } })
    .session(session)
    .lean();
  const empresaMap = new Map();
  [...empresasFoundById, ...empresasFoundByName].forEach((emp) => {
    empresaMap.set(emp._id.toString(), emp._id);
    if (emp.nombre) {
      empresaMap.set(emp.nombre.toLowerCase(), emp._id);
    }
  });
  return empresaMap;
}

/**
 * Valida los campos requeridos de un item de personal
 */
function validatePersonalItem(item: PersonalBulkData): boolean {
  return !!(item.nombre && item.apellido && item.dni && item.tipo && item.empresa);
}

/**
 * Resuelve el ID de empresa desde el mapa
 */
function resolveEmpresaId(
  empresa: string | Types.ObjectId,
  empresaMap: Map<string, Types.ObjectId>
): Types.ObjectId | null {
  const empresaKey = typeof empresa === 'string' ? empresa.toLowerCase() : empresa;
  if (Types.ObjectId.isValid(empresa as string)) {
    return empresaMap.get(empresa.toString());
  } else if (typeof empresaKey === 'string') {
    return empresaMap.get(empresaKey);
  }
  return null;
}

/**
 * Procesa los datos de personal y los clasifica para inserción o activación
 */
function processPersonalData(
  personalData: PersonalBulkData[],
  empresaMap: Map<string, Types.ObjectId>,
  errores: BulkCreateResult['errores']
) {
  const personalToInsert: Record<string, unknown>[] = [];
  const personalToActivate: Array<{
    filter: Record<string, unknown>;
    update: Record<string, unknown>;
  }> = [];

  for (const [index, item] of personalData.entries()) {
    if (!validatePersonalItem(item)) {
      errores.push({
        index,
        message: 'Faltan campos requeridos (Nombre, Apellido, DNI, Tipo, Empresa)',
        data: item,
      });
      continue;
    }

    const empresaId = resolveEmpresaId(item.empresa, empresaMap);
    if (!empresaId) {
      errores.push({
        index,
        message: `Empresa '${item.empresa}' no encontrada o inválida`,
        data: item,
      });
      continue;
    }

    const newItemData = {
      nombre: item.nombre,
      apellido: item.apellido,
      dni: item.dni,
      legajo: item.legajo || null,
      tipo: item.tipo,
      empresa: empresaId,
      activo: item.activar || false,
    };

    if (item.activar) {
      personalToActivate.push({
        filter: { dni: item.dni, activo: false },
        update: { $set: { ...newItemData, activo: true } },
      });
    } else {
      personalToInsert.push({ ...newItemData, activo: false });
    }
  }

  return { personalToInsert, personalToActivate };
}

/**
 * Crea o activa personal masivamente desde la plantilla de corrección.
 */
export const createPersonalBulk = async (
  personalData: PersonalBulkData[],
  options: { session?: unknown } = {}
): Promise<BulkCreateResult> => {
  const session = options.session;
  let insertados = 0;
  let actualizados = 0;
  const errores: BulkCreateResult['errores'] = [];

  if (!Array.isArray(personalData) || personalData.length === 0) {
    return {
      success: false,
      insertados,
      actualizados,
      errores: [{ message: 'No personal data provided for bulk operation.' }],
    };
  }

  const empresaMap = await resolveEmpresas(personalData, session);
  const { personalToInsert, personalToActivate } = processPersonalData(
    personalData,
    empresaMap,
    errores
  );

  if (personalToActivate.length > 0) {
    actualizados = await performActivations(personalToActivate, session, errores);
  }

  if (personalToInsert.length > 0) {
    insertados = await performInsertions(personalToInsert, personalData, session, errores);
  }

  return {
    success: errores.length === 0,
    insertados,
    actualizados,
    errores,
  };
};

/**
 * Realiza operaciones de activación de personal
 */
async function performActivations(
  personalToActivate: Array<{ filter: unknown; update: unknown }>,
  session: unknown,
  errores: BulkCreateResult['errores']
): Promise<number> {
  try {
    const activationOps = personalToActivate.map((op) => ({ updateOne: op }));
    const activationResult = await Personal.bulkWrite(activationOps, { session, ordered: false });
    const actualizados = activationResult.modifiedCount || 0;
    logger.info(
      `[createPersonalBulk] Intentos de activación: ${personalToActivate.length}, Activados/Actualizados: ${actualizados}`
    );

    if (activationResult.hasWriteErrors && activationResult.hasWriteErrors()) {
      (activationResult as unknown).getWriteErrors().forEach((err: unknown) => {
        const mongoError = err as {
          op?: { filter?: { dni?: string } };
          errmsg?: string;
          code?: number;
        };
        errores.push({
          index: 'N/A',
          message: `Error activando personal (DNI: ${mongoError.op?.filter?.dni}): ${mongoError.errmsg}`,
          code: mongoError.code,
        });
      });
    }

    return actualizados;
  } catch (error: unknown) {
    logger.error('[createPersonalBulk] Error durante bulkWrite de activación:', error);
    errores.push({
      message: `Error general durante la activación: ${error instanceof Error ? error.message : String(error)}`,
    });
    return 0;
  }
}

/**
 * Realiza operaciones de inserción de personal
 */
async function performInsertions(
  personalToInsert: unknown[],
  personalData: PersonalBulkData[],
  session: unknown,
  errores: BulkCreateResult['errores']
): Promise<number> {
  try {
    const insertResult = await Personal.insertMany(personalToInsert, { session, ordered: false });
    const insertados = insertResult.length;
    logger.info(`[createPersonalBulk] Insertados ${insertados} nuevos registros de personal.`);
    return insertados;
  } catch (error: unknown) {
    logger.error('[createPersonalBulk] Error durante insertMany:', error);
    const bulkError = error as { name?: string; writeErrors?: Array<{ index: number }> };
    if (bulkError.name === 'MongoBulkWriteError' && bulkError.writeErrors) {
      bulkError.writeErrors.forEach((err: unknown) => {
        const originalIndex = personalData.findIndex(
          (p) => p.dni === personalToInsert[err.index]?.dni && !p.activar
        );
        errores.push({
          index: originalIndex !== -1 ? originalIndex : 'N/A',
          message: `Error al insertar DNI ${personalToInsert[err.index]?.dni}: ${err.errmsg}`,
          code: err.code,
          data: personalToInsert[err.index],
        });
      });
      return error.result?.nInserted || personalToInsert.length - error.writeErrors.length;
    } else {
      errores.push({
        message: `Error inesperado en bulk insert: ${error instanceof Error ? error.message : String(error)}`,
      });
      return 0;
    }
  }
}
