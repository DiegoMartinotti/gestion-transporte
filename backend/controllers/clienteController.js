const Cliente = require('../models/Cliente');
const logger = require('../utils/logger');

exports.getClientes = async (req, res) => {
    try {
        logger.debug('Obteniendo lista de clientes');
        const clientes = await Cliente.find().sort({ createdAt: -1 });
        logger.debug(`${clientes.length} clientes encontrados`);
        res.json(clientes);
    } catch (error) {
        logger.error('Error al obtener clientes:', error);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

exports.getClienteById = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        logger.error('Error al obtener cliente:', error);
        res.status(500).json({ message: 'Error al obtener cliente' });
    }
};

exports.createCliente = async (req, res) => {
    try {
        const nuevoCliente = new Cliente(req.body);
        await nuevoCliente.save();
        res.status(201).json(nuevoCliente);
    } catch (error) {
        logger.error('Error al crear cliente:', error);
        res.status(500).json({ message: 'Error al crear cliente' });
    }
};

exports.updateCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        logger.error('Error al actualizar cliente:', error);
        res.status(500).json({ message: 'Error al actualizar cliente' });
    }
};

exports.deleteCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByIdAndDelete(req.params.id);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        logger.error('Error al eliminar cliente:', error);
        res.status(500).json({ message: 'Error al eliminar cliente' });
    }
};
