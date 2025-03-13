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

console.log(`${colors.cyan}=== Verificador de uso del logger ====${colors.reset}`);
console.log(`${colors.cyan}Este script verifica que el backend utilice correctamente el logger centralizado${colors.reset}`);
console.log();

// Verificar que estamos en la raíz del proyecto
if (!fs.existsSync(path.join(process.cwd(), 'backend'))) {
  console.error(`${colors.red}Error: Este script debe ejecutarse desde la raíz del proyecto${colors.reset}`);
  process.exit(1);
}

// Función para buscar patrones en archivos (compatible con Windows)
function findInFiles(pattern, directory, filePattern, excludePattern) {
  try {
    let command;
    if (process.platform === 'win32') {
      // Comando para Windows usando PowerShell
      command = `powershell -Command "Get-ChildItem -Path '${directory}' -Recurse -File -Filter '${filePattern}' | Where-Object { $_.FullName -notmatch '${excludePattern}' } | Select-String -Pattern '${pattern}' | ForEach-Object { $_.Path + ':' + $_.LineNumber + ':' + $_.Line }"`;
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

// Buscar llamadas directas a console.log/warn/error en el backend
console.log(`${colors.blue}Buscando llamadas directas a console.log/warn/error en el backend...${colors.reset}`);
try {
  const consoleUsage = findInFiles('console\\.', './backend', '*.js', 'node_modules')
    .filter(line => !line.includes('backend/utils/logger.js'));

  if (consoleUsage.length > 0) {
    console.log(`${colors.red}Se encontraron ${consoleUsage.length} llamadas directas a console:${colors.reset}`);
    consoleUsage.forEach(line => {
      console.log(`${colors.yellow}${line}${colors.reset}`);
    });
    console.log();
    console.log(`${colors.yellow}Recomendación: Reemplazar estas llamadas por el logger centralizado${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ No se encontraron llamadas directas a console en el backend${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error al buscar llamadas a console: ${error.message}${colors.reset}`);
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
try {
  const debugUsage = findInFiles('logger\\.(debug|info)', './backend', '*.js', 'node_modules');

  if (debugUsage.length > 0) {
    console.log(`${colors.yellow}Se encontraron ${debugUsage.length} llamadas a logger.debug o logger.info:${colors.reset}`);
    console.log(`${colors.yellow}Estas llamadas no se mostrarán en producción${colors.reset}`);
    
    // Mostrar un resumen por archivo
    const fileCount = {};
    debugUsage.forEach(line => {
      const file = line.split(':')[0];
      fileCount[file] = (fileCount[file] || 0) + 1;
    });
    
    Object.entries(fileCount).forEach(([file, count]) => {
      console.log(`${colors.cyan}${file}: ${count} llamadas${colors.reset}`);
    });
  } else {
    console.log(`${colors.green}✓ No se encontraron llamadas a logger.debug o logger.info${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error al buscar llamadas a logger.debug/info: ${error.message}${colors.reset}`);
}

console.log();
console.log(`${colors.cyan}=== Verificación completada ====${colors.reset}`);
console.log(`${colors.cyan}Recuerde que en producción solo se mostrarán los errores (logger.error y logger.critical)${colors.reset}`); 