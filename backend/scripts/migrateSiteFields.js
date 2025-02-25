const mongoose = require('mongoose');
require('dotenv').config();

async function migrateSiteFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        const db = mongoose.connection;
        const collection = db.collection('sites');

        console.log('Iniciando migración de campos...');

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

        console.log(`Documentos actualizados: ${result.modifiedCount}`);
        console.log('Migración completada');
        
        // Mostrar algunos documentos de ejemplo
        const samples = await collection.find().limit(3).toArray();
        console.log('Ejemplos de documentos actualizados:', samples);

        process.exit(0);
    } catch (error) {
        console.error('Error en migración:', error);
        process.exit(1);
    }
}

migrateSiteFields();
