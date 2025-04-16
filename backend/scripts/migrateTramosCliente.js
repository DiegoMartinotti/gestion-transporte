const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Tramo = require('../models/Tramo');
const logger = require('../utils/logger');
// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

// Permitir sobreescribir la URI de MongoDB desde la línea de comandos
const MONGO_URI = process.env.MONGODB_URI_OVERRIDE || 
                 (process.env.MONGODB_RI ? process.env.MONGODB_RI.replace('${DB_PASSWORD}', process.env.DB_PASSWORD) : 
                 'mongodb://localhost:27017/nombre-de-tu-base-de-datos');

console.log('Usando URI de MongoDB:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

async function migrateTramos() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Conexión exitosa a MongoDB para migración.');

        // Encuentra todos los tramos que aún tienen 'cliente' como string
        // Usamos $type: 'string' que corresponde a String en BSON
        const tramosToMigrate = await Tramo.find({ cliente: { $type: 'string' } });

        console.log(`Se encontraron ${tramosToMigrate.length} tramos para migrar.`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const tramo of tramosToMigrate) {
            try {
                const clienteNombre = tramo.cliente; // El nombre del cliente almacenado como string
                if (!clienteNombre) {
                    console.warn(`Tramo ${tramo._id} no tiene nombre de cliente, saltando.`);
                    continue;
                }

                // Busca el cliente por su nombre (case-insensitive)
                const clienteDoc = await Cliente.findOne({ 
                    Cliente: new RegExp(`^${clienteNombre}$`, 'i') 
                });

                if (!clienteDoc) {
                    console.error(`No se encontró Cliente con nombre "${clienteNombre}" para Tramo ${tramo._id}. Saltando.`);
                    errorCount++;
                    continue;
                }

                // Actualiza el tramo con el ObjectId del cliente
                tramo.cliente = clienteDoc._id; 
                await tramo.save({ validateBeforeSave: false }); // Evita validaciones que podrían fallar durante la migración

                migratedCount++;
                console.log(`Tramo ${tramo._id} migrado exitosamente. Cliente asignado: ${clienteDoc._id} (${clienteDoc.Cliente})`);

            } catch (err) {
                console.error(`Error migrando Tramo ${tramo._id}: ${err.message}`);
                errorCount++;
            }
        }

        console.log('-----------------------------------------');
        console.log(`Migración completada.`);
        console.log(`Tramos migrados exitosamente: ${migratedCount}`);
        console.log(`Errores durante la migración: ${errorCount}`);
        console.log('-----------------------------------------');

    } catch (error) {
        console.error('Error general durante la migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
    }
}

// Ejecuta la migración
migrateTramos().catch(console.error); 