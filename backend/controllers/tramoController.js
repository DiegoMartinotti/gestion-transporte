const Tramo = require('../models/Tramo');

exports.getTramosByCliente = async (req, res) => {
    try {
        const { cliente } = req.params;
        const tramos = await Tramo.find({ cliente })
            .populate('origen', 'Site')
            .populate('destino', 'Site')
            .sort({ 'origen.Site': 1, 'destino.Site': 1 });

        res.json({
            success: true,
            data: tramos
        });
    } catch (error) {
        console.error('Error al obtener tramos:', error);
        res.status(500).json({ message: error.message });
    }
};

// ...rest of existing tramo controller methods...
