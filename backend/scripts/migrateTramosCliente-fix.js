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

async function mostrarDetalleTramo(tramoId) {
    try {
        // Mostrar la información completa del tramo para depuración
        const tramo = await Tramo.findById(tramoId);
        console.log('===== DETALLE DEL TRAMO =====');
        console.log(`ID: ${tramo._id}`);
        console.log(`Cliente (valor actual): "${tramo.cliente}"`);
        console.log(`Origen: ${tramo.origen}`);
        console.log(`Destino: ${tramo.destino}`);
        console.log('=============================');
    } catch (err) {
        console.error(`Error obteniendo detalles del tramo: ${err.message}`);
    }
}

async function mostrarClientes() {
    try {
        // Listar algunos clientes para verificar la estructura
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

        // Mostrar información sobre los clientes para depuración
        await mostrarClientes();

        // Encuentra todos los tramos que aún tienen 'cliente' como string
        const tramosToMigrate = await Tramo.find({ cliente: { $type: 'string' } });

        console.log(`Se encontraron ${tramosToMigrate.length} tramos para migrar.`);

        let migratedCount = 0;
        let errorCount = 0;

        // Tomar una muestra de tramos para depuración
        if (tramosToMigrate.length > 0) {
            console.log('Mostrando detalle de un tramo de ejemplo:');
            await mostrarDetalleTramo(tramosToMigrate[0]._id);
        }

        for (const tramo of tramosToMigrate) {
            try {
                const clienteNombre = tramo.cliente; // El nombre del cliente almacenado como string
                if (!clienteNombre) {
                    console.warn(`Tramo ${tramo._id} no tiene nombre de cliente, saltando.`);
                    continue;
                }

                // MÉTODO 1: Buscar por nombre exacto
                let clienteDoc = await Cliente.findOne({ 
                    Cliente: clienteNombre
                });

                // MÉTODO 2: Si no se encuentra, probar con búsqueda insensible a mayúsculas/minúsculas
                if (!clienteDoc) {
                    clienteDoc = await Cliente.findOne({ 
                        Cliente: new RegExp(`^${clienteNombre}$`, 'i') 
                    });
                }

                // MÉTODO 3: Si aún no se encuentra, intentar con una coincidencia parcial
                if (!clienteDoc) {
                    clienteDoc = await Cliente.findOne({ 
                        Cliente: new RegExp(clienteNombre, 'i') 
                    });
                }

                // MÉTODO 4: Último recurso - intentar limpiar el nombre
                if (!clienteDoc) {
                    const nombreLimpio = clienteNombre.trim().replace(/\s+/g, ' ');
                    clienteDoc = await Cliente.findOne({ 
                        Cliente: new RegExp(nombreLimpio, 'i') 
                    });
                }

                if (!clienteDoc) {
                    console.error(`No se encontró Cliente con nombre "${clienteNombre}" para Tramo ${tramo._id}. Saltando.`);
                    // Mostrar detalles adicionales para depuración
                    await mostrarDetalleTramo(tramo._id);
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