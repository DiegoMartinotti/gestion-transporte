/**
 * SCRIPT DE OPTIMIZACIÓN DE ÍNDICES
 * Sistema de Gestión de Transporte
 * 
 * Este script implementa las recomendaciones del análisis de índices
 * para mejorar significativamente el rendimiento de la base de datos.
 * 
 * IMPORTANTE: Ejecutar en horario de baja actividad
 */

require('dotenv').config();
const mongoose = require('mongoose');

class IndexOptimizer {
  constructor() {
    this.db = null;
    this.results = {
      created: [],
      dropped: [],
      errors: []
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

  async createIndex(collectionName, indexSpec, options = {}) {
    try {
      const collection = this.db.collection(collectionName);
      const indexName = await collection.createIndex(indexSpec, { 
        background: true, 
        ...options 
      });
      
      console.log(`✅ Índice creado: ${collectionName}.${indexName}`);
      this.results.created.push({ collection: collectionName, index: indexName });
      return true;
    } catch (error) {
      console.error(`❌ Error creando índice en ${collectionName}:`, error.message);
      this.results.errors.push({ collection: collectionName, error: error.message });
      return false;
    }
  }

  async dropIndex(collectionName, indexName) {
    try {
      const collection = this.db.collection(collectionName);
      await collection.dropIndex(indexName);
      
      console.log(`🗑️  Índice eliminado: ${collectionName}.${indexName}`);
      this.results.dropped.push({ collection: collectionName, index: indexName });
      return true;
    } catch (error) {
      console.error(`❌ Error eliminando índice ${indexName} en ${collectionName}:`, error.message);
      this.results.errors.push({ collection: collectionName, error: error.message });
      return false;
    }
  }

  async checkIndexExists(collectionName, indexName) {
    try {
      const collection = this.db.collection(collectionName);
      const indexes = await collection.indexes();
      return indexes.some(idx => idx.name === indexName);
    } catch (error) {
      return false;
    }
  }

  async optimizeSitesIndexes() {
    console.log('\n🏢 OPTIMIZANDO ÍNDICES DE SITES...');
    
    // Crear índice compuesto crítico para filtrados frecuentes
    await this.createIndex('sites', 
      { cliente: 1, activo: 1, nombre: 1 }, 
      { name: 'idx_sites_cliente_activo_nombre' }
    );
    
    // Mejorar índice geoespacial con filtro de activos
    await this.createIndex('sites', 
      { activo: 1, location: '2dsphere' }, 
      { name: 'idx_sites_activo_location' }
    );
  }

  async optimizeTramosIndexes() {
    console.log('\n🛣️  OPTIMIZANDO ÍNDICES DE TRAMOS...');
    
    // Índice principal para tramos activos
    await this.createIndex('tramos', 
      { activo: 1, cliente: 1, origen: 1, destino: 1 }, 
      { name: 'idx_tramos_activo_cliente_ruta' }
    );
    
    // Índice optimizado para tarifas vigentes
    await this.createIndex('tramos', 
      { activo: 1, 'tarifasHistoricas.vigente': 1, 'tarifasHistoricas.tipo': 1 }, 
      { name: 'idx_tramos_tarifas_vigentes' }
    );
  }

  async optimizeViajesIndexes() {
    console.log('\n🚛 OPTIMIZANDO ÍNDICES DE VIAJES...');
    
    // Índice principal para dashboard
    await this.createIndex('viajes', 
      { cliente: 1, estado: 1, fecha: -1 }, 
      { name: 'idx_viajes_dashboard' }
    );
    
    // Índice para búsquedas por ruta
    await this.createIndex('viajes', 
      { origen: 1, destino: 1, fecha: -1 }, 
      { name: 'idx_viajes_ruta_fecha' }
    );
    
    // Eliminar índices redundantes individuales
    const redundantIndexes = ['origen_1', 'destino_1'];
    for (const indexName of redundantIndexes) {
      if (await this.checkIndexExists('viajes', indexName)) {
        await this.dropIndex('viajes', indexName);
      }
    }
  }

  async optimizeVehiculosIndexes() {
    console.log('\n🚚 OPTIMIZANDO ÍNDICES DE VEHÍCULOS...');
    
    // Índice principal para listados
    await this.createIndex('vehiculos', 
      { activo: 1, empresa: 1, dominio: 1 }, 
      { name: 'idx_vehiculos_activo_empresa' }
    );
    
    // Índice para alertas de vencimientos
    await this.createIndex('vehiculos', 
      { activo: 1, 'documentacion.seguro.vencimiento': 1 },
      { name: 'idx_vehiculos_alertas_seguro' }
    );
    
    await this.createIndex('vehiculos', 
      { activo: 1, 'documentacion.vtv.vencimiento': 1 },
      { name: 'idx_vehiculos_alertas_vtv' }
    );
  }

  async optimizePersonalsIndexes() {
    console.log('\n👥 OPTIMIZANDO ÍNDICES DE PERSONAL...');
    
    // Índice principal para listados
    await this.createIndex('personals', 
      { activo: 1, empresa: 1, cargo: 1 }, 
      { name: 'idx_personal_activo_empresa_cargo' }
    );
    
    // Índice para alertas de vencimientos
    await this.createIndex('personals', 
      { activo: 1, 'documentacion.licenciaConducir.vencimiento': 1 },
      { name: 'idx_personal_alertas_licencia' }
    );
  }

  async optimizeClientesIndexes() {
    console.log('\n🏛️  OPTIMIZANDO ÍNDICES DE CLIENTES...');
    
    // Agregar índice para búsquedas con estado
    await this.createIndex('clientes', 
      { activo: 1, nombre: 1 }, 
      { name: 'idx_clientes_activo_nombre' }
    );
  }

  async runOptimization() {
    console.log('🚀 INICIANDO OPTIMIZACIÓN DE ÍNDICES');
    console.log('='.repeat(50));
    
    try {
      await this.connect();
      
      // Ejecutar optimizaciones por colección
      await this.optimizeClientesIndexes();
      await this.optimizeSitesIndexes();
      await this.optimizeTramosIndexes();
      await this.optimizeViajesIndexes();
      await this.optimizeVehiculosIndexes();
      await this.optimizePersonalsIndexes();
      
      // Mostrar resumen
      this.showSummary();
      
    } catch (error) {
      console.error('❌ Error durante la optimización:', error.message);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Desconectado de MongoDB');
    }
  }

  showSummary() {
    console.log('\n📊 RESUMEN DE OPTIMIZACIÓN');
    console.log('='.repeat(30));
    
    console.log(`✅ Índices creados: ${this.results.created.length}`);
    this.results.created.forEach(item => {
      console.log(`   • ${item.collection}.${item.index}`);
    });
    
    if (this.results.dropped.length > 0) {
      console.log(`🗑️  Índices eliminados: ${this.results.dropped.length}`);
      this.results.dropped.forEach(item => {
        console.log(`   • ${item.collection}.${item.index}`);
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log(`❌ Errores: ${this.results.errors.length}`);
      this.results.errors.forEach(item => {
        console.log(`   • ${item.collection}: ${item.error}`);
      });
    }
    
    console.log('\n🎯 OPTIMIZACIÓN COMPLETADA');
    console.log('Se recomienda monitorear el rendimiento de las consultas');
    console.log('durante los próximos días para validar las mejoras.');
  }

  // Método para verificar el estado post-optimización
  async verifyOptimization() {
    console.log('\n🔍 VERIFICANDO OPTIMIZACIÓN...');
    
    const collections = ['clientes', 'sites', 'tramos', 'viajes', 'vehiculos', 'personals'];
    
    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();
        
        console.log(`\n${collectionName.toUpperCase()} - ${indexes.length} índices:`);
        indexes.forEach(index => {
          const keyStr = JSON.stringify(index.key);
          console.log(`  • ${index.name}: ${keyStr}`);
        });
      } catch (error) {
        console.log(`❌ Error verificando ${collectionName}: ${error.message}`);
      }
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const optimizer = new IndexOptimizer();
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    optimizer.connect().then(() => optimizer.verifyOptimization());
  } else if (args.includes('--dry-run')) {
    console.log('🧪 MODO DRY-RUN: Solo mostrando cambios propuestos...');
    // TODO: Implementar modo dry-run
  } else {
    optimizer.runOptimization();
  }
}

module.exports = IndexOptimizer;