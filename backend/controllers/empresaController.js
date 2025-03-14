const Empresa = require('../models/Empresa');
const logger = require('../utils/logger');

/**
 * @function getEmpresas
 * @description Obtiene todas las empresas ordenadas por fecha de creación descendente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getEmpresas = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de empresas');
        const empresas = await Empresa.find().sort({ createdAt: -1 });
        logger.debug(`${empresas.length} empresas encontradas`);
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error al obtener empresas' });
    }
};

/**
 * @function getEmpresaById
 * @description Obtiene una empresa por su ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getEmpresaById = async (req, res) => {
    try {
        const empresa = await Empresa.findById(req.params.id);
        if (!empresa) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }
        res.json(empresa);
    } catch (error) {
        logger.error('Error al obtener empresa:', error);
        res.status(500).json({ message: 'Error al obtener empresa' });
    }
};

/**
 * @function createEmpresa
 * @description Crea una nueva empresa
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.createEmpresa = async (req, res) => {
    try {
        const nuevaEmpresa = new Empresa(req.body);
        await nuevaEmpresa.save();
        res.status(201).json(nuevaEmpresa);
    } catch (error) {
        logger.error('Error al crear empresa:', error);
        
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Error de validación', errores });
        }
        
        // Manejo específico para errores de duplicados
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Error de duplicado', 
                error: `Ya existe una empresa con el nombre ${req.body.nombre}` 
            });
        }
        
        res.status(500).json({ message: 'Error al crear empresa' });
    }
};

/**
 * @function updateEmpresa
 * @description Actualiza una empresa existente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.updateEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!empresa) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }
        res.json(empresa);
    } catch (error) {
        logger.error('Error al actualizar empresa:', error);
        
        // Manejo específico para errores de validación
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Error de validación', errores });
        }
        
        // Manejo específico para errores de duplicados
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Error de duplicado', 
                error: `Ya existe una empresa con el nombre ${req.body.nombre}` 
            });
        }
        
        res.status(500).json({ message: 'Error al actualizar empresa' });
    }
};

/**
 * @function deleteEmpresa
 * @description Elimina una empresa
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.deleteEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findByIdAndDelete(req.params.id);
        if (!empresa) {
            return res.status(404).json({ message: 'Empresa no encontrada' });
        }
        res.json({ message: 'Empresa eliminada exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar empresa:', error);
        res.status(500).json({ message: 'Error al eliminar empresa' });
    }
};

/**
 * @function getEmpresasByTipo
 * @description Obtiene empresas filtradas por tipo
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getEmpresasByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        
        if (!['Propia', 'Subcontratada'].includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de empresa inválido' });
        }
        
        const empresas = await Empresa.find({ tipo }).sort({ nombre: 1 });
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas por tipo:', error);
        res.status(500).json({ message: 'Error al obtener empresas por tipo' });
    }
};

/**
 * @function getEmpresasActivas
 * @description Obtiene todas las empresas activas
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getEmpresasActivas = async (req, res) => {
    try {
        const empresas = await Empresa.find({ activa: true }).sort({ nombre: 1 });
        res.json(empresas);
    } catch (error) {
        logger.error('Error al obtener empresas activas:', error);
        res.status(500).json({ message: 'Error al obtener empresas activas' });
    }
}; 