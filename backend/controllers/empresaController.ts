import { Request, Response } from 'express';
import Empresa, { IEmpresa } from '../models/Empresa';
import logger from '../utils/logger';
import { Error as MongooseError } from 'mongoose';

/**
 * Interface for API responses
 */
interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    errores?: string[];
    error?: string;
}

/**
 * Interface for MongoDB duplicate key error
 */
interface MongoDuplicateError extends Error {
    code: number;
}

/**
 * Obtiene todas las empresas ordenadas por fecha de creación descendente
 */
export const getEmpresas = async (req: Request, res: Response<IEmpresa[]>): Promise<void> => {
    try {
        logger.debug('Obteniendo lista de empresas');
        const empresas: IEmpresa[] = await Empresa.find().sort({ createdAt: -1 });
        logger.debug(`${empresas.length} empresas encontradas`);
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error al obtener empresas' } as any);
    }
};

/**
 * Obtiene una empresa por su ID
 */
export const getEmpresaById = async (req: Request, res: Response<IEmpresa | ApiResponse>): Promise<void> => {
    try {
        const empresa: IEmpresa | null = await Empresa.findById(req.params.id);
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json(empresa);
    } catch (error) {
        logger.error('Error al obtener empresa:', error);
        res.status(500).json({ message: 'Error al obtener empresa' });
    }
};

/**
 * Crea una nueva empresa
 */
export const createEmpresa = async (req: Request, res: Response<IEmpresa | ApiResponse>): Promise<void> => {
    try {
        const nuevaEmpresa = new Empresa(req.body);
        await nuevaEmpresa.save();
        res.status(201).json(nuevaEmpresa);
    } catch (error: any) {
        logger.error('Error al crear empresa:', error);
        
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ message: 'Error de validación', errores });
            return;
        }
        
        // Manejo específico para errores de duplicados
        if (error.code === 11000) {
            res.status(400).json({ 
                message: 'Error de duplicado', 
                error: `Ya existe una empresa con el nombre ${req.body.nombre}` 
            });
            return;
        }
        
        res.status(500).json({ message: 'Error al crear empresa' });
    }
};

/**
 * Actualiza una empresa existente
 */
export const updateEmpresa = async (req: Request, res: Response<IEmpresa | ApiResponse>): Promise<void> => {
    try {
        const empresa: IEmpresa | null = await Empresa.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json(empresa);
    } catch (error: any) {
        logger.error('Error al actualizar empresa:', error);
        
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ message: 'Error de validación', errores });
            return;
        }
        
        // Manejo específico para errores de duplicados
        if (error.code === 11000) {
            res.status(400).json({ 
                message: 'Error de duplicado', 
                error: `Ya existe una empresa con el nombre ${req.body.nombre}` 
            });
            return;
        }
        
        res.status(500).json({ message: 'Error al actualizar empresa' });
    }
};

/**
 * Elimina una empresa
 */
export const deleteEmpresa = async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
        const empresa: IEmpresa | null = await Empresa.findByIdAndDelete(req.params.id);
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar empresa:', error);
        res.status(500).json({ message: 'Error al eliminar empresa' });
    }
};

/**
 * Obtiene empresas filtradas por tipo
 */
export const getEmpresasByTipo = async (req: Request, res: Response<IEmpresa[] | ApiResponse>): Promise<void> => {
    try {
        const { tipo } = req.params;
        
        if (!['Propia', 'Subcontratada'].includes(tipo)) {
            res.status(400).json({ message: 'Tipo de empresa inválido' });
            return;
        }
        
        const empresas: IEmpresa[] = await Empresa.find({ tipo }).sort({ nombre: 1 });
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas por tipo:', error);
        res.status(500).json({ message: 'Error al obtener empresas por tipo' });
    }
};

/**
 * Obtiene todas las empresas activas
 */
export const getEmpresasActivas = async (req: Request, res: Response<IEmpresa[] | ApiResponse>): Promise<void> => {
    try {
        const empresas: IEmpresa[] = await Empresa.find({ activa: true }).sort({ nombre: 1 });
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas activas:', error);
        res.status(500).json({ message: 'Error al obtener empresas activas' });
    }
};