const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Generar una clave secreta aleatoria para JWT
const generateJwtSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const setupEnv = async () => {
  console.log('Configurando variables de entorno para la aplicación...');
  
  // Verificar si ya existe un archivo .env
  if (fs.existsSync(envPath)) {
    const answer = await new Promise(resolve => {
      rl.question('Ya existe un archivo .env. ¿Desea sobrescribirlo? (s/n): ', resolve);
    });
    
    if (answer.toLowerCase() !== 's') {
      console.log('Configuración cancelada.');
      rl.close();
      return;
    }
  }
  
  // Leer el archivo .env.example como plantilla
  let envExample = '';
  try {
    envExample = fs.readFileSync(envExamplePath, 'utf8');
  } catch (error) {
    console.error('No se pudo leer el archivo .env.example:', error.message);
    rl.close();
    return;
  }
  
  // Solicitar información al usuario
  const dbUser = await new Promise(resolve => {
    rl.question('Usuario de MongoDB: ', resolve);
  });
  
  const dbPassword = await new Promise(resolve => {
    rl.question('Contraseña de MongoDB: ', resolve);
  });
  
  const dbHost = await new Promise(resolve => {
    rl.question('Host de MongoDB (por defecto: cluster0.ahw8j.mongodb.net): ', (answer) => {
      resolve(answer || 'cluster0.ahw8j.mongodb.net');
    });
  });
  
  const jwtSecret = await new Promise(resolve => {
    rl.question(`Clave secreta JWT (dejar en blanco para generar una): `, (answer) => {
      resolve(answer || generateJwtSecret());
    });
  });
  
  // Crear contenido del archivo .env
  const envContent = `MONGODB_URI=mongodb+srv://${dbUser}:\${DB_PASSWORD}@${dbHost}/?retryWrites=true&w=majority
JWT_SECRET=\${JWT_SECRET_KEY}
PORT=3001
SERVER_URL=http://localhost:3001
NODE_ENV=production
DB_PASSWORD=${dbPassword}
JWT_SECRET_KEY=${jwtSecret}`;
  
  // Escribir el archivo .env
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado correctamente!');
    console.log('Las credenciales de la base de datos están ahora protegidas.');
  } catch (error) {
    console.error('Error al escribir el archivo .env:', error.message);
  }
  
  rl.close();
};

setupEnv(); 