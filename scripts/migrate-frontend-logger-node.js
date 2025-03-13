/**
 * Script para migrar el código del frontend al nuevo sistema de logger
 * Versión compatible con Windows que no depende de PowerShell o grep
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

console.log(`${colors.cyan}=== Migración de logger en el frontend (Node.js) ====${colors.reset}`);
console.log(`${colors.cyan}Este script ayuda a migrar el código del frontend al nuevo sistema de logger${colors.reset}`);
console.log();

// Verificar que estamos en la raíz del proyecto
if (!fs.existsSync(path.join(process.cwd(), 'frontend'))) {
  console.error(`${colors.red}Error: Este script debe ejecutarse desde la raíz del proyecto${colors.reset}`);
  process.exit(1);
}

// Verificar que existe el archivo de logger
const loggerPath = path.join(process.cwd(), 'frontend', 'src', 'utils', 'logger.js');
if (!fs.existsSync(loggerPath)) {
  console.error(`${colors.red}Error: No se encontró el archivo de logger en ${loggerPath}${colors.reset}`);
  console.error(`${colors.red}Primero debe crear el archivo de logger${colors.reset}`);
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

// Buscar archivos que usan console.log/warn/error en el frontend
console.log(`${colors.blue}Buscando archivos que usan console.log/warn/error en el frontend...${colors.reset}`);

const frontendFiles = findFiles('./frontend/src', /\.(js|jsx)$/, /node_modules/);
const consolePattern = /console\.(log|warn|error)/;
const consoleUsage = searchInFiles(frontendFiles, consolePattern)
  .filter(match => !match.file.includes('frontend/src/utils/logger.js'));

if (consoleUsage.length === 0) {
  console.log(`${colors.green}✓ No se encontraron llamadas directas a console en el frontend${colors.reset}`);
  process.exit(0);
}

console.log(`${colors.yellow}Se encontraron ${consoleUsage.length} llamadas directas a console:${colors.reset}`);

// Agrupar por archivo
const fileMap = {};
consoleUsage.forEach(match => {
  const file = match.file;
  if (!fileMap[file]) {
    fileMap[file] = [];
  }
  fileMap[file].push({
    lineNumber: match.lineNumber,
    content: match.content
  });
});

// Mostrar resumen por archivo
console.log(`${colors.blue}Resumen por archivo:${colors.reset}`);
Object.entries(fileMap).forEach(([file, matches]) => {
  console.log(`${colors.cyan}${file}: ${matches.length} llamadas${colors.reset}`);
});

console.log();
console.log(`${colors.blue}Instrucciones para migrar:${colors.reset}`);
console.log(`${colors.yellow}1. Importar el logger en cada archivo:${colors.reset}`);
console.log(`${colors.green}   import logger from '../utils/logger';${colors.reset}`);
console.log(`${colors.yellow}2. Reemplazar las llamadas a console por logger:${colors.reset}`);
console.log(`${colors.green}   console.log(...) -> logger.info(...) o logger.debug(...)${colors.reset}`);
console.log(`${colors.green}   console.warn(...) -> logger.warn(...)${colors.reset}`);
console.log(`${colors.green}   console.error(...) -> logger.error(...)${colors.reset}`);

console.log();
console.log(`${colors.blue}¿Desea generar un archivo de migración automática? (s/n)${colors.reset}`);

// Crear interfaz para leer la entrada del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(`${colors.yellow}> ${colors.reset}`, (answer) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || 
      answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log(`${colors.blue}Generando archivo de migración...${colors.reset}`);
    
    // Crear archivo de migración
    const migrationPath = path.join(process.cwd(), 'scripts', 'frontend-logger-migration.md');
    let migrationContent = '# Migración del logger en el frontend\n\n';
    migrationContent += 'Este archivo contiene instrucciones para migrar cada archivo que utiliza console.log/warn/error al nuevo sistema de logger.\n\n';
    
    Object.entries(fileMap).forEach(([file, matches]) => {
      migrationContent += `## ${file}\n\n`;
      migrationContent += '```javascript\n';
      migrationContent += '// Añadir al principio del archivo\n';
      migrationContent += 'import logger from \'';
      
      // Calcular la ruta relativa al logger
      const relativePath = path.relative(path.dirname(file), path.join('frontend', 'src', 'utils')).replace(/\\/g, '/');
      migrationContent += relativePath ? `${relativePath}/logger` : './utils/logger';
      migrationContent += '\';\n\n';
      
      // Añadir reemplazos sugeridos
      migrationContent += '// Reemplazar las siguientes líneas:\n\n';
      matches.forEach(match => {
        migrationContent += `// Línea ${match.lineNumber}: ${match.content}\n`;
        
        // Sugerir reemplazo
        let replacement = match.content;
        if (replacement.includes('console.log')) {
          replacement = replacement.replace('console.log', 'logger.debug');
        } else if (replacement.includes('console.warn')) {
          replacement = replacement.replace('console.warn', 'logger.warn');
        } else if (replacement.includes('console.error')) {
          replacement = replacement.replace('console.error', 'logger.error');
        }
        
        migrationContent += `${replacement}\n\n`;
      });
      
      migrationContent += '```\n\n';
    });
    
    fs.writeFileSync(migrationPath, migrationContent);
    console.log(`${colors.green}✓ Archivo de migración generado en ${migrationPath}${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Migración cancelada${colors.reset}`);
  }
  
  rl.close();
}); 