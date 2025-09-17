// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Response } from 'express';
import { Types } from 'mongoose';
import Personal from '../../models/Personal';
import Empresa from '../../models/Empresa';
import logger from '../../utils/logger';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: string[];
  empresa?: Types.ObjectId;
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  body: { personal: Record<string, unknown>[] };
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = Record<string, unknown>> {
  success?: boolean;
  data?: T;
  message?: string;
  count?: number;
  error?: string;
}

/**
 * Interface for bulk import result
 */
interface BulkImportResult {
  total: number;
  exitosos: number;
  errores: Array<{
    indice: number;
    registro: Record<string, unknown>;
    error: string;
  }>;
}

/**
 * Interface for personal data item
 */
interface PersonalDataItem extends Record<string, unknown> {
  empresaId?: string;
  empresa?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  activo?: boolean;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string | Date;
  licenciaConducir?: string;
  cargo?: string;
  observaciones?: string;
}

/**
 * Valida que la empresa existe
 */
async function validateEmpresa(empresaId?: string): Promise<string> {
  if (!empresaId) {
    throw new Error('El ID de empresa es obligatorio');
  }

  const empresaExists = await Empresa.findById(empresaId);
  if (!empresaExists) {
    throw new Error(`La empresa con ID ${empresaId} no existe`);
  }

  return empresaId;
}

/**
 * Construye los datos de contacto del personal
 */
function buildContactData(item: PersonalDataItem): Record<string, unknown> | undefined {
  if (!item.telefono && !item.email) {
    return undefined;
  }

  const contacto: Record<string, unknown> = {};
  if (item.telefono) {
    contacto.telefono = item.telefono;
  }
  if (item.email) {
    contacto.email = item.email;
  }

  return contacto;
}

/**
 * Construye los datos de dirección del personal
 */
function buildDireccionData(direccion?: string): Record<string, unknown> | undefined {
  return direccion ? { calle: direccion } : undefined;
}

/**
 * Construye los datos de documentación del personal
 */
function buildDocumentacionData(licenciaConducir?: string): Record<string, unknown> | undefined {
  return licenciaConducir
    ? {
        licenciaConducir: {
          numero: licenciaConducir,
        },
      }
    : undefined;
}

/**
 * Transforma un item de entrada en datos del modelo Personal
 */
function transformPersonalData(item: PersonalDataItem, empresaId: string): Record<string, unknown> {
  const personalData: Record<string, unknown> = {
    nombre: item.nombre,
    apellido: item.apellido,
    dni: item.dni,
    empresa: empresaId,
    activo: item.activo,
    tipo: item.cargo || 'Otro',
  };

  const contacto = buildContactData(item);
  if (contacto) {
    personalData.contacto = contacto;
  }

  const direccion = buildDireccionData(item.direccion as string);
  if (direccion) {
    personalData.direccion = direccion;
  }

  if (item.fechaNacimiento) {
    personalData.fechaNacimiento = new Date(item.fechaNacimiento);
  }

  const documentacion = buildDocumentacionData(item.licenciaConducir as string);
  if (documentacion) {
    personalData.documentacion = documentacion;
  }

  if (item.observaciones) {
    personalData.observaciones = item.observaciones;
  }

  // Agregar período de empleo con fecha actual
  personalData.periodosEmpleo = [
    {
      fechaIngreso: new Date(),
      categoria: item.cargo || 'Inicial',
    },
  ];

  return personalData;
}

/**
 * Procesa un único registro de personal
 */
async function processPersonalRecord(item: PersonalDataItem): Promise<void> {
  const empresaId = await validateEmpresa(item.empresaId as string);
  const personalData = transformPersonalData(item, empresaId);

  const nuevoPersonal = new Personal(personalData);
  await nuevoPersonal.save();
}

/**
 * Importar personal masivamente
 */
export const bulkImportPersonal = async (
  req: AuthenticatedRequest,
  res: Response<BulkImportResult | ApiResponse>
): Promise<void> => {
  try {
    const { personal } = req.body;

    if (!Array.isArray(personal) || personal.length === 0) {
      res.status(400).json({ error: 'No se proporcionaron datos de personal para importar' });
      return;
    }

    const results: BulkImportResult = {
      total: personal.length,
      exitosos: 0,
      errores: [],
    };

    // Procesar cada registro de personal
    for (let i = 0; i < personal.length; i++) {
      try {
        await processPersonalRecord(personal[i] as PersonalDataItem);
        results.exitosos++;
      } catch (error: unknown) {
        logger.error(`Error al procesar registro de personal #${i + 1}:`, error);
        const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Error desconocido';
        results.errores.push({
          indice: i,
          registro: personal[i],
          error: errorMessage,
        });
      }
    }

    res.status(200).json(results);
  } catch (error) {
    logger.error('Error al importar personal masivamente:', error);
    res.status(500).json({ error: 'Error al importar personal masivamente' });
  }
};
