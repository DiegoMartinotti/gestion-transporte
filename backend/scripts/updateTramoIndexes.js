// Script para actualizar los índices de la colección tramos
const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config(); // Cargar variables de entorno

async function updateTramoIndexes() {
  try {
    // Conectar a la base de datos usando la misma configuración que el resto de la app
    logger.info('Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Conexión establecida correctamente.');

    // Obtener referencia a la colección tramos
    const db = mongoose.connection;
    const collection = db.collection('tramos');
    
    logger.info('Obteniendo información de índices actuales...');
    const indexInfo = await collection.indexes();
    logger.debug('Índices actuales:', JSON.stringify(indexInfo, null, 2));
    
    // Buscar el índice que no incluye el tipo
    const oldIndexName = 'origen_1_destino_1_cliente_1_vigenciaDesde_1_vigenciaHasta_1_metodoCalculo_1';
    
    logger.info(`Intentando eliminar el índice antiguo: ${oldIndexName}`);
    try {
      await collection.dropIndex(oldIndexName);
      logger.info(`✅ Índice antiguo eliminado correctamente: ${oldIndexName}`);
    } catch (dropError) {
      logger.warn(`⚠️ No se pudo eliminar el índice o no existe: ${dropError.message}`);
    }
    
    // Crear nuevo índice que incluya el tipo
    logger.info('Creando nuevo índice que incluye el campo tipo...');
    await collection.createIndex({ 
      origen: 1, 
      destino: 1, 
      cliente: 1, 
      tipo: 1, // Incluir tipo en el índice único
      vigenciaDesde: 1,
      vigenciaHasta: 1,
      metodoCalculo: 1
    }, { 
      name: "origen_destino_cliente_tipo_fechas_metodo",
      unique: true,
      background: true 
    });
    
    logger.info('✅ Nuevo índice creado correctamente.');
    
    // Verificar los índices actualizados
    logger.info('Verificando índices actualizados...');
    const updatedIndexInfo = await collection.indexes();
    logger.debug('Índices actualizados:', JSON.stringify(updatedIndexInfo, null, 2));
    
    logger.info('Proceso completado con éxito.');
    
  } catch (error) {
    logger.error('❌ Error al actualizar índices:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    logger.info('Conexión cerrada.');
  }
}

// Ejecutar la función
updateTramoIndexes();