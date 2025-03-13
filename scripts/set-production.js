/**
 * Script para configurar el entorno de producción
 * 
 * Este script establece la variable de entorno NODE_ENV a 'production'
 * para que solo se muestren los errores en la terminal.
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
  envContent = envContent.replace(nodeEnvRegex, 'NODE_ENV=production');
} else {
  // Agregar NODE_ENV al final
  envContent += '\nNODE_ENV=production';
}

// Guardar el archivo .env actualizado
try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Entorno configurado como producción.');
  console.log('✅ Ahora solo se mostrarán errores en la terminal.');
} catch (err) {
  console.error('Error al escribir el archivo .env:', err);
  process.exit(1);
} 