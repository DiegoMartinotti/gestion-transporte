/**
 * Script para configurar el archivo .env a partir de .env.example
 * Uso: node scripts/setup-env.js
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Rutas de los archivos
const exampleEnvPath = path.join(__dirname, '..', '..', '.env.example');
const envPath = path.join(__dirname, '..', '..', '.env');

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Comprobar si .env ya existe
if (fs.existsSync(envPath)) {
  console.log('⚠️ El archivo .env ya existe.');
  rl.question('¿Desea sobrescribirlo? (s/N): ', (answer) => {
    if (answer.toLowerCase() === 's') {
      createEnvFile();
    } else {
      console.log('❌ Operación cancelada. El archivo .env no ha sido modificado.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

/**
 * Crea el archivo .env a partir de .env.example
 * Si .env.example no existe, crea un .env con valores por defecto
 */
function createEnvFile() {
  try {
    if (fs.existsSync(exampleEnvPath)) {
      // Leer el contenido de .env.example
      const exampleEnv = fs.readFileSync(exampleEnvPath, 'utf8');
      
      // Preguntar si se quiere personalizar los valores
      rl.question('¿Desea personalizar los valores? (s/N): ', (answer) => {
        if (answer.toLowerCase() === 's') {
          // Procesar cada línea para solicitar valores al usuario
          const lines = exampleEnv.split('\n');
          processLines(lines, 0, {});
        } else {
          // Copiar directamente el archivo .env.example a .env
          fs.writeFileSync(envPath, exampleEnv);
          console.log('✅ Archivo .env creado con valores de ejemplo.');
          console.log('⚠️ Recuerde editar los valores sensibles antes de usar en producción.');
          rl.close();
        }
      });
    } else {
      console.log('⚠️ No se encontró el archivo .env.example');
      // Crear un .env básico con valores predeterminados
      const defaultEnv = 
`# Configuración de entorno para la aplicación
# Generado automáticamente

NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/mi-proyecto
JWT_SECRET=cambiar_por_secreto_seguro_en_produccion
`;
      fs.writeFileSync(envPath, defaultEnv);
      console.log('✅ Archivo .env creado con valores por defecto.');
      console.log('⚠️ Recuerde editar los valores sensibles antes de usar en producción.');
      rl.close();
    }
  } catch (error) {
    console.error('❌ Error al crear el archivo .env:', error.message);
    rl.close();
  }
}

/**
 * Procesa cada línea del archivo .env.example
 * y solicita al usuario valores para cada variable
 */
function processLines(lines, index, values) {
  if (index >= lines.length) {
    // Todas las líneas han sido procesadas, crear el archivo .env
    const envContent = lines.map(line => {
      // Si la línea tiene un valor personalizado, reemplazarlo
      if (line.includes('=') && !line.startsWith('#')) {
        const key = line.split('=')[0].trim();
        if (values[key]) {
          return `${key}=${values[key]}`;
        }
      }
      return line;
    }).join('\n');
    
    // Guardar el archivo
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado con valores personalizados.');
    rl.close();
    return;
  }

  const line = lines[index];
  
  // Omitir líneas de comentarios o vacías
  if (line.startsWith('#') || line.trim() === '') {
    processLines(lines, index + 1, values);
    return;
  }
  
  // Si la línea tiene un formato válido (clave=valor), preguntar al usuario
  if (line.includes('=')) {
    const [key, defaultValue] = line.split('=').map(part => part.trim());
    const defaultDisplay = defaultValue ? ` (por defecto: ${defaultValue})` : '';
    
    rl.question(`Introduce el valor para ${key}${defaultDisplay}: `, (value) => {
      if (value.trim() !== '') {
        values[key] = value;
      }
      processLines(lines, index + 1, values);
    });
  } else {
    // Línea con formato incorrecto, seguir al siguiente
    processLines(lines, index + 1, values);
  }
} 