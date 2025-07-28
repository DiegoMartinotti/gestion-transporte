import 'dotenv/config';
import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Opciones de conexión para MongoDB
 */
interface MongooseConnectionOptions {
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  connectTimeoutMS: number;
  maxPoolSize: number;
  minPoolSize: number;
  bufferCommands: boolean;
}

/**
 * Conectar a la base de datos MongoDB
 */
const connectDB = async (): Promise<void> => {
    try {
        // Configurar opciones de conexión optimizadas
        const options: MongooseConnectionOptions = {
            serverSelectionTimeoutMS: 10000,    // Aumentado de 5s a 10s
            socketTimeoutMS: 45000,             // Mantener 45s
            connectTimeoutMS: 15000,            // Timeout específico para conexión inicial
            maxPoolSize: 10,                    // Pool de conexiones
            minPoolSize: 2,                     // Mínimo de conexiones activas
            bufferCommands: false               // No buffer commands si no hay conexión
        };
        
        // Verificar que la URI existe
        const mongoURIBase = process.env.MONGODB_URI;
        if (!mongoURIBase) {
            logger.error('Variable de entorno MONGODB_URI no definida');
            process.exit(1);
        }
        
        // Construir la URI de conexión con variables de entorno
        const mongoURI = mongoURIBase.replace(
            '${DB_PASSWORD}', 
            process.env.DB_PASSWORD || ''
        );

        logger.info('Intentando conectar a MongoDB...');
        logger.debug(`URI de conexión: ${mongoURI.replace(/\/\/.*@/, '//<credentials>@')}`);
        
        await mongoose.connect(mongoURI, options);
        logger.info('MongoDB conectado correctamente');
        
        // Eventos de conexión mejorados
        mongoose.connection.on('error', (err: Error) => {
            logger.error('Error de MongoDB:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB desconectado');
        });
        
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconectado');
        });
        
    } catch (error: any) {
        logger.error('Error de conexión MongoDB:', error);
        logger.error('Stack:', error.stack);
        
        // Mensajes de error más descriptivos
        if (error.name === 'MongoNetworkTimeoutError') {
            logger.error('💡 Posibles soluciones:');
            logger.error('  1. Verificar que tu IP esté en el Access List de MongoDB Atlas');
            logger.error('  2. Revisar conectividad de red/firewall');
            logger.error('  3. Confirmar credenciales de base de datos');
        }
        
        process.exit(1);
    }
};

export { connectDB }; 