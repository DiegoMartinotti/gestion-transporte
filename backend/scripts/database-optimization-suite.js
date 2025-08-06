#!/usr/bin/env node

/**
 * SUITE COMPLETA DE OPTIMIZACIÓN DE BASE DE DATOS
 * Sistema de Gestión de Transporte
 * 
 * Este script orquesta el proceso completo de análisis y optimización
 * de índices de la base de datos MongoDB.
 * 
 * Uso:
 *   node database-optimization-suite.js [options]
 * 
 * Opciones:
 *   --analyze     Solo ejecutar análisis sin modificaciones
 *   --validate    Solo ejecutar validación previa
 *   --optimize    Ejecutar optimización completa (requiere validación exitosa)
 *   --verify      Verificar estado post-optimización
 *   --all         Ejecutar secuencia completa (defecto)
 */

const PreOptimizationValidator = require('./validate-before-optimization');
const IndexOptimizer = require('./optimize-database-indexes');
const { generateIndexReport } = require('./database-index-analysis-report');

class DatabaseOptimizationSuite {
  constructor() {
    this.args = process.argv.slice(2);
    this.validator = new PreOptimizationValidator();
    this.optimizer = new IndexOptimizer();
  }

  async runAnalysis() {
    console.log('📊 EJECUTANDO ANÁLISIS DE ÍNDICES...');
    console.log('='.repeat(40));
    
    try {
      await generateIndexReport();
      return true;
    } catch (error) {
      console.error('❌ Error en análisis:', error.message);
      return false;
    }
  }

  async runValidation() {
    console.log('🔍 EJECUTANDO VALIDACIÓN PREVIA...');
    console.log('='.repeat(35));
    
    try {
      await this.validator.runValidation();
      return this.validator.validationResults.canProceed;
    } catch (error) {
      console.error('❌ Error en validación:', error.message);
      return false;
    }
  }

  async runOptimization() {
    console.log('🚀 EJECUTANDO OPTIMIZACIÓN...');
    console.log('='.repeat(30));
    
    try {
      await this.optimizer.runOptimization();
      return true;
    } catch (error) {
      console.error('❌ Error en optimización:', error.message);
      return false;
    }
  }

  async runVerification() {
    console.log('✅ EJECUTANDO VERIFICACIÓN POST-OPTIMIZACIÓN...');
    console.log('='.repeat(50));
    
    try {
      await this.optimizer.connect();
      await this.optimizer.verifyOptimization();
      return true;
    } catch (error) {
      console.error('❌ Error en verificación:', error.message);
      return false;
    }
  }

  showUsage() {
    console.log(`
🛠️  SUITE DE OPTIMIZACIÓN DE BASE DE DATOS
==========================================

Uso: node database-optimization-suite.js [opciones]

Opciones:
  --analyze     📊 Solo análisis de índices actuales
  --validate    🔍 Solo validación previa
  --optimize    🚀 Solo optimización (requiere --validate primero)
  --verify      ✅ Solo verificación post-optimización
  --all         🔄 Proceso completo (defecto)
  --help        ❓ Mostrar esta ayuda

Ejemplos:
  node database-optimization-suite.js --analyze
  node database-optimization-suite.js --validate
  node database-optimization-suite.js --all
  
⚠️  IMPORTANTE: Ejecutar en horario de baja actividad para producción
    `);
  }

  async runCompleteProcess() {
    console.log('🔄 INICIANDO PROCESO COMPLETO DE OPTIMIZACIÓN');
    console.log('='.repeat(50));
    
    const steps = [
      { name: 'Análisis', method: () => this.runAnalysis() },
      { name: 'Validación', method: () => this.runValidation() },
      { name: 'Optimización', method: () => this.runOptimization() },
      { name: 'Verificación', method: () => this.runVerification() }
    ];
    
    let allSuccessful = true;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n📍 PASO ${i + 1}/4: ${step.name.toUpperCase()}`);
      
      const success = await step.method();
      
      if (!success) {
        console.error(`❌ Fallo en paso: ${step.name}`);
        allSuccessful = false;
        
        // Si falla la validación, no continuar
        if (step.name === 'Validación') {
          console.log('🛑 Deteniendo proceso debido a validación fallida');
          break;
        }
      } else {
        console.log(`✅ ${step.name} completado exitosamente`);
      }
      
      // Pausa entre pasos para no sobrecargar la BD
      if (i < steps.length - 1) {
        console.log('⏱️  Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return allSuccessful;
  }

  async run() {
    const startTime = Date.now();
    
    // Verificar argumentos
    if (this.args.includes('--help') || this.args.includes('-h')) {
      this.showUsage();
      return;
    }
    
    try {
      let success = false;
      
      if (this.args.includes('--analyze')) {
        success = await this.runAnalysis();
      } else if (this.args.includes('--validate')) {
        success = await this.runValidation();
      } else if (this.args.includes('--optimize')) {
        // Verificar que se haya ejecutado validación primero
        console.log('⚠️  ATENCIÓN: Asegúrate de haber ejecutado --validate primero');
        success = await this.runOptimization();
      } else if (this.args.includes('--verify')) {
        success = await this.runVerification();
      } else {
        // Proceso completo por defecto
        success = await this.runCompleteProcess();
      }
      
      // Mostrar resumen final
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '='.repeat(60));
      console.log('📋 RESUMEN FINAL DE EJECUCIÓN');
      console.log('='.repeat(60));
      
      if (success) {
        console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
        console.log(`⏱️  Tiempo total: ${duration} segundos`);
        console.log('\n💡 Próximos pasos recomendados:');
        console.log('   • Monitorear rendimiento de consultas');
        console.log('   • Verificar logs de aplicación por mejoras');
        console.log('   • Documentar cambios realizados');
      } else {
        console.log('❌ PROCESO COMPLETADO CON ERRORES');
        console.log(`⏱️  Tiempo total: ${duration} segundos`);
        console.log('\n🔧 Acciones recomendadas:');
        console.log('   • Revisar logs de error detallados');
        console.log('   • Verificar conectividad a BD');
        console.log('   • Contactar administrador de sistemas');
      }
      
    } catch (error) {
      console.error('💥 ERROR CRÍTICO:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const suite = new DatabaseOptimizationSuite();
  suite.run().catch(error => {
    console.error('💥 Error no capturado:', error);
    process.exit(1);
  });
}

module.exports = DatabaseOptimizationSuite;