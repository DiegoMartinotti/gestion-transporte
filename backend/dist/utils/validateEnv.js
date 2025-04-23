"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Valida que las variables de entorno requeridas estén configuradas
 * @returns true si todas las variables requeridas están presentes
 */
const validateEnv = () => {
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'DB_PASSWORD',
        'JWT_SECRET_KEY'
    ];
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
        console.error(`Error: Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`);
        console.error('Por favor, configura estas variables en el archivo .env o en el entorno');
        console.error('Puedes usar .env.example como plantilla');
        process.exit(1);
    }
    console.log('✅ Variables de entorno validadas correctamente');
    return true;
};
exports.default = validateEnv;
//# sourceMappingURL=validateEnv.js.map