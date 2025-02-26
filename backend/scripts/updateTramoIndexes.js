// Script para actualizar los índices de la colección tramos
const mongoose = require('mongoose');
require('dotenv').config(); // Cargar variables de entorno

async function updateTramoIndexes() {
  try {
    // Conectar a la base de datos usando la misma configuración que el resto de la app
    console.log('Conectando a la base de datos...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conexión establecida correctamente.');

    // Obtener referencia a la colección tramos
    const db = mongoose.connection;
    const collection = db.collection('tramos');
    
    console.log('Obteniendo información de índices actuales...');
    const indexInfo = await collection.indexes();
    console.log('Índices actuales:', JSON.stringify(indexInfo, null, 2));
    
    // Buscar el índice que no incluye el tipo
    const oldIndexName = 'origen_1_destino_1_cliente_1_vigenciaDesde_1_vigenciaHasta_1_metodoCalculo_1';
    
    console.log(`Intentando eliminar el índice antiguo: ${oldIndexName}`);
    try {
      await collection.dropIndex(oldIndexName);
      console.log(`✅ Índice antiguo eliminado correctamente: ${oldIndexName}`);
    } catch (dropError) {
      console.warn(`⚠️ No se pudo eliminar el índice o no existe: ${dropError.message}`);
    }
    
    // Crear nuevo índice que incluya el tipo
    console.log('Creando nuevo índice que incluye el campo tipo...');
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
    
    console.log('✅ Nuevo índice creado correctamente.');
    
    // Verificar los índices actualizados
    console.log('Verificando índices actualizados...');
    const updatedIndexInfo = await collection.indexes();
    console.log('Índices actualizados:', JSON.stringify(updatedIndexInfo, null, 2));
    
    console.log('Proceso completado con éxito.');
    
  } catch (error) {
    console.error('❌ Error al actualizar índices:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('Conexión cerrada.');
  }
}

// Ejecutar la función
updateTramoIndexes();