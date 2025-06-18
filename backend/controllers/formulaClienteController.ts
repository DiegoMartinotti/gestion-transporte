import { Request, Response } from 'express';
import { Types } from 'mongoose';
import FormulasPersonalizadasCliente, { IFormulasPersonalizadasCliente } from '../models/FormulasPersonalizadasCliente';
import Cliente, { ICliente } from '../models/Cliente';
import logger from '../utils/logger';
import mongoose from 'mongoose';

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
    error?: string;
    overlappingFormula?: IFormulasPersonalizadasCliente;
}

/**
 * Interface for formula creation request
 */
interface FormulaCreateRequest {
    clienteId: string;
    tipoUnidad: string;
    formula: string;
    vigenciaDesde: string;
    vigenciaHasta?: string;
}

/**
 * Interface for formula update request
 */
interface FormulaUpdateRequest {
    formula?: string;
    vigenciaDesde?: string;
    vigenciaHasta?: string | null;
}

/**
 * Interface for formula query parameters
 */
interface FormulaQueryParams {
    tipoUnidad?: string;
    fecha?: string;
}

/**
 * Helper para validar solapamiento
 */
async function checkOverlap(
    clienteId: string, 
    tipoUnidad: string, 
    vigenciaDesde: Date, 
    vigenciaHasta: Date | null, 
    excludeId: string | null = null
): Promise<IFormulasPersonalizadasCliente | null> {
    const query: any = {
        clienteId: clienteId,
        tipoUnidad: tipoUnidad,
        $or: [
            // Nueva fórmula empieza durante una existente
            { 
                vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) }, 
                vigenciaHasta: { $gt: vigenciaDesde } 
            },
            // Nueva fórmula termina durante una existente
            { 
                vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) }, 
                vigenciaHasta: null 
            }, // Existente activa
            // Nueva fórmula envuelve completamente una existente
            { 
                vigenciaDesde: { $gte: vigenciaDesde }, 
                vigenciaHasta: { $lte: vigenciaHasta || new Date(8640000000000000) } 
            },
            // Existente envuelve completamente la nueva
            { 
                vigenciaDesde: { $lte: vigenciaDesde }, 
                vigenciaHasta: { $gte: vigenciaHasta || new Date(8640000000000000) } 
            },
            { 
                vigenciaDesde: { $lte: vigenciaDesde }, 
                vigenciaHasta: null 
            } // Existente activa
        ]
    };
    
    // Si estamos actualizando, excluimos el propio documento de la verificación
    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const overlappingFormula = await FormulasPersonalizadasCliente.findOne(query);
    return overlappingFormula;
}

export const createFormula = async (req: Request<{}, IFormulasPersonalizadasCliente | ApiResponse, FormulaCreateRequest>, res: Response<IFormulasPersonalizadasCliente | ApiResponse>): Promise<void> => {
    try {
        const { clienteId, tipoUnidad, formula, vigenciaDesde, vigenciaHasta } = req.body;

        if (!clienteId || !tipoUnidad || !formula || !vigenciaDesde) {
            res.status(400).json({ message: 'Faltan campos requeridos: clienteId, tipoUnidad, formula, vigenciaDesde' });
            return;
        }

        // Validar que el cliente exista
        const clienteExists = await Cliente.findById(clienteId);
        if (!clienteExists) {
            res.status(404).json({ message: 'Cliente no encontrado' });
            return;
        }

        // Validar fechas
        const desdeDate = new Date(vigenciaDesde);
        const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : null;

        if (hastaDate && desdeDate >= hastaDate) {
            res.status(400).json({ message: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta' });
            return;
        }

        // Validar solapamiento
        const overlap = await checkOverlap(clienteId, tipoUnidad, desdeDate, hastaDate);
        if (overlap) {
            res.status(400).json({
                message: `El período de vigencia se solapa con una fórmula existente (ID: ${overlap._id}, Vigencia: ${overlap.vigenciaDesde.toISOString().split('T')[0]} - ${overlap.vigenciaHasta ? overlap.vigenciaHasta.toISOString().split('T')[0] : 'Activa'})`,
                overlappingFormula: overlap
            });
            return;
        }

        const nuevaFormula = new FormulasPersonalizadasCliente({
            clienteId,
            tipoUnidad,
            formula,
            vigenciaDesde: desdeDate,
            vigenciaHasta: hastaDate
        });

        await nuevaFormula.save();
        logger.info(`Nueva fórmula creada para cliente ${clienteId}, tipo ${tipoUnidad}`);
        res.status(201).json(nuevaFormula);

    } catch (error: any) {
        logger.error('Error al crear fórmula personalizada:', error);
        res.status(500).json({ message: 'Error interno al crear la fórmula', error: error.message });
    }
};

export const getFormulasByCliente = async (req: Request<{ clienteId: string }, IFormulasPersonalizadasCliente[] | ApiResponse, {}, FormulaQueryParams>, res: Response<IFormulasPersonalizadasCliente[] | ApiResponse>): Promise<void> => {
    try {
        const { clienteId } = req.params;
        const { tipoUnidad, fecha } = req.query;

        if (!Types.ObjectId.isValid(clienteId)) {
             res.status(400).json({ message: 'ID de cliente inválido' });
             return;
        }

        const query: any = { clienteId: clienteId };
        if (tipoUnidad) {
            query.tipoUnidad = tipoUnidad;
        }
        if (fecha) {
            const fechaDate = new Date(fecha);
            query.vigenciaDesde = { $lte: fechaDate };
            query.$or = [
                { vigenciaHasta: { $gte: fechaDate } },
                { vigenciaHasta: null }
            ];
        }

        const formulas = await FormulasPersonalizadasCliente.find(query).sort({ tipoUnidad: 1, vigenciaDesde: -1 });

        logger.debug(`Encontradas ${formulas.length} fórmulas para cliente ${clienteId} con filtros:`, req.query);
        res.json(formulas);

    } catch (error: any) {
        logger.error(`Error al obtener fórmulas para cliente ${req.params.clienteId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener fórmulas', error: error.message });
    }
};

export const updateFormula = async (req: Request<{ id: string }, IFormulasPersonalizadasCliente | ApiResponse, FormulaUpdateRequest>, res: Response<IFormulasPersonalizadasCliente | ApiResponse>): Promise<void> => {
    try {
        const { id } = req.params;
        const { formula, vigenciaDesde, vigenciaHasta } = req.body;

        if (!Types.ObjectId.isValid(id)) {
             res.status(400).json({ message: 'ID de fórmula inválido' });
             return;
        }

        const formulaExistente = await FormulasPersonalizadasCliente.findById(id);
        if (!formulaExistente) {
            res.status(404).json({ message: 'Fórmula no encontrada' });
            return;
        }

        // Validar fechas si se proporcionan
        const desdeDate = vigenciaDesde ? new Date(vigenciaDesde) : formulaExistente.vigenciaDesde;
        const hastaDate = vigenciaHasta ? new Date(vigenciaHasta) : formulaExistente.vigenciaHasta;

        if (req.body.hasOwnProperty('vigenciaHasta') && vigenciaHasta === null) {
             // Permitir establecer vigenciaHasta a null
        } else if (hastaDate && desdeDate >= hastaDate) {
             res.status(400).json({ message: 'La fecha de vigenciaDesde debe ser anterior a vigenciaHasta' });
             return;
        }

        // Validar solapamiento excluyendo el documento actual
        const overlap = await checkOverlap(formulaExistente.clienteId, formulaExistente.tipoUnidad, desdeDate, hastaDate, id);
        if (overlap) {
            res.status(400).json({
                message: `El nuevo período de vigencia se solapa con otra fórmula existente (ID: ${overlap._id})`,
                overlappingFormula: overlap
            });
            return;
        }

        // Actualizar campos permitidos
        if (formula) formulaExistente.formula = formula;
        if (vigenciaDesde) formulaExistente.vigenciaDesde = desdeDate;
        // Manejar explícitamente la actualización de vigenciaHasta (incluyendo null)
        if (req.body.hasOwnProperty('vigenciaHasta')) {
             formulaExistente.vigenciaHasta = hastaDate;
        }

        const formulaActualizada = await formulaExistente.save();
        logger.info(`Fórmula ${id} actualizada.`);
        res.json(formulaActualizada);

    } catch (error: any) {
        logger.error(`Error al actualizar fórmula ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno al actualizar la fórmula', error: error.message });
    }
};

export const deleteFormula = async (req: Request<{ id: string }>, res: Response<ApiResponse>): Promise<void> => {
    try {
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
             res.status(400).json({ message: 'ID de fórmula inválido' });
             return;
        }

        const formula = await FormulasPersonalizadasCliente.findByIdAndDelete(id);

        if (!formula) {
            res.status(404).json({ message: 'Fórmula no encontrada' });
            return;
        }

        logger.info(`Fórmula ${id} eliminada.`);
        res.json({ message: 'Fórmula eliminada exitosamente' });

    } catch (error: any) {
        logger.error(`Error al eliminar fórmula ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error interno al eliminar la fórmula', error: error.message });
    }
};