"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Conectar a la base de datos MongoDB
 */
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Configurar opciones de conexión
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        // Verificar que la URI existe
        const mongoURIBase = process.env.MONGODB_URI;
        if (!mongoURIBase) {
            logger_1.default.error('Variable de entorno MONGODB_URI no definida');
            process.exit(1);
        }
        // Construir la URI de conexión con variables de entorno
        const mongoURI = mongoURIBase.replace('${DB_PASSWORD}', process.env.DB_PASSWORD || '');
        logger_1.default.info('Intentando conectar a MongoDB...');
        yield mongoose_1.default.connect(mongoURI, options);
        logger_1.default.info('MongoDB conectado correctamente');
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('Error de MongoDB:', err);
        });
    }
    catch (error) {
        logger_1.default.error('Error de conexión MongoDB:', error);
        process.exit(1);
    }
});
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map