import 'dotenv/config';
import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Opciones de conexión para MongoDB
 */
interface MongooseConnectionOptions {
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
}

/**
 * Conectar a la base de datos MongoDB
 */
const connectDB = async (): Promise<void> => {
    try {
        // Configurar opciones de conexión
        const options: MongooseConnectionOptions = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
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
        await mongoose.connect(mongoURI, options);
        logger.info('MongoDB conectado correctamente');
        
        mongoose.connection.on('error', (err: Error) => {
            logger.error('Error de MongoDB:', err);
        });
    } catch (error) {
        logger.error('Error de conexión MongoDB:', error);
        process.exit(1);
    }
};

export { connectDB }; 