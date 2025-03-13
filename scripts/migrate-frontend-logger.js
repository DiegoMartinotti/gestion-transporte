const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log(`${colors.cyan}=== Migración de logger en el frontend ====${colors.reset}`);
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

// Función para buscar patrones en archivos (compatible con Windows)
function findInFiles(pattern, directory, filePattern, excludePattern) {
  try {
    let command;
    if (process.platform === 'win32') {
      // Comando para Windows usando PowerShell
      command = `powershell -Command "Get-ChildItem -Path '${directory}' -Recurse -File -Include '${filePattern}' | Where-Object { $_.FullName -notmatch '${excludePattern}' } | Select-String -Pattern '${pattern}' | ForEach-Object { $_.Path + ':' + $_.LineNumber + ':' + $_.Line }"`;
    } else {
      // Comando para Unix/Linux usando grep
      command = `grep -r "${pattern}" --include="${filePattern}" --exclude-dir="${excludePattern}" ${directory}`;
    }
    
    return execSync(command, { encoding: 'utf8' })
      .toString()
      .split('\n')
      .filter(line => line.trim());
  } catch (error) {
    // Si el comando no encuentra nada, devuelve un array vacío
    if (error.status === 1) {
      return [];
    }
    throw error;
  }
}

// Buscar archivos que usan console.log/warn/error en el frontend
console.log(`${colors.blue}Buscando archivos que usan console.log/warn/error en el frontend...${colors.reset}`);
try {
  const consoleUsage = findInFiles('console\\.', './frontend/src', '*.js,*.jsx', 'node_modules')
    .filter(line => !line.includes('frontend/src/utils/logger.js'));

  if (consoleUsage.length === 0) {
    console.log(`${colors.green}✓ No se encontraron llamadas directas a console en el frontend${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.yellow}Se encontraron ${consoleUsage.length} llamadas directas a console:${colors.reset}`);
  
  // Agrupar por archivo
  const fileMap = {};
  consoleUsage.forEach(line => {
    const [filePath, ...rest] = line.split(':');
    if (!fileMap[filePath]) {
      fileMap[filePath] = [];
    }
    fileMap[filePath].push(rest.join(':'));
  });

  // Mostrar resumen por archivo
  console.log(`${colors.blue}Resumen por archivo:${colors.reset}`);
  Object.entries(fileMap).forEach(([file, lines]) => {
    console.log(`${colors.cyan}${file}: ${lines.length} llamadas${colors.reset}`);
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
  process.stdout.write(`${colors.yellow}> ${colors.reset}`);
  
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    
    if (answer === 's' || answer === 'si' || answer === 'y' || answer === 'yes') {
      console.log(`${colors.blue}Generando archivo de migración...${colors.reset}`);
      
      // Crear archivo de migración
      const migrationPath = path.join(process.cwd(), 'scripts', 'frontend-logger-migration.md');
      let migrationContent = '# Migración del logger en el frontend\n\n';
      migrationContent += 'Este archivo contiene instrucciones para migrar cada archivo que utiliza console.log/warn/error al nuevo sistema de logger.\n\n';
      
      Object.entries(fileMap).forEach(([file, lines]) => {
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
        lines.forEach(line => {
          migrationContent += `// ${line.trim()}\n`;
          
          // Sugerir reemplazo
          let replacement = line.trim();
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
    
    process.exit(0);
  });
} catch (error) {
  console.error(`${colors.red}Error al buscar llamadas a console: ${error.message}${colors.reset}`);
  process.exit(error.status || 1);
} 