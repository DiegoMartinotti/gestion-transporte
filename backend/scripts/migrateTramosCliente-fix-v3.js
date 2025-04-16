const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Tramo = require('../models/Tramo');
const logger = require('../utils/logger');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI_OVERRIDE || 
                 (process.env.MONGODB_RI ? process.env.MONGODB_RI.replace('${DB_PASSWORD}', process.env.DB_PASSWORD) : 
                 'mongodb://localhost:27017/nombre-de-tu-base-de-datos');

console.log('Usando URI de MongoDB:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

async function mostrarDetalleTramo(tramoId) {
    try {
        const tramo = await Tramo.findById(tramoId);
        if (!tramo) {
            console.log(`No se encontró tramo con ID: ${tramoId}`);
            return;
        }
        console.log('===== DETALLE DEL TRAMO =====');
        console.log(`ID: ${tramo._id}`);
        console.log(`Cliente (valor actual): "${tramo.cliente}" (Tipo BSON: ${tramo.get('cliente', null, { getters: false })?.$bsontype || typeof tramo.cliente})`); // Mostrar tipo BSON
        console.log(`Origen: ${tramo.origen}`);
        console.log(`Destino: ${tramo.destino}`);
        console.log('=============================');
    } catch (err) {
        console.error(`Error obteniendo detalles del tramo: ${err.message}`);
    }
}

async function mostrarClientes() {
    // ... (igual que antes)
    try {
        console.log('===== PRIMEROS 5 CLIENTES EN LA BASE DE DATOS =====');
        const clientes = await Cliente.find().limit(5);
        clientes.forEach(cliente => {
            console.log(`ID: ${cliente._id}, Cliente: "${cliente.Cliente}", CUIT: ${cliente.CUIT}`);
        });
        console.log('==================================================');
    } catch (err) {
        console.error(`Error listando clientes: ${err.message}`);
    }
}

async function migrateTramos() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Conexión exitosa a MongoDB para migración.');

        await mostrarClientes();

        // Encuentra todos los tramos que aún tienen 'cliente' como string
        const tramosToMigrate = await Tramo.find({ cliente: { $type: 'string' } });

        console.log(`Se encontraron ${tramosToMigrate.length} tramos para migrar.`);

        let migratedCount = 0;
        let errorCount = 0;

        if (tramosToMigrate.length > 0) {
            console.log('Mostrando detalle de un tramo de ejemplo ANTES de migrar:');
            await mostrarDetalleTramo(tramosToMigrate[0]._id);
        }

        for (const tramo of tramosToMigrate) {
            try {
                const clienteIdString = tramo.cliente; // El ID del cliente guardado como string
                if (!clienteIdString || !mongoose.Types.ObjectId.isValid(clienteIdString)) {
                    console.warn(`Tramo ${tramo._id} no tiene un ObjectId válido como string ("${clienteIdString}"), saltando.`);
                    errorCount++;
                    continue;
                }

                // **Usar $set con $toObjectId para forzar la conversión en la BD**
                const updateResult = await Tramo.updateOne(
                    { _id: tramo._id }, // Filtro
                    [{ // Usar pipeline de agregación para la actualización
                        $set: {
                            cliente: { $toObjectId: "$cliente" } // Convertir el campo string actual a ObjectId
                        }
                    }]
                );

                if (updateResult.modifiedCount > 0) {
                    migratedCount++;
                    console.log(`Tramo ${tramo._id} migrado exitosamente usando $toObjectId.`);
                    // Opcional: verificar el cliente para mostrar su nombre
                    try {
                        const clienteObjectId = new mongoose.Types.ObjectId(clienteIdString);
                        const clienteDoc = await Cliente.findById(clienteObjectId);
                        if (clienteDoc) {
                             console.log(`   -> Cliente asignado: ${clienteObjectId} (${clienteDoc.Cliente})`);
                        }
                    } catch (e) { /* Ignorar si no se puede buscar el cliente */ }

                } else if (updateResult.matchedCount > 0 && updateResult.modifiedCount === 0) {
                     console.warn(`Tramo ${tramo._id} fue encontrado pero no modificado (¿ya era ObjectId?).`);
                } else {
                     console.error(`Tramo ${tramo._id} no fue encontrado para la actualización.`);
                     errorCount++;
                }

            } catch (err) {
                console.error(`Error migrando Tramo ${tramo._id}: ${err.message}`);
                errorCount++;
            }
        }

        console.log('-----------------------------------------');
        console.log(`Migración completada.`);
        console.log(`Tramos migrados exitosamente: ${migratedCount}`);
        console.log(`Errores/Advertencias durante la migración: ${errorCount}`);
        console.log('-----------------------------------------');

        // Verificar un tramo después de migrar
        if (tramosToMigrate.length > 0 && migratedCount > 0) {
             console.log('Mostrando detalle del tramo de ejemplo DESPUÉS de migrar:');
             await mostrarDetalleTramo(tramosToMigrate[0]._id);
        }

    } catch (error) {
        console.error('Error general durante la migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
    }
}

migrateTramos().catch(console.error); 