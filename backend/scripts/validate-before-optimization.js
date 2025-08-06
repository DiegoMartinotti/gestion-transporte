/**
 * VALIDACIÓN PREVIA A OPTIMIZACIÓN DE ÍNDICES
 * 
 * Este script valida el estado actual de la base de datos
 * antes de ejecutar las optimizaciones de índices.
 */

require('dotenv').config();
const mongoose = require('mongoose');

class PreOptimizationValidator {
  constructor() {
    this.db = null;
    this.validationResults = {
      checks: [],
      warnings: [],
      errors: [],
      canProceed: true
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

  addCheck(status, message, type = 'info') {
    const check = { status, message, type };
    this.validationResults.checks.push(check);
    
    const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${message}`);
    
    if (type === 'warning') {
      this.validationResults.warnings.push(check);
    } else if (type === 'error') {
      this.validationResults.errors.push(check);
      this.validationResults.canProceed = false;
    }
  }

  async checkDatabaseConnection() {
    console.log('\n🔌 VERIFICANDO CONEXIÓN A BASE DE DATOS...');
    
    try {
      const admin = this.db.admin();
      const result = await admin.ping();
      
      if (result.ok === 1) {
        this.addCheck('PASS', 'Conexión a MongoDB Atlas exitosa');
      } else {
        this.addCheck('FAIL', 'Ping a MongoDB falló', 'error');
      }
    } catch (error) {
      this.addCheck('FAIL', `Error de conectividad: ${error.message}`, 'error');
    }
  }

  async checkDatabaseSize() {
    console.log('\n💾 VERIFICANDO TAMAÑO DE BASE DE DATOS...');
    
    try {
      const stats = await this.db.stats();
      const sizeInMB = (stats.dataSize / 1024 / 1024).toFixed(2);
      
      this.addCheck('PASS', `Tamaño de BD: ${sizeInMB} MB`);
      
      if (stats.dataSize > 100 * 1024 * 1024) { // > 100MB
        this.addCheck('WARN', 'Base de datos grande - considerar horario de mantenimiento', 'warning');
      }
    } catch (error) {
      this.addCheck('FAIL', `Error obteniendo estadísticas: ${error.message}`, 'error');
    }
  }

  async checkCollectionHealth() {
    console.log('\n🏥 VERIFICANDO SALUD DE COLECCIONES...');
    
    const criticalCollections = ['clientes', 'sites', 'tramos', 'viajes', 'vehiculos'];
    
    for (const collectionName of criticalCollections) {
      try {
        const collection = this.db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          this.addCheck('PASS', `${collectionName}: ${count} documentos`);
        } else {
          this.addCheck('WARN', `${collectionName}: Colección vacía`, 'warning');
        }
        
        // Verificar estructura básica de algunos documentos
        const sample = await collection.findOne();
        if (sample && sample._id) {
          this.addCheck('PASS', `${collectionName}: Estructura válida`);
        }
        
      } catch (error) {
        this.addCheck('FAIL', `${collectionName}: Error - ${error.message}`, 'error');
      }
    }
  }

  async checkExistingIndexes() {
    console.log('\n🔍 VERIFICANDO ÍNDICES EXISTENTES...');
    
    const collections = ['clientes', 'sites', 'tramos', 'viajes', 'vehiculos', 'personals'];
    let totalIndexes = 0;
    
    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();
        totalIndexes += indexes.length;
        
        this.addCheck('PASS', `${collectionName}: ${indexes.length} índices actuales`);
        
        // Verificar índices críticos existentes
        const hasBasicIndex = indexes.some(idx => idx.name === '_id_');
        if (!hasBasicIndex) {
          this.addCheck('FAIL', `${collectionName}: Falta índice _id básico`, 'error');
        }
        
      } catch (error) {
        this.addCheck('FAIL', `${collectionName}: Error verificando índices - ${error.message}`, 'error');
      }
    }
    
    this.addCheck('PASS', `Total de índices actuales: ${totalIndexes}`);
  }

  async checkDiskSpace() {
    console.log('\n💿 VERIFICANDO ESPACIO EN DISCO...');
    
    try {
      const dbStats = await this.db.stats();
      const indexSize = (dbStats.indexSize / 1024 / 1024).toFixed(2);
      const dataSize = (dbStats.dataSize / 1024 / 1024).toFixed(2);
      
      this.addCheck('PASS', `Tamaño de índices: ${indexSize} MB`);
      this.addCheck('PASS', `Tamaño de datos: ${dataSize} MB`);
      
      // Estimar espacio adicional necesario para nuevos índices
      const estimatedNewIndexSize = parseFloat(indexSize) * 0.3; // ~30% más
      this.addCheck('PASS', `Espacio estimado para nuevos índices: ${estimatedNewIndexSize.toFixed(2)} MB`);
      
    } catch (error) {
      this.addCheck('WARN', `No se pudo verificar espacio en disco: ${error.message}`, 'warning');
    }
  }

  async checkActiveConnections() {
    console.log('\n🔗 VERIFICANDO CONEXIONES ACTIVAS...');
    
    try {
      // En MongoDB Atlas, esta información puede estar limitada
      const serverStatus = await this.db.admin().serverStatus();
      
      if (serverStatus.connections) {
        const active = serverStatus.connections.active || 0;
        const available = serverStatus.connections.available || 0;
        
        this.addCheck('PASS', `Conexiones activas: ${active}`);
        this.addCheck('PASS', `Conexiones disponibles: ${available}`);
        
        if (active > available * 0.8) {
          this.addCheck('WARN', 'Alto número de conexiones activas - considerar horario off-peak', 'warning');
        }
      } else {
        this.addCheck('WARN', 'Información de conexiones no disponible en Atlas', 'warning');
      }
    } catch (error) {
      this.addCheck('WARN', `No se pudo verificar conexiones: ${error.message}`, 'warning');
    }
  }

  async checkReplicationStatus() {
    console.log('\n🔄 VERIFICANDO ESTADO DE REPLICACIÓN...');
    
    try {
      // En Atlas, la replicación está manejada automáticamente
      this.addCheck('PASS', 'Usando MongoDB Atlas - replicación automática');
      
      // Verificar si estamos en el primary
      const isMaster = await this.db.admin().command({ isMaster: 1 });
      if (isMaster.ismaster) {
        this.addCheck('PASS', 'Conectado al nodo principal');
      } else {
        this.addCheck('WARN', 'Conectado a nodo secundario', 'warning');
      }
      
    } catch (error) {
      this.addCheck('WARN', `Error verificando replicación: ${error.message}`, 'warning');
    }
  }

  generateRecommendations() {
    console.log('\n💡 RECOMENDACIONES...');
    
    const recommendations = [];
    
    if (this.validationResults.warnings.length > 0) {
      recommendations.push('• Ejecutar optimización durante horario de baja actividad');
      recommendations.push('• Monitorear rendimiento durante y después de la optimización');
    }
    
    if (this.validationResults.errors.length === 0) {
      recommendations.push('• Sistema listo para optimización de índices');
      recommendations.push('• Considerar backup antes de cambios importantes');
    } else {
      recommendations.push('• Resolver errores críticos antes de proceder');
      recommendations.push('• Verificar conectividad y permisos');
    }
    
    recommendations.forEach(rec => console.log(rec));
  }

  async runValidation() {
    console.log('🔍 VALIDACIÓN PREVIA A OPTIMIZACIÓN DE ÍNDICES');
    console.log('='.repeat(55));
    
    try {
      await this.connect();
      
      await this.checkDatabaseConnection();
      await this.checkDatabaseSize();
      await this.checkCollectionHealth();
      await this.checkExistingIndexes();
      await this.checkDiskSpace();
      await this.checkActiveConnections();
      await this.checkReplicationStatus();
      
      this.showSummary();
      this.generateRecommendations();
      
    } catch (error) {
      console.error('❌ Error durante la validación:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Desconectado de MongoDB');
    }
  }

  showSummary() {
    console.log('\n📋 RESUMEN DE VALIDACIÓN');
    console.log('='.repeat(25));
    
    const passed = this.validationResults.checks.filter(c => c.status === 'PASS').length;
    const warnings = this.validationResults.warnings.length;
    const errors = this.validationResults.errors.length;
    
    console.log(`✅ Verificaciones exitosas: ${passed}`);
    console.log(`⚠️  Advertencias: ${warnings}`);
    console.log(`❌ Errores críticos: ${errors}`);
    
    if (this.validationResults.canProceed) {
      console.log('\n🚦 ESTADO: LISTO PARA OPTIMIZACIÓN');
      console.log('El sistema está en condiciones de ejecutar la optimización de índices.');
    } else {
      console.log('\n🛑 ESTADO: NO PROCEDER');
      console.log('Se encontraron errores críticos que deben resolverse primero.');
    }
    
    return this.validationResults.canProceed;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const validator = new PreOptimizationValidator();
  validator.runValidation();
}

module.exports = PreOptimizationValidator;