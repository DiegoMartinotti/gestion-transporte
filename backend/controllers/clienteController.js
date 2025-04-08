const Cliente = require('../models/Cliente');
const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware para verificar permisos de cliente
 * Verifica si el usuario tiene permiso para operaciones sobre un cliente
 * 
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} clienteId - ID del cliente sobre el que se quiere operar
 * @param {boolean} requiresAdmin - Si la operación requiere privilegios de administrador
 * @returns {boolean} - true si el usuario tiene permiso
 * @throws {UnauthorizedError|ForbiddenError} - Si no está autorizado
 */
const verificarPermisosCliente = (req, clienteId, requiresAdmin = false) => {
    // Verificar que existe usuario autenticado
    if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
    }
    
    // Si requiere ser administrador, verificar rol
    if (requiresAdmin) {
        const esAdmin = req.user.roles && req.user.roles.includes('admin');
        if (!esAdmin) {
            logger.warn(`Usuario ${req.user.email} intentó realizar operación admin sobre cliente ${clienteId}`);
            throw new ForbiddenError('Se requieren privilegios de administrador para esta acción');
        }
    }
    
    // Aquí podrían añadirse otras verificaciones basadas en la relación usuario-cliente
    // Por ejemplo, si el usuario pertenece a una empresa que gestiona el cliente, etc.
    
    return true;
};

exports.getClientes = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de clientes');
        
        // El filtrado podría basarse en los permisos del usuario
        // Por ejemplo, si no es admin, solo ver los clientes asociados a su empresa
        const esAdmin = req.user.roles && req.user.roles.includes('admin');
        let filtro = {};
        
        if (!esAdmin && req.user.empresa) {
            // Supongamos que hay un campo empresa en Cliente que relaciona cliente con empresa
            filtro.empresa = req.user.empresa;
            logger.debug(`Filtrando clientes por empresa: ${req.user.empresa}`);
        }
        
        const clientes = await Cliente.find(filtro).sort({ createdAt: -1 });
        logger.debug(`${clientes.length} clientes encontrados`);
        res.json(clientes);
    } catch (error) {
        logger.error('Error al obtener clientes:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Error al obtener clientes' });
    }
};

exports.getClienteById = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
        
        // Verificar permisos para ver el cliente
        const esAdmin = req.user.roles && req.user.roles.includes('admin');
        if (!esAdmin && req.user.empresa && cliente.empresa && 
            req.user.empresa.toString() !== cliente.empresa.toString()) {
            logger.warn(`Usuario ${req.user.email} intentó acceder a cliente de otra empresa`);
            return res.status(403).json({ 
                success: false,
                message: 'No tienes permiso para acceder a este cliente' 
            });
        }
        
        res.json({ success: true, data: cliente });
    } catch (error) {
        logger.error('Error al obtener cliente:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Error al obtener cliente' });
    }
};

exports.createCliente = async (req, res) => {
    try {
        // Verificar permisos
        verificarPermisosCliente(req, null, true); // Requiere ser admin
        
        const nuevoCliente = new Cliente(req.body);
        await nuevoCliente.save();
        res.status(201).json({ success: true, data: nuevoCliente });
    } catch (error) {
        logger.error('Error al crear cliente:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Error al crear cliente' });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const clienteId = req.params.id;
        
        // Verificar permisos (ejemplo: solo admins pueden actualizar)
        verificarPermisosCliente(req, clienteId, true);
        
        const cliente = await Cliente.findByIdAndUpdate(
            clienteId,
            req.body,
            { new: true }
        );
        
        if (!cliente) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
        
        res.json({ success: true, data: cliente });
    } catch (error) {
        logger.error('Error al actualizar cliente:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
    }
};

exports.deleteCliente = async (req, res) => {
    try {
        const clienteId = req.params.id;
        
        // Verificar permisos (solo admins pueden eliminar)
        verificarPermisosCliente(req, clienteId, true);
        
        const cliente = await Cliente.findByIdAndDelete(clienteId);
        if (!cliente) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
        }
        
        res.json({ success: true, message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar cliente:', error);
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return res.status(error instanceof UnauthorizedError ? 401 : 403)
                .json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Error al eliminar cliente' });
    }
};
