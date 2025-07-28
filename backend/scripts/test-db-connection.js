#!/usr/bin/env node

/**
 * Script de diagnóstico para probar conexión a MongoDB Atlas
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log('🔍 Diagnosticando conexión a MongoDB Atlas...\n');
    
    // 1. Verificar variables de entorno
    console.log('1. Verificando variables de entorno:');
    const mongoURI = process.env.MONGODB_URI;
    const dbPassword = process.env.DB_PASSWORD;
    
    if (!mongoURI) {
        console.error('❌ MONGODB_URI no está definida');
        process.exit(1);
    }
    
    if (!dbPassword) {
        console.error('❌ DB_PASSWORD no está definida');
        process.exit(1);
    }
    
    console.log('   ✅ Variables de entorno configuradas');
    
    // 2. Construir URI final
    const finalURI = mongoURI.replace('${DB_PASSWORD}', dbPassword);
    const safeURI = finalURI.replace(/\/\/.*@/, '//<credentials>@');
    console.log(`   📍 URI: ${safeURI}\n`);
    
    // 3. Probar conexión con diferentes timeouts
    console.log('2. Probando conexión...');
    
    const testConfigs = [
        {
            name: 'Rápida (5s)',
            options: {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
                socketTimeoutMS: 5000
            }
        },
        {
            name: 'Normal (15s)',
            options: {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                socketTimeoutMS: 15000
            }
        },
        {
            name: 'Extendida (30s)',
            options: {
                serverSelectionTimeoutMS: 30000,
                connectTimeoutMS: 30000,
                socketTimeoutMS: 30000
            }
        }
    ];
    
    for (const config of testConfigs) {
        console.log(`\n   🧪 Probando conexión ${config.name}...`);
        
        try {
            const startTime = Date.now();
            await mongoose.connect(finalURI, config.options);
            const duration = Date.now() - startTime;
            
            console.log(`   ✅ Conexión exitosa en ${duration}ms`);
            
            // Probar una operación básica
            const adminDb = mongoose.connection.db.admin();
            const result = await adminDb.ping();
            console.log('   ✅ Ping a la base de datos exitoso');
            
            // Listar bases de datos disponibles
            const dbList = await adminDb.listDatabases();
            console.log(`   📊 Bases de datos disponibles: ${dbList.databases.map(db => db.name).join(', ')}`);
            
            await mongoose.disconnect();
            console.log('   ✅ Desconexión exitosa');
            
            console.log('\n🎉 ¡Conexión a MongoDB Atlas funciona correctamente!');
            process.exit(0);
            
        } catch (error) {
            console.log(`   ❌ Falló: ${error.message}`);
            
            if (error.name === 'MongoNetworkTimeoutError') {
                console.log('      🔍 Esto sugiere problemas de conectividad de red');
            } else if (error.name === 'MongoServerSelectionError') {
                console.log('      🔍 No se pudo seleccionar un servidor MongoDB');
            } else if (error.name === 'MongoParseError') {
                console.log('      🔍 Error en el formato de la URI de conexión');
            }
            
            // Intentar desconectar si hay conexión parcial
            try {
                await mongoose.disconnect();
            } catch (disconnectError) {
                // Ignorar errores de desconexión
            }
        }
    }
    
    console.log('\n❌ Todas las pruebas de conexión fallaron');
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verificar que tu IP esté en el Access List de MongoDB Atlas');
    console.log('   2. Confirmar credenciales (usuario/password)');
    console.log('   3. Revisar configuración de firewall/proxy');
    console.log('   4. Verificar estado del cluster en MongoDB Atlas');
    console.log('   5. Probar desde otra conexión de red');
    
    process.exit(1);
}

// Manejar interrupciones
process.on('SIGINT', async () => {
    console.log('\n🛑 Prueba interrumpida por el usuario');
    try {
        await mongoose.disconnect();
    } catch (error) {
        // Ignorar errores de desconexión
    }
    process.exit(0);
});

// Ejecutar diagnóstico
testConnection().catch(error => {
    console.error('\n💥 Error inesperado:', error);
    process.exit(1);
});