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
        console.log(`Cliente (valor actual): "${tramo.cliente}" (Tipo: ${typeof tramo.cliente})`); // Mostrar tipo
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
                const clienteNombreOIdString = tramo.cliente;
                if (!clienteNombreOIdString) {
                    console.warn(`Tramo ${tramo._id} no tiene valor en cliente, saltando.`);
                    continue;
                }

                let clienteDoc = null;
                let clienteObjectId = null;

                // Intentar convertir la cadena directamente a ObjectId por si ya es un ID
                if (mongoose.Types.ObjectId.isValid(clienteNombreOIdString)) {
                    clienteObjectId = new mongoose.Types.ObjectId(clienteNombreOIdString);
                    // Opcional: verificar si este ObjectId existe en la colección Cliente
                    clienteDoc = await Cliente.findById(clienteObjectId);
                    if (!clienteDoc) {
                         console.warn(`Tramo ${tramo._id} tiene un ObjectId de cliente inválido: ${clienteNombreOIdString}. Intentando buscar por nombre...`);
                         clienteObjectId = null; // Resetear si no es válido
                    } else {
                        console.log(`Tramo ${tramo._id} ya contiene un ObjectId válido como string.`);
                    }
                }

                // Si no era un ObjectId válido o no se encontró, buscar por nombre
                if (!clienteObjectId) {
                    const clienteNombre = clienteNombreOIdString; // Asumir que es un nombre
                    // Buscar por nombre (insensible a mayúsculas/minúsculas y espacios)
                    const nombreLimpio = clienteNombre.trim().replace(/\s+/g, ' ');
                    clienteDoc = await Cliente.findOne({ 
                        Cliente: new RegExp(`^${nombreLimpio}$`, 'i') 
                    });
                }

                if (!clienteDoc) {
                    console.error(`No se encontró Cliente con nombre/ID "${clienteNombreOIdString}" para Tramo ${tramo._id}. Saltando.`);
                    await mostrarDetalleTramo(tramo._id);
                    errorCount++;
                    continue;
                }

                // Asegurarse de tener el ObjectId correcto
                clienteObjectId = clienteDoc._id;

                // **Usar updateOne para actualizar directamente en la BD**
                const updateResult = await Tramo.updateOne(
                    { _id: tramo._id }, // Filtro para encontrar el tramo
                    { $set: { cliente: clienteObjectId } } // Actualización para establecer el ObjectId
                );

                if (updateResult.modifiedCount > 0) {
                    migratedCount++;
                    console.log(`Tramo ${tramo._id} migrado exitosamente. Cliente asignado: ${clienteObjectId} (${clienteDoc.Cliente})`);
                } else {
                     console.warn(`Tramo ${tramo._id} no fue modificado (quizás ya estaba correcto?).`);
                     // Podría ser un error o que ya estaba bien, lo contamos como posible error por ahora
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
             // Necesitamos buscarlo de nuevo para ver el cambio
             const tramoActualizado = await Tramo.findById(tramosToMigrate[0]._id);
             if(tramoActualizado) {
                console.log(`Cliente (valor después): "${tramoActualizado.cliente}" (Tipo: ${typeof tramoActualizado.cliente})`);
             } else {
                console.log('No se pudo recargar el tramo de ejemplo.');
             }
        }

    } catch (error) {
        console.error('Error general durante la migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
    }
}

migrateTramos().catch(console.error); 