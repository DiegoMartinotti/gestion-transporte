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
    body: { personal: any[] };
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
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
        registro: any;
        error: string;
    }>;
}

/**
 * Importar personal masivamente
 */
export const bulkImportPersonal = async (req: AuthenticatedRequest, res: Response<BulkImportResult | ApiResponse>): Promise<void> => {
    try {
        const { personal } = req.body;
        
        if (!Array.isArray(personal) || personal.length === 0) {
            res.status(400).json({ error: 'No se proporcionaron datos de personal para importar' });
            return;
        }
        
        const results: BulkImportResult = {
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
                } else {
                    throw new Error('El ID de empresa es obligatorio');
                }
                
                // Crear un objeto con la estructura correcta para el modelo
                const personalData: any = {
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
                    if (!personalData.contacto) personalData.contacto = {};
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
                } else {
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
            } catch (error: any) {
                logger.error(`Error al procesar registro de personal #${i + 1}:`, error);
                results.errores.push({
                    indice: i,
                    registro: personal[i],
                    error: error.message
                });
            }
        }
        
        res.status(200).json(results);
    } catch (error) {
        logger.error('Error al importar personal masivamente:', error);
        res.status(500).json({ error: 'Error al importar personal masivamente' });
    }
};