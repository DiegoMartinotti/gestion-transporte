import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Viaje, { IViaje } from '../models/Viaje';
import logger from '../utils/logger';
import ApiResponseClass from '../utils/ApiResponse';
import Cliente, { ICliente } from '../models/Cliente';
import Personal, { IPersonal } from '../models/Personal';
import Vehiculo, { IVehiculo } from '../models/Vehiculo';
import Site, { ISite } from '../models/Site';
import Tramo, { ITramo } from '../models/Tramo';
import Empresa, { IEmpresa } from '../models/Empresa';
import mongoose from 'mongoose';
import ImportacionTemporal, { IImportacionTemporal } from '../models/ImportacionTemporal';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { ExcelTemplateService } from '../services/excelTemplateService';

// Importar controladores y servicios necesarios
import * as siteController from './siteController';
import * as personalController from './personalController';
import * as vehiculoService from '../services/vehiculo/vehiculoService';
import * as tramoService from '../services/tramo/tramoService';

/**
 * Interface for authenticated user in request
 */
interface AuthenticatedUser {
    id: string;
    email: string;
    roles?: string[];
}

/**
 * Interface for authenticated request
 */
interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        limit: number;
    };
}

/**
 * Interface for bulk import request
 */
interface BulkImportRequest {
    cliente: string;
    viajes: any[];
    erroresMapeo?: any[];
    sitesNoEncontrados?: string[];
    totalFilasConErrores?: number;
}

/**
 * Interface for pagination query
 */
interface PaginationQuery {
    page?: string;
    limit?: string;
    cliente?: string;
}

/**
 * Helper function to escape regex special characters
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getViajes = async (req: Request<{}, ApiResponse<IViaje[]>, {}, PaginationQuery>, res: Response<ApiResponse<IViaje[]>>): Promise<void> => {
    try {
        logger.debug('Obteniendo lista de viajes');
        
        // Parámetros de paginación
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const skip = (page - 1) * limit;
        
        // Construir el objeto de filtro
        const filter: any = {};
        if (req.query.cliente && Types.ObjectId.isValid(req.query.cliente)) {
            filter.cliente = req.query.cliente;
            logger.debug(`Filtrando viajes por cliente: ${req.query.cliente}`);
        } else {
            logger.debug('No se proporcionó un cliente válido para filtrar o no se proporcionó cliente. Devolviendo todos los viajes (paginados).');
        }

        // Contar el total de viajes para la metadata (considerando el filtro)
        const totalViajes = await Viaje.countDocuments(filter);
        
        // Obtener viajes con paginación, filtro y poblar datos relacionados
        const viajes = await Viaje.find(filter)
                               .populate({ path: 'cliente', select: 'nombre' })
                               .populate({ path: 'origen', select: 'Site nombre' })
                               .populate({ path: 'destino', select: 'Site nombre' })
                               .populate({ path: 'vehiculos.vehiculo', select: 'dominio' })
                               .sort({ fecha: -1 })
                               .skip(skip)
                               .limit(limit)
                               .lean();
                               
        logger.debug(`${viajes.length} viajes encontrados (página ${page} de ${Math.ceil(totalViajes / limit)}) con filtro:`, filter);
        
        // Devolver los viajes con metadata de paginación
        res.json({
            data: viajes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalViajes / limit),
                totalItems: totalViajes,
                limit: limit
            }
        });
    } catch (error) {
        logger.error('Error al obtener viajes:', error);
        res.status(500).json({ message: 'Error al obtener viajes' });
    }
};

export const getViajeById = async (req: AuthenticatedRequest, res: Response<IViaje | ApiResponse>): Promise<void> => {
    try {
        const viaje = await Viaje.findById(req.params.id);
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json(viaje);
    } catch (error) {
        logger.error('Error al obtener viaje:', error);
        res.status(500).json({ message: 'Error al obtener viaje' });
    }
};

export const createViaje = async (req: AuthenticatedRequest, res: Response<IViaje | ApiResponse>): Promise<void> => {
    try {
        const viajeData = req.body;
        
        // Si no se especifica tipoTramo, buscar el tipo con tarifa más alta
        if (!viajeData.tipoTramo && viajeData.origen && viajeData.destino && viajeData.cliente) {
            logger.debug('tipoTramo no especificado, buscando el tipo con tarifa más alta...');
            
            const tipoTramoOptimo = await tramoService.getTipoTramoConTarifaMasAlta(
                viajeData.origen,
                viajeData.destino,
                viajeData.cliente,
                viajeData.fecha ? new Date(viajeData.fecha) : new Date()
            );
            
            viajeData.tipoTramo = tipoTramoOptimo;
            logger.info(`Asignado tipoTramo automáticamente: ${tipoTramoOptimo}`);
        }
        
        // Asegurar que peaje y tarifa están presentes (serán calculados en pre('save'))
        if (typeof viajeData.peaje === 'undefined') {
            viajeData.peaje = 0; // Valor temporal, será calculado en pre('save')
        }
        if (typeof viajeData.tarifa === 'undefined') {
            viajeData.tarifa = 0; // Valor temporal, será calculado en pre('save')
        }
        
        const nuevoViaje = new Viaje(viajeData);
        await nuevoViaje.save();
        res.status(201).json(nuevoViaje);
    } catch (error) {
        logger.error('Error al crear viaje:', error);
        res.status(500).json({ message: 'Error al crear viaje' });
    }
};

export const updateViaje = async (req: AuthenticatedRequest, res: Response<IViaje | ApiResponse>): Promise<void> => {
    try {
        const viaje = await Viaje.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json(viaje);
    } catch (error) {
        logger.error('Error al actualizar viaje:', error);
        res.status(500).json({ message: 'Error al actualizar viaje' });
    }
};

export const deleteViaje = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
        const viaje = await Viaje.findByIdAndDelete(req.params.id);
        if (!viaje) {
            res.status(404).json({ message: 'Viaje no encontrado' });
            return;
        }
        res.json({ message: 'Viaje eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar viaje:', error);
        res.status(500).json({ message: 'Error al eliminar viaje' });
    }
};

/**
 * Crea múltiples viajes en una sola operación
 * 
 * @description Inicia el proceso de importación masiva de viajes en dos etapas.
 *              Etapa 1: Intenta importar todos los viajes, registra éxitos y fallos detallados.
 */
export const iniciarBulkImportViajes = async (req: Request<{}, ApiResponse, BulkImportRequest>, res: Response<ApiResponse>): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let importacionId: string | null = null;

    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            logger.error('ERROR: Cuerpo de solicitud vacío');
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'Cuerpo de solicitud vacío' });
            return;
        }

        const { cliente: clienteId, viajes, erroresMapeo, sitesNoEncontrados } = req.body;
        
        logger.debug('Datos recibidos para bulk import:', {
            clienteId,
            cantidadViajes: viajes?.length || 0,
            erroresMapeo: erroresMapeo?.length || 0,
            sitesNoEncontrados: sitesNoEncontrados?.length || 0
        });

        if (!Types.ObjectId.isValid(clienteId)) {
             await session.abortTransaction();
             session.endSession();
             res.status(400).json({ success: false, message: 'ID de Cliente inválido' });
             return;
        }

        if (!Array.isArray(viajes) || viajes.length === 0) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'Formato de datos inválido o sin viajes' });
            return;
        }

        // Registrar datos faltantes detectados en el frontend
        const missingSitesCount = sitesNoEncontrados?.length || 0;
        const failCountFromFrontend = erroresMapeo?.length || 0;

        // Crear registro de importación temporal
        const importacion = new ImportacionTemporal({
            cliente: clienteId,
            status: 'processing',
            failCountInitial: failCountFromFrontend,
            successCountInitial: 0,
            failureDetails: {
                missingSites: { 
                    count: missingSitesCount, 
                    details: sitesNoEncontrados || [] 
                },
                missingPersonal: { count: 0, details: [] },
                missingVehiculos: { count: 0, details: [] },
                missingTramos: { count: 0, details: [] },
                duplicateDt: { count: 0, details: [] },
                invalidData: { count: 0, details: [] },
            },
            failedTrips: erroresMapeo?.map((error: any, index: number) => ({
                originalIndex: error.fila,
                dt: String(`Viaje ${error.fila}`),
                reason: 'MISSING_SITE',
                message: error.error,
                data: {}
            })) || [],
        });
        await importacion.save({ session });
        importacionId = importacion._id?.toString() || null;

        const clienteDoc = await Cliente.findById(clienteId).session(session).lean();
        if (!clienteDoc) {
            if (importacionId) {
                await ImportacionTemporal.findByIdAndUpdate(
                    importacionId,
                    { status: 'failed', message: 'Cliente no encontrado' },
                    { session }
                );
            }
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: 'Cliente no encontrado' });
            return;
        }

        logger.info(`Iniciando importación masiva de viajes para cliente: ${clienteDoc.nombre} (${clienteId})`);
        logger.info(`Total de viajes a procesar: ${viajes.length}`);

        // Procesamiento de viajes
        let successCount = 0;
        let failCount = 0;
        const viajesCreados: any[] = [];
        const erroresDetallados: any[] = [];

        for (let i = 0; i < viajes.length; i++) {
            const viajeData = viajes[i];
            
            try {
                // Validar datos básicos
                if (!viajeData.fecha || !viajeData.origen || !viajeData.destino || !viajeData.dt) {
                    throw new Error('Faltan campos obligatorios: fecha, origen, destino o dt');
                }

                // Asignar cliente si no viene en los datos
                viajeData.cliente = viajeData.cliente || clienteId;

                // Si no se especifica tipoTramo, buscar el tipo con tarifa más alta
                if (!viajeData.tipoTramo) {
                    logger.debug(`Viaje DT ${viajeData.dt}: tipoTramo no especificado, buscando el tipo con tarifa más alta...`);
                    
                    const tipoTramoOptimo = await tramoService.getTipoTramoConTarifaMasAlta(
                        viajeData.origen,
                        viajeData.destino,
                        viajeData.cliente,
                        viajeData.fecha ? new Date(viajeData.fecha) : new Date()
                    );
                    
                    viajeData.tipoTramo = tipoTramoOptimo;
                    logger.info(`Viaje DT ${viajeData.dt}: Asignado tipoTramo automáticamente: ${tipoTramoOptimo}`);
                }
                
                // Asegurar que peaje y tarifa están presentes (serán calculados en pre('save'))
                if (typeof viajeData.peaje === 'undefined') {
                    viajeData.peaje = 0; // Valor temporal, será calculado en pre('save')
                }
                if (typeof viajeData.tarifa === 'undefined') {
                    viajeData.tarifa = 0; // Valor temporal, será calculado en pre('save')
                }

                // Validar datos antes de crear el viaje
                logger.debug(`Validando datos del viaje ${i + 1}:`, {
                    chofer: viajeData.chofer,
                    choferType: typeof viajeData.chofer,
                    dt: viajeData.dt,
                    origen: viajeData.origen,
                    destino: viajeData.destino
                });
                
                // Verificar que el chofer sea un ObjectId válido
                if (typeof viajeData.chofer === 'number') {
                    throw new Error(`Chofer inválido: recibido número ${viajeData.chofer}, se esperaba ObjectId`);
                }
                
                // Crear el viaje
                const nuevoViaje = new Viaje(viajeData);
                await nuevoViaje.save({ session });
                
                viajesCreados.push(nuevoViaje);
                successCount++;
                
            } catch (error: any) {
                failCount++;
                const errorMsg = error.message || 'Error desconocido';
                logger.error(`Error procesando viaje ${i + 1} (DT: ${viajeData.dt || 'sin DT'}):`, errorMsg);
                
                erroresDetallados.push({
                    indice: i + 1,
                    dt: viajeData.dt || 'sin DT',
                    error: errorMsg,
                    data: viajeData // Guardar los datos completos del viaje que falló
                });

                // Actualizar categorías de error en ImportacionTemporal
                if (importacionId) {
                    const updateData: any = {};
                    
                    if (errorMsg.includes('tramo') || errorMsg.includes('tarifa')) {
                        // Obtener nombres reales de los sites desde la BD
                        const origenSite = await Site.findById(viajeData.origen).select('nombre');
                        const destinoSite = await Site.findById(viajeData.destino).select('nombre');
                        
                        updateData['$inc'] = { 'failureDetails.missingTramos.count': 1 };
                        updateData['$push'] = { 
                            'failureDetails.missingTramos.details': {
                                origen: origenSite?.nombre || `ID: ${viajeData.origen}`,
                                destino: destinoSite?.nombre || `ID: ${viajeData.destino}`,
                                fecha: viajeData.fecha ? new Date(viajeData.fecha).toISOString().split('T')[0] : 'Fecha desconocida'
                            }
                        };
                    } else if (errorMsg.includes('chofer') || errorMsg.includes('personal')) {
                        updateData['$inc'] = { 'failureDetails.missingPersonal.count': 1 };
                        updateData['$push'] = { 'failureDetails.missingPersonal.details': String(viajeData.dt || `Viaje ${i + 1}`) };
                    } else if (errorMsg.includes('vehiculo')) {
                        updateData['$inc'] = { 'failureDetails.missingVehiculos.count': 1 };
                        updateData['$push'] = { 'failureDetails.missingVehiculos.details': String(viajeData.dt || `Viaje ${i + 1}`) };
                    } else if (errorMsg.includes('duplicate') || errorMsg.includes('dt')) {
                        updateData['$inc'] = { 'failureDetails.duplicateDt.count': 1 };
                        updateData['$push'] = { 'failureDetails.duplicateDt.details': String(viajeData.dt || `Viaje ${i + 1}`) };
                    } else {
                        updateData['$inc'] = { 'failureDetails.invalidData.count': 1 };
                        updateData['$push'] = { 'failureDetails.invalidData.details': String(viajeData.dt || `Viaje ${i + 1}`) };
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                        await ImportacionTemporal.findByIdAndUpdate(
                            importacionId,
                            updateData,
                            { session }
                        );
                    }
                }
            }
        }

        // Actualizar el estado final de la importación
        const totalFailCountFinal = failCount + failCountFromFrontend;
        if (importacionId) {
            await ImportacionTemporal.findByIdAndUpdate(
                importacionId,
                { 
                    status: 'completed',
                    successCountInitial: successCount,
                    failCountInitial: totalFailCountFinal,
                    message: `Importación completada: ${successCount} viajes creados, ${totalFailCountFinal} errores`,
                    failedTrips: [
                        ...(erroresMapeo?.map((error: any, index: number) => ({
                            originalIndex: error.fila,
                            dt: String(`Viaje ${error.fila}`),
                            reason: 'MISSING_SITE',
                            message: error.error,
                            data: {} // Los errores de mapeo no tienen datos completos
                        })) || []),
                        ...erroresDetallados.map(error => ({
                            originalIndex: error.indice,
                            dt: String(error.dt),
                            reason: 'PROCESSING_ERROR',
                            message: error.error,
                            data: error.data // Incluir los datos completos del viaje
                        }))
                    ]
                },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: `Importación completada: ${successCount} viajes creados, ${totalFailCountFinal} errores`,
            data: {
                importacionId,
                clienteId,
                totalViajes: viajes.length + failCountFromFrontend,
                successCount,
                failCount: totalFailCountFinal,
                viajesCreados: viajesCreados.map(v => v._id),
                erroresDetallados: [
                    ...(erroresMapeo || []),
                    ...erroresDetallados
                ],
                sitesNoEncontrados: sitesNoEncontrados || []
            }
        });

    } catch (error: any) {
        logger.error('Error en iniciarBulkImportViajes:', error);
        
        if (importacionId) {
            try {
                await ImportacionTemporal.findByIdAndUpdate(
                    importacionId,
                    { 
                        status: 'failed',
                        message: `Error durante importación: ${error.message}`
                    },
                    { session }
                );
            } catch (updateError) {
                logger.error('Error al actualizar estado de importación:', updateError);
            }
        }

        await session.abortTransaction();
        session.endSession();

        ApiResponseClass.error(
            res,
            'Error interno durante la importación',
            500,
            error.message
        );
    }
};

/**
 * Descargar plantilla Excel para viajes
 */
export const getViajeTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        await ExcelTemplateService.generateViajeTemplate(res);
    } catch (error) {
        logger.error('Error al generar plantilla de viajes:', error);
        res.status(500).json({ success: false, message: 'Error al generar plantilla' });
    }
};

/**
 * Descargar plantillas pre-rellenadas para corrección de datos faltantes
 */
export const descargarPlantillaCorreccion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { importId } = req.params;
        
        logger.info(`Solicitud de descarga de plantillas para importId: ${importId}`);
        
        if (!importId || !Types.ObjectId.isValid(importId)) {
            logger.error(`ID de importación inválido: ${importId}`);
            res.status(400).json({ 
                success: false, 
                message: 'ID de importación inválido' 
            });
            return;
        }

        // Buscar la importación temporal
        const importacion = await ImportacionTemporal.findById(importId).lean();
        logger.info(`Importación encontrada: ${!!importacion}`);
        
        if (!importacion) {
            logger.error(`Importación no encontrada para ID: ${importId}`);
            res.status(404).json({ 
                success: false, 
                message: 'Importación no encontrada o expirada' 
            });
            return;
        }
        
        logger.info(`Datos de la importación:`, {
            cliente: importacion.cliente,
            status: importacion.status,
            failureDetails: importacion.failureDetails
        });

        // Verificar que la importación tenga datos faltantes
        const hasFailures = importacion.failureDetails && (
            importacion.failureDetails.missingSites.count > 0 ||
            importacion.failureDetails.missingPersonal.count > 0 ||
            importacion.failureDetails.missingVehiculos.count > 0 ||
            importacion.failureDetails.missingTramos.count > 0
        );

        logger.info(`Tiene datos faltantes: ${hasFailures}`);
        logger.info(`Sites faltantes: ${importacion.failureDetails?.missingSites.count || 0}`);

        if (!hasFailures) {
            logger.error('No hay datos faltantes para esta importación');
            res.status(400).json({ 
                success: false, 
                message: 'No hay datos faltantes para esta importación' 
            });
            return;
        }

        // Generar las plantillas con datos faltantes
        await ExcelTemplateService.generateMissingDataTemplates(res, importacion);
        logger.info(`Plantillas de corrección generadas para importación ${importId}`);

    } catch (error: any) {
        logger.error('Error al generar plantillas de corrección:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al generar plantillas de corrección' 
        });
    }
};

/**
 * Procesar plantilla de corrección completada por el usuario
 */
export const procesarPlantillaCorreccion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { importId } = req.params;
        const file = req.file;

        logger.info(`Procesando plantilla de corrección para importId: ${importId}`);

        if (!importId || !Types.ObjectId.isValid(importId)) {
            res.status(400).json({ 
                success: false, 
                message: 'ID de importación inválido' 
            });
            return;
        }

        if (!file) {
            res.status(400).json({ 
                success: false, 
                message: 'No se recibió archivo Excel' 
            });
            return;
        }

        // Buscar la importación temporal
        const importacion = await ImportacionTemporal.findById(importId).lean();
        if (!importacion) {
            res.status(404).json({ 
                success: false, 
                message: 'Importación no encontrada o expirada' 
            });
            return;
        }

        logger.info(`Procesando archivo: ${file.originalname}, tamaño: ${file.size}`);

        // Procesar el archivo Excel con plantillas completadas
        const resultado = await ExcelTemplateService.processCorrectionTemplate(file.buffer, importacion);

        logger.info(`Plantilla de corrección procesada exitosamente para importación ${importId}`);

        res.json({
            success: true,
            message: 'Plantilla de corrección procesada exitosamente',
            data: resultado
        });

    } catch (error: any) {
        logger.error('Error al procesar plantilla de corrección:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error al procesar plantilla de corrección' 
        });
    }
};