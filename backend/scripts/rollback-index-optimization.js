/**
 * SCRIPT DE ROLLBACK PARA OPTIMIZACIÓN DE ÍNDICES
 * 
 * Este script permite revertir los cambios realizados por la optimización
 * de índices en caso de problemas de rendimiento o errores.
 * 
 * Uso: node rollback-index-optimization.js [--confirm]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

class IndexRollback {
  constructor() {
    this.db = null;
    this.backupFile = path.join(__dirname, 'index-backup.json');
    this.rollbackResults = {
      restored: [],
      errors: [],
      warnings: []
    };
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI.replace('${DB_PASSWORD}', process.env.DB_PASSWORD);
      await mongoose.connect(mongoUri);
      this.db = mongoose.connection.db;
      console.log('✅ Conectado a MongoDB Atlas');
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      throw error;
    }
  }

  async createBackup() {
    console.log('💾 CREANDO BACKUP DE ÍNDICES ACTUALES...');
    
    const collections = ['clientes', 'sites', 'tramos', 'viajes', 'vehiculos', 'personals', 'empresas'];
    const backup = {
      timestamp: new Date().toISOString(),
      collections: {}
    };
    
    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();
        
        backup.collections[collectionName] = indexes;
        console.log(`✅ Backup ${collectionName}: ${indexes.length} índices`);
        
      } catch (error) {
        console.error(`❌ Error en backup de ${collectionName}:`, error.message);
      }
    }
    
    try {
      await fs.writeFile(this.backupFile, JSON.stringify(backup, null, 2));
      console.log(`💾 Backup guardado en: ${this.backupFile}`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando backup:', error.message);
      return false;
    }
  }

  async loadBackup() {
    try {
      const backupData = await fs.readFile(this.backupFile, 'utf8');
      const backup = JSON.parse(backupData);
      
      console.log(`📂 Backup cargado desde: ${backup.timestamp}`);
      return backup;
    } catch (error) {
      console.error('❌ Error cargando backup:', error.message);
      return null;
    }
  }

  async dropIndex(collectionName, indexName) {
    try {
      // No eliminar el índice _id que es obligatorio
      if (indexName === '_id_') {
        return true;
      }
      
      const collection = this.db.collection(collectionName);
      await collection.dropIndex(indexName);
      
      console.log(`🗑️  Eliminado: ${collectionName}.${indexName}`);
      return true;
    } catch (error) {
      // Si el índice no existe, no es un error crítico
      if (error.message.includes('index not found')) {
        console.log(`⚠️  Índice ya no existe: ${collectionName}.${indexName}`);
        return true;
      }
      
      console.error(`❌ Error eliminando ${collectionName}.${indexName}:`, error.message);
      this.rollbackResults.errors.push({
        collection: collectionName,
        index: indexName,
        error: error.message
      });
      return false;
    }
  }

  async recreateIndex(collectionName, indexSpec) {
    try {
      // No recrear el índice _id que ya existe
      if (indexSpec.name === '_id_') {
        return true;
      }
      
      const collection = this.db.collection(collectionName);
      
      // Preparar opciones del índice
      const indexOptions = { name: indexSpec.name };
      
      if (indexSpec.unique) indexOptions.unique = true;
      if (indexSpec.sparse) indexOptions.sparse = true;
      if (indexSpec.partialFilterExpression) {
        indexOptions.partialFilterExpression = indexSpec.partialFilterExpression;
      }
      
      await collection.createIndex(indexSpec.key, indexOptions);
      
      console.log(`✅ Recreado: ${collectionName}.${indexSpec.name}`);
      this.rollbackResults.restored.push({
        collection: collectionName,
        index: indexSpec.name
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Error recreando ${collectionName}.${indexSpec.name}:`, error.message);
      this.rollbackResults.errors.push({
        collection: collectionName,
        index: indexSpec.name,
        error: error.message
      });
      return false;
    }
  }

  async getCurrentIndexes() {
    const collections = ['clientes', 'sites', 'tramos', 'viajes', 'vehiculos', 'personals', 'empresas'];
    const current = {};
    
    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();
        current[collectionName] = indexes;
      } catch (error) {
        console.error(`❌ Error obteniendo índices de ${collectionName}:`, error.message);
        current[collectionName] = [];
      }
    }
    
    return current;
  }

  async performRollback(backup) {
    console.log('🔄 INICIANDO ROLLBACK DE ÍNDICES...');
    
    const currentIndexes = await this.getCurrentIndexes();
    
    for (const [collectionName, backupIndexes] of Object.entries(backup.collections)) {
      console.log(`\n📋 Procesando ${collectionName.toUpperCase()}...`);
      
      const current = currentIndexes[collectionName] || [];
      
      // 1. Eliminar índices que no estaban en el backup
      for (const currentIndex of current) {
        const existsInBackup = backupIndexes.some(bi => bi.name === currentIndex.name);
        
        if (!existsInBackup) {
          console.log(`🗑️  Eliminando índice nuevo: ${currentIndex.name}`);
          await this.dropIndex(collectionName, currentIndex.name);
        }
      }
      
      // 2. Recrear índices que estaban en el backup pero ya no existen
      for (const backupIndex of backupIndexes) {
        const existsInCurrent = current.some(ci => ci.name === backupIndex.name);
        
        if (!existsInCurrent) {
          console.log(`➕ Recreando índice original: ${backupIndex.name}`);
          await this.recreateIndex(collectionName, backupIndex);
        }
      }
    }
  }

  showRollbackSummary() {
    console.log('\n📊 RESUMEN DE ROLLBACK');
    console.log('='.repeat(25));
    
    console.log(`✅ Índices restaurados: ${this.rollbackResults.restored.length}`);
    this.rollbackResults.restored.forEach(item => {
      console.log(`   • ${item.collection}.${item.index}`);
    });
    
    if (this.rollbackResults.errors.length > 0) {
      console.log(`❌ Errores: ${this.rollbackResults.errors.length}`);
      this.rollbackResults.errors.forEach(item => {
        console.log(`   • ${item.collection}.${item.index}: ${item.error}`);
      });
    }
    
    if (this.rollbackResults.warnings.length > 0) {
      console.log(`⚠️  Advertencias: ${this.rollbackResults.warnings.length}`);
      this.rollbackResults.warnings.forEach(item => {
        console.log(`   • ${item.message}`);
      });
    }
  }

  async run() {
    const args = process.argv.slice(2);
    
    console.log('🔄 SCRIPT DE ROLLBACK DE OPTIMIZACIÓN DE ÍNDICES');
    console.log('='.repeat(55));
    
    try {
      await this.connect();
      
      if (args.includes('--backup-only')) {
        console.log('💾 Creando solo backup...');
        await this.createBackup();
        return;
      }
      
      // Verificar si existe backup
      const backup = await this.loadBackup();
      
      if (!backup) {
        console.log('⚠️  No se encontró archivo de backup.');
        console.log('Creando backup de estado actual antes de continuar...');
        
        const backupCreated = await this.createBackup();
        if (!backupCreated) {
          console.error('❌ No se pudo crear backup. Abortando rollback.');
          return;
        }
        
        console.log('❓ ¿Deseas continuar con el rollback? (no hay estado previo para restaurar)');
        return;
      }
      
      // Confirmar rollback
      if (!args.includes('--confirm')) {
        console.log('⚠️  ADVERTENCIA: Esta operación revertirá todos los cambios de optimización.');
        console.log('Para confirmar, ejecuta con --confirm:');
        console.log('node rollback-index-optimization.js --confirm');
        return;
      }
      
      await this.performRollback(backup);
      this.showRollbackSummary();
      
      console.log('\n✅ ROLLBACK COMPLETADO');
      console.log('Se recomienda monitorear el rendimiento para confirmar la reversión.');
      
    } catch (error) {
      console.error('❌ Error durante rollback:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Desconectado de MongoDB');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const rollback = new IndexRollback();
  rollback.run();
}

module.exports = IndexRollback;