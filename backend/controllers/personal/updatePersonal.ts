// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Response } from 'express';
import { Types } from 'mongoose';
import Personal, { IPersonal } from '../../models/Personal';
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
    params: { id: string };
    body: any;
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
 * Actualizar un registro de personal
 */
export const updatePersonal = async (req: AuthenticatedRequest, res: Response<IPersonal | ApiResponse>): Promise<void> => {
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
        
        const personal = await Personal.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!personal) {
            res.status(404).json({ error: 'Personal no encontrado' });
            return;
        }
        
        res.status(200).json(personal);
    } catch (error: any) {
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