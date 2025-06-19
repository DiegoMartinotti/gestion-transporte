import Empresa from '../models/Empresa';
import logger from '../utils/logger';
/**
 * Obtiene todas las empresas ordenadas por fecha de creación descendente
 */
export const getEmpresas = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de empresas');
        const empresas = await Empresa.find().sort({ createdAt: -1 });
        logger.debug(`${empresas.length} empresas encontradas`);
        res.json(empresas);
    }
    catch (error) {
        logger.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error al obtener empresas' });
    }
};
/**
 * Obtiene una empresa por su ID
 */
export const getEmpresaById = async (req, res) => {
    try {
        const empresa = await Empresa.findById(req.params.id);
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json(empresa);
    }
    catch (error) {
        logger.error('Error al obtener empresa:', error);
        res.status(500).json({ message: 'Error al obtener empresa' });
    }
};
/**
 * Crea una nueva empresa
 */
export const createEmpresa = async (req, res) => {
    try {
        const nuevaEmpresa = new Empresa(req.body);
        await nuevaEmpresa.save();
        res.status(201).json(nuevaEmpresa);
    }
    catch (error) {
        logger.error('Error al crear empresa:', error);
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
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
export const updateEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json(empresa);
    }
    catch (error) {
        logger.error('Error al actualizar empresa:', error);
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
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
export const deleteEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findByIdAndDelete(req.params.id);
        if (!empresa) {
            res.status(404).json({ message: 'Empresa no encontrada' });
            return;
        }
        res.json({ message: 'Empresa eliminada exitosamente' });
    }
    catch (error) {
        logger.error('Error al eliminar empresa:', error);
        res.status(500).json({ message: 'Error al eliminar empresa' });
    }
};
/**
 * Obtiene empresas filtradas por tipo
 */
export const getEmpresasByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        if (!['Propia', 'Subcontratada'].includes(tipo)) {
            res.status(400).json({ message: 'Tipo de empresa inválido' });
            return;
        }
        const empresas = await Empresa.find({ tipo }).sort({ nombre: 1 });
        res.json(empresas);
    }
    catch (error) {
        logger.error('Error al obtener empresas por tipo:', error);
        res.status(500).json({ message: 'Error al obtener empresas por tipo' });
    }
};
/**
 * Obtiene todas las empresas activas
 */
export const getEmpresasActivas = async (req, res) => {
    try {
        const empresas = await Empresa.find({ activa: true }).sort({ nombre: 1 });
        res.json(empresas);
    }
    catch (error) {
        logger.error('Error al obtener empresas activas:', error);
        res.status(500).json({ message: 'Error al obtener empresas activas' });
    }
};
//# sourceMappingURL=empresaController.js.map