/**
 * Script para configurar el entorno de desarrollo
 * 
 * Este script establece la variable de entorno NODE_ENV a 'development'
 * para que se muestren todos los logs en la terminal.
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo .env
const envPath = path.join(__dirname, '..', '.env');

// Leer el archivo .env si existe
let envContent = '';
try {
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
} catch (err) {
  console.error('Error al leer el archivo .env:', err);
  process.exit(1);
}

// Verificar si ya existe NODE_ENV
const nodeEnvRegex = /^NODE_ENV\s*=\s*.+$/m;
if (nodeEnvRegex.test(envContent)) {
  // Reemplazar NODE_ENV existente
  envContent = envContent.replace(nodeEnvRegex, 'NODE_ENV=development');
} else {
  // Agregar NODE_ENV al final
  envContent += '\nNODE_ENV=development';
}

// Guardar el archivo .env actualizado
try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Entorno configurado como desarrollo.');
  console.log('✅ Ahora se mostrarán todos los logs en la terminal.');
} catch (err) {
  console.error('Error al escribir el archivo .env:', err);
  process.exit(1);
} 