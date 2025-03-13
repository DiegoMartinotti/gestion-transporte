const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

async function migrateSiteFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Conectado a MongoDB');

        const db = mongoose.connection;
        const collection = db.collection('sites');

        logger.info('Iniciando migración de campos...');

        // Actualizar todos los documentos
        const result = await collection.updateMany(
            {}, // todos los documentos
            [{
                $set: {
                    // Convertir campos antiguos a nuevos
                    site: { $toUpper: '$Site' },
                    cliente: { $toUpper: '$Cliente' },
                    direccion: '$Direccion',
                    localidad: '$Localidad',
                    provincia: '$Provincia'
                }
            }]
        );

        logger.info(`Documentos actualizados: ${result.modifiedCount}`);
        logger.info('Migración completada');
        
        // Mostrar algunos documentos de ejemplo
        const samples = await collection.find().limit(3).toArray();
        logger.debug('Ejemplos de documentos actualizados:', samples);

        process.exit(0);
    } catch (error) {
        logger.error('Error en migración:', error);
        process.exit(1);
    }
}

migrateSiteFields();
