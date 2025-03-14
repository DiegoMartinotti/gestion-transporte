/**
 * Script de migración para transformar el modelo Tramo
 * Convierte el modelo actual a uno con histórico de tarifas
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Intentar cargar la configuración de diferentes maneras
let mongoURI;

// Función para obtener la URI de MongoDB
function getMongoURI() {
    try {
        // Intento 1: Cargar desde config.js si existe
        if (fs.existsSync(path.join(__dirname, '../config/config.js'))) {
            const config = require('../config/config');
            if (config && config.mongoURI) {
                return config.mongoURI;
            }
        }
        
        // Intento 2: Cargar desde .env si existe
        if (fs.existsSync(path.join(__dirname, '../.env'))) {
            require('dotenv').config({ path: path.join(__dirname, '../.env') });
        } else if (fs.existsSync(path.join(__dirname, '../../.env'))) {
            require('dotenv').config({ path: path.join(__dirname, '../../.env') });
        }
        
        // Intento 3: Usar variable de entorno directamente
        if (process.env.MONGODB_URI) {
            return process.env.MONGODB_URI;
        }
        
        if (process.env.MONGO_URI) {
            return process.env.MONGO_URI;
        }
        
        // Si llegamos aquí, no se encontró la URI
        throw new Error('No se pudo encontrar la URI de MongoDB. Por favor, especifíquela como argumento o en las variables de entorno.');
    } catch (error) {
        logger.error('Error al obtener la URI de MongoDB:', error.message);
        throw error;
    }
}

// Definimos el esquema antiguo para poder leer los datos existentes
const tramoSchemaAntiguo = new mongoose.Schema({
    origen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site'
    },
    destino: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site'
    },
    tipo: {
        type: String,
        enum: ['TRMC', 'TRMI']
    },
    cliente: {
        type: String
    },
    metodoCalculo: {
        type: String,
        enum: ['Kilometro', 'Palet', 'Fijo']
    },
    valor: {
        type: Number
    },
    valorPeaje: {
        type: Number
    },
    vigenciaDesde: {
        type: Date
    },
    vigenciaHasta: {
        type: Date
    },
    distancia: {
        type: Number
    }
}, { 
    timestamps: true,
    collection: 'tramos'
});

// Modelo temporal para leer los datos antiguos
const TramoAntiguo = mongoose.model('TramoAntiguo', tramoSchemaAntiguo, 'tramos');

// Importamos el nuevo modelo Tramo
const Tramo = require('../models/Tramo');

async function migrarTramos(uri) {
    try {
        // Usar la URI proporcionada o intentar obtenerla
        mongoURI = uri || getMongoURI();
        
        logger.info(`Conectando a MongoDB: ${mongoURI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@')}`);
        
        // Conectar a la base de datos
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        logger.info('Conexión a MongoDB establecida');
        
        // Crear una colección temporal para backup
        logger.info('Creando backup de la colección tramos...');
        await mongoose.connection.db.collection('tramos_backup_' + Date.now()).insertMany(
            await mongoose.connection.db.collection('tramos').find({}).toArray()
        );
        logger.info('Backup creado correctamente');
        
        // Obtener todos los tramos existentes
        const tramosAntiguos = await TramoAntiguo.find({}).lean();
        logger.info(`Se encontraron ${tramosAntiguos.length} tramos para migrar`);
        
        // Agrupar tramos por origen, destino y cliente
        const tramosAgrupados = {};
        
        for (const tramo of tramosAntiguos) {
            const clave = `${tramo.origen}_${tramo.destino}_${tramo.cliente}`;
            
            if (!tramosAgrupados[clave]) {
                tramosAgrupados[clave] = {
                    origen: tramo.origen,
                    destino: tramo.destino,
                    cliente: tramo.cliente,
                    distancia: tramo.distancia || 0,
                    tarifasHistoricas: []
                };
            }
            
            // Añadir la tarifa histórica
            tramosAgrupados[clave].tarifasHistoricas.push({
                tipo: tramo.tipo,
                metodoCalculo: tramo.metodoCalculo,
                valor: tramo.valor,
                valorPeaje: tramo.valorPeaje || 0,
                vigenciaDesde: tramo.vigenciaDesde,
                vigenciaHasta: tramo.vigenciaHasta
            });
            
            // Actualizar la distancia si es mayor que la existente
            if (tramo.distancia && tramo.distancia > tramosAgrupados[clave].distancia) {
                tramosAgrupados[clave].distancia = tramo.distancia;
            }
        }
        
        logger.info(`Tramos agrupados en ${Object.keys(tramosAgrupados).length} documentos únicos`);
        
        // Eliminar la colección actual
        logger.info('Eliminando colección actual de tramos...');
        await mongoose.connection.db.collection('tramos').deleteMany({});
        
        // Crear los nuevos documentos
        let contadorExito = 0;
        let contadorError = 0;
        
        for (const clave in tramosAgrupados) {
            try {
                const nuevoTramo = new Tramo(tramosAgrupados[clave]);
                await nuevoTramo.save();
                contadorExito++;
                
                if (contadorExito % 100 === 0) {
                    logger.info(`Progreso: ${contadorExito} tramos migrados`);
                }
            } catch (error) {
                logger.error(`Error al migrar tramo ${clave}: ${error.message}`);
                contadorError++;
            }
        }
        
        logger.info(`Migración completada: ${contadorExito} tramos migrados correctamente, ${contadorError} errores`);
        
    } catch (error) {
        logger.error(`Error en la migración: ${error.message}`);
        logger.error(error.stack);
        throw error; // Re-lanzar el error para que se maneje en el nivel superior
    } finally {
        // Cerrar conexión
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            logger.info('Conexión a MongoDB cerrada');
        }
    }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
    logger.info('Iniciando migración de tramos...');
    
    // Verificar si se pasó una URI como argumento
    const args = process.argv.slice(2);
    const uri = args.length > 0 ? args[0] : null;
    
    migrarTramos(uri)
        .then(() => {
            logger.info('Proceso de migración finalizado');
            process.exit(0);
        })
        .catch(err => {
            logger.error('Error fatal en el proceso de migración:', err);
            process.exit(1);
        });
} else {
    // Exportar para uso como módulo
    module.exports = { migrarTramos }; 
} 