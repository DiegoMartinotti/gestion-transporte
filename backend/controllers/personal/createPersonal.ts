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
 * Crear un nuevo registro de personal
 */
export const createPersonal = async (req: AuthenticatedRequest, res: Response<IPersonal | ApiResponse>): Promise<void> => {
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
    } catch (error: any) {
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