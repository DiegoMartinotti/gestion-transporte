/**
 * Script para verificar el uso del logger en el proyecto
 * Versión compatible con Windows que no depende de PowerShell o grep
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}=== Verificador de uso del logger (Node.js) ====${colors.reset}`);
console.log(`${colors.cyan}Este script verifica que el proyecto utilice correctamente el logger centralizado${colors.reset}`);
console.log();

// Verificar que estamos en la raíz del proyecto
if (!fs.existsSync(path.join(process.cwd(), 'backend'))) {
  console.error(`${colors.red}Error: Este script debe ejecutarse desde la raíz del proyecto${colors.reset}`);
  process.exit(1);
}

/**
 * Busca archivos recursivamente en un directorio
 * @param {string} dir - Directorio a buscar
 * @param {RegExp} filePattern - Patrón para filtrar archivos
 * @param {RegExp} excludePattern - Patrón para excluir directorios/archivos
 * @returns {string[]} - Lista de rutas de archivos
 */
function findFiles(dir, filePattern, excludePattern) {
  let results = [];
  
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Excluir directorios/archivos que coincidan con el patrón de exclusión
    if (excludePattern && excludePattern.test(filePath)) {
      return;
    }
    
    if (stat.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      results = results.concat(findFiles(filePath, filePattern, excludePattern));
    } else {
      // Añadir archivo si coincide con el patrón
      if (filePattern.test(file)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

/**
 * Busca un patrón en el contenido de los archivos
 * @param {string[]} files - Lista de archivos a buscar
 * @param {RegExp} pattern - Patrón a buscar
 * @returns {Object[]} - Lista de coincidencias con información de archivo, línea y contenido
 */
function searchInFiles(files, pattern) {
  const results = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          results.push({
            file: file.replace(/\\/g, '/'), // Normalizar rutas para que sean consistentes
            lineNumber: index + 1,
            content: line.trim()
          });
        }
      });
    } catch (error) {
      console.error(`${colors.red}Error al leer el archivo ${file}: ${error.message}${colors.reset}`);
    }
  });
  
  return results;
}

// Buscar llamadas directas a console.log/warn/error en el backend
console.log(`${colors.blue}Buscando llamadas directas a console.log/warn/error en el backend...${colors.reset}`);

const backendFiles = findFiles('./backend', /\.js$/, /node_modules/);
const consolePattern = /console\.(log|warn|error)/;
const consoleUsage = searchInFiles(backendFiles, consolePattern)
  .filter(match => !match.file.includes('backend/utils/logger.js'));

if (consoleUsage.length > 0) {
  console.log(`${colors.red}Se encontraron ${consoleUsage.length} llamadas directas a console:${colors.reset}`);
  consoleUsage.forEach(match => {
    console.log(`${colors.yellow}${match.file}:${match.lineNumber}: ${match.content}${colors.reset}`);
  });
  console.log();
  console.log(`${colors.yellow}Recomendación: Reemplazar estas llamadas por el logger centralizado${colors.reset}`);
} else {
  console.log(`${colors.green}✓ No se encontraron llamadas directas a console en el backend${colors.reset}`);
}

console.log();

// Verificar el entorno actual
console.log(`${colors.blue}Verificando configuración de entorno...${colors.reset}`);
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
  const nodeEnv = envContent.match(/NODE_ENV=(\w+)/)?.[1] || 'development';
  
  console.log(`${colors.cyan}Entorno actual: ${nodeEnv}${colors.reset}`);
  
  if (nodeEnv === 'production') {
    console.log(`${colors.green}✓ El entorno está configurado como producción, solo se mostrarán errores${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ El entorno está configurado como ${nodeEnv}, se mostrarán todos los logs${colors.reset}`);
    console.log(`${colors.yellow}Para cambiar a producción, ejecute: node scripts/set-production.js${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error al leer el archivo .env: ${error.message}${colors.reset}`);
}

console.log();

// Verificar uso de logger.debug/info en el backend
console.log(`${colors.blue}Verificando uso de logger.debug/info en el backend...${colors.reset}`);

const loggerPattern = /logger\.(debug|info)/;
const debugUsage = searchInFiles(backendFiles, loggerPattern);

if (debugUsage.length > 0) {
  console.log(`${colors.yellow}Se encontraron ${debugUsage.length} llamadas a logger.debug o logger.info:${colors.reset}`);
  console.log(`${colors.yellow}Estas llamadas no se mostrarán en producción${colors.reset}`);
  
  // Mostrar un resumen por archivo
  const fileCount = {};
  debugUsage.forEach(match => {
    const file = match.file;
    fileCount[file] = (fileCount[file] || 0) + 1;
  });
  
  Object.entries(fileCount).forEach(([file, count]) => {
    console.log(`${colors.cyan}${file}: ${count} llamadas${colors.reset}`);
  });
} else {
  console.log(`${colors.green}✓ No se encontraron llamadas a logger.debug o logger.info${colors.reset}`);
}

// Verificar uso de console en el frontend
console.log();
console.log(`${colors.blue}Verificando uso de console en el frontend...${colors.reset}`);

const frontendFiles = findFiles('./frontend/src', /\.(js|jsx)$/, /node_modules/);
const frontendConsoleUsage = searchInFiles(frontendFiles, consolePattern)
  .filter(match => !match.file.includes('frontend/src/utils/logger.js'));

if (frontendConsoleUsage.length > 0) {
  console.log(`${colors.red}Se encontraron ${frontendConsoleUsage.length} llamadas directas a console en el frontend:${colors.reset}`);
  
  // Mostrar un resumen por archivo
  const fileCount = {};
  frontendConsoleUsage.forEach(match => {
    const file = match.file;
    fileCount[file] = (fileCount[file] || 0) + 1;
  });
  
  Object.entries(fileCount).forEach(([file, count]) => {
    console.log(`${colors.cyan}${file}: ${count} llamadas${colors.reset}`);
  });
  
  console.log();
  console.log(`${colors.yellow}Recomendación: Migrar estas llamadas al logger centralizado del frontend${colors.reset}`);
  console.log(`${colors.yellow}Ejecute: node scripts/migrate-frontend-logger-node.js${colors.reset}`);
} else {
  console.log(`${colors.green}✓ No se encontraron llamadas directas a console en el frontend${colors.reset}`);
}

console.log();
console.log(`${colors.cyan}=== Verificación completada ====${colors.reset}`);
console.log(`${colors.cyan}Recuerde que en producción solo se mostrarán los errores (logger.error y logger.critical)${colors.reset}`); 