import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Viaje from '../../models/Viaje';
import Cliente, { ICliente } from '../../models/Cliente';
import Site from '../../models/Site';
import ImportacionTemporal from '../../models/ImportacionTemporal';
import mongoose from 'mongoose';
import logger from '../../utils/logger';
import ApiResponseClass from '../../utils/ApiResponse';
import * as tramoService from '../../services/tramo/tramoService';

/**
 * Interface for bulk import request
 */
interface BulkImportRequest {
    cliente: string;
    viajes: unknown[];
    erroresMapeo?: unknown[];
    sitesNoEncontrados?: string[];
    totalFilasConErrores?: number;
}

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
}

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
            failedTrips: erroresMapeo?.map((error: unknown, index: number) => ({
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
        const viajesCreados: unknown[] = [];
        const erroresDetallados: unknown[] = [];

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
                
            } catch (error: unknown) {
                failCount++;
                const errorMsg = (error instanceof Error ? error.message : String(error)) || 'Error desconocido';
                logger.error(`Error procesando viaje ${i + 1} (DT: ${viajeData.dt || 'sin DT'}):`, errorMsg);
                
                erroresDetallados.push({
                    indice: i + 1,
                    dt: viajeData.dt || 'sin DT',
                    error: errorMsg,
                    data: viajeData // Guardar los datos completos del viaje que falló
                });

                // Actualizar categorías de error en ImportacionTemporal
                if (importacionId) {
                    const updateData: unknown = {};
                    
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
                        ...(erroresMapeo?.map((error: unknown, index: number) => ({
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

    } catch (error: unknown) {
        logger.error('Error en iniciarBulkImportViajes:', error);
        
        if (importacionId) {
            try {
                await ImportacionTemporal.findByIdAndUpdate(
                    importacionId,
                    { 
                        status: 'failed',
                        message: `Error durante importación: ${(error instanceof Error ? error.message : String(error))}`
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
            (error instanceof Error ? error.message : String(error))
        );
    }
};