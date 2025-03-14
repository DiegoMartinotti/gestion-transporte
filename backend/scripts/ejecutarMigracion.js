/**
 * Script para ejecutar la migración de tramos
 * Incluye confirmación del usuario para evitar ejecuciones accidentales
 */

const readline = require('readline');
const { migrarTramos } = require('./migracionTramos');
const logger = require('../utils/logger');

// Verificar si se pasó una URI como argumento
const args = process.argv.slice(2);
const uri = args.length > 0 ? args[0] : null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Mostrar advertencia y solicitar confirmación
console.log('\n');
console.log('='.repeat(80));
console.log('ADVERTENCIA: MIGRACIÓN DE DATOS DE TRAMOS'.padStart(50, ' '));
console.log('='.repeat(80));
console.log('\nEste script realizará las siguientes acciones:');
console.log('  1. Crear un backup de la colección de tramos actual');
console.log('  2. Transformar el modelo de datos de tramos al nuevo formato con histórico');
console.log('  3. Reemplazar todos los documentos existentes');
console.log('\nSe recomienda:');
console.log('  - Realizar un backup completo de la base de datos antes de continuar');
console.log('  - Ejecutar este script en un entorno de pruebas primero');
console.log('  - Verificar que no haya usuarios activos en el sistema');

if (uri) {
    console.log(`\nConexión: Se utilizará la URI proporcionada: ${uri.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@')}`);
} else {
    console.log('\nConexión: Se intentará detectar automáticamente la URI de MongoDB');
    console.log('          Si desea especificar la URI manualmente, ejecute:');
    console.log('          node backend/scripts/ejecutarMigracion.js "mongodb://usuario:contraseña@host:puerto/basedatos"');
}

console.log('\n');

rl.question('¿Está seguro de que desea continuar? (escriba "SI" para confirmar): ', async (respuesta) => {
    if (respuesta.trim().toUpperCase() === 'SI') {
        console.log('\nIniciando proceso de migración...\n');
        
        try {
            await migrarTramos(uri);
            console.log('\nMigración completada exitosamente.');
        } catch (error) {
            console.error('\nError durante la migración:', error.message);
            console.error('Revise los logs para más detalles.');
        }
    } else {
        console.log('\nOperación cancelada por el usuario.');
    }
    
    rl.close();
    process.exit(0);
}); 