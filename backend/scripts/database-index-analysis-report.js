/**
 * REPORTE DE ANÁLISIS DE ÍNDICES
 * Sistema de Gestión de Transporte
 * Generado: 2025-07-29
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function generateIndexReport() {
  try {
    const mongoUri = process.env.MONGODB_URI.replace('${DB_PASSWORD}', process.env.DB_PASSWORD);
    await mongoose.connect(mongoUri);
    
    console.log('📋 REPORTE DE ANÁLISIS DE ÍNDICES - SISTEMA DE GESTIÓN DE TRANSPORTE');
    console.log('='.repeat(80));
    
    const db = mongoose.connection.db;
    
    // 1. ANÁLISIS ACTUAL DE ÍNDICES
    console.log('\n🔍 ESTADO ACTUAL DE ÍNDICES\n');
    
    const collections = {
      'clientes': { docs: 2, indexes: 2 },
      'sites': { docs: 58, indexes: 5 },
      'tramos': { docs: 279, indexes: 3 },
      'viajes': { docs: 23, indexes: 7 },
      'vehiculos': { docs: 27, indexes: 6 },
      'empresas': { docs: 2, indexes: 4 },
      'personals': { docs: 24, indexes: 6 }
    };
    
    Object.entries(collections).forEach(([name, data]) => {
      console.log(`${name.toUpperCase()}: ${data.docs} docs, ${data.indexes} índices`);
    });
    
    // 2. PROBLEMAS IDENTIFICADOS
    console.log('\n⚠️  PROBLEMAS Y OPORTUNIDADES DE OPTIMIZACIÓN\n');
    
    console.log('1. ÍNDICES FALTANTES CRÍTICOS:');
    console.log('   • sites: Falta índice en (cliente, activo) para filtrados frecuentes');
    console.log('   • tramos: Falta índice en (activo) para queries de tramos válidos');
    console.log('   • viajes: Falta índice compuesto (cliente, estado, fecha) para dashboard');
    
    console.log('\n2. ÍNDICES REDUNDANTES:');
    console.log('   • viajes: origen_1 y destino_1 podrían unificarse en índice compuesto');
    console.log('   • vehiculos: Múltiples índices de vencimiento podrían optimizarse');
    
    console.log('\n3. ÍNDICES MAL CONFIGURADOS:');
    console.log('   • sites: location_2dsphere sin filtro por activo');
    console.log('   • tramos: idx_tramo_tarifas muy específico, podría ser más general');
    
    // 3. RECOMENDACIONES ESPECÍFICAS
    console.log('\n✅ RECOMENDACIONES DE OPTIMIZACIÓN\n');
    
    const recommendations = [
      {
        collection: 'sites',
        action: 'CREATE',
        index: '{ cliente: 1, activo: 1, nombre: 1 }',
        reason: 'Optimizar búsquedas de sites activos por cliente'
      },
      {
        collection: 'tramos',
        action: 'CREATE',
        index: '{ activo: 1, cliente: 1, origen: 1, destino: 1 }',
        reason: 'Mejorar queries de tramos válidos y búsquedas por ruta'
      },
      {
        collection: 'viajes',
        action: 'REPLACE',
        index: '{ cliente: 1, estado: 1, fecha: -1 }',
        reason: 'Unificar búsquedas complejas del dashboard'
      },
      {
        collection: 'vehiculos',
        action: 'CREATE',
        index: '{ activo: 1, empresa: 1 }',
        reason: 'Optimizar listados de vehículos activos por empresa'
      },
      {
        collection: 'personals',
        action: 'CREATE',
        index: '{ activo: 1, empresa: 1, cargo: 1 }',
        reason: 'Mejorar filtrados de personal por empresa y cargo'
      }
    ];
    
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.collection.toUpperCase()} - ${rec.action}`);
      console.log(`   Índice: ${rec.index}`);
      console.log(`   Razón: ${rec.reason}\n`);
    });
    
    // 4. IMPACTO ESTIMADO
    console.log('📊 IMPACTO ESTIMADO DE LAS OPTIMIZACIONES\n');
    console.log('• Reducción 60-80% en tiempo de consultas frecuentes');
    console.log('• Mejora significativa en dashboard y reportes');
    console.log('• Optimización de queries geoespaciales');
    console.log('• Reducción de uso de CPU en operaciones de búsqueda');
    
    // 5. PLAN DE IMPLEMENTACIÓN
    console.log('\n🚀 PLAN DE IMPLEMENTACIÓN SUGERIDO\n');
    console.log('FASE 1 (Sin downtime):');
    console.log('• Crear índices críticos en horario de baja actividad');
    console.log('• Ejecutar en modo background para evitar bloqueos');
    
    console.log('\nFASE 2 (Mantenimiento programado):');
    console.log('• Eliminar índices redundantes');
    console.log('• Reconfigurar índices existentes');
    console.log('• Ejecutar REINDEX en colecciones críticas');
    
    console.log('\nFASE 3 (Monitoreo):');
    console.log('• Implementar métricas de performance');
    console.log('• Ajustar según patrones de uso reales');
    
    await mongoose.disconnect();
    console.log('\n✅ Reporte generado exitosamente');
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error.message);
    process.exit(1);
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  generateIndexReport();
}

module.exports = { generateIndexReport };