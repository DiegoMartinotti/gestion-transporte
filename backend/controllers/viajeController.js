const Viaje = require('../models/Viaje');

exports.getViajes = async (req, res) => {
    try {
        console.log('Obteniendo lista de viajes');
        const viajes = await Viaje.find().sort({ fecha: -1 });
        console.log(`${viajes.length} viajes encontrados`);
        res.json(viajes);
    } catch (error) {
        console.error('Error al obtener viajes:', error);
        res.status(500).json({ message: 'Error al obtener viajes' });
    }
};

exports.getViajeById = async (req, res) => {
    try {
        const viaje = await Viaje.findById(req.params.id);
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json(viaje);
    } catch (error) {
        console.error('Error al obtener viaje:', error);
        res.status(500).json({ message: 'Error al obtener viaje' });
    }
};

exports.createViaje = async (req, res) => {
    try {
        const nuevoViaje = new Viaje(req.body);
        await nuevoViaje.save();
        res.status(201).json(nuevoViaje);
    } catch (error) {
        console.error('Error al crear viaje:', error);
        res.status(500).json({ message: 'Error al crear viaje' });
    }
};

exports.updateViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json(viaje);
    } catch (error) {
        console.error('Error al actualizar viaje:', error);
        res.status(500).json({ message: 'Error al actualizar viaje' });
    }
};

exports.deleteViaje = async (req, res) => {
    try {
        const viaje = await Viaje.findByIdAndDelete(req.params.id);
        if (!viaje) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }
        res.json({ message: 'Viaje eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar viaje:', error);
        res.status(500).json({ message: 'Error al eliminar viaje' });
    }
};
