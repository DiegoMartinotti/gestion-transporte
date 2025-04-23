"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Liquidaciones',
            version: '1.0.0',
            description: 'Documentación de la API de Liquidaciones',
        },
        servers: [
            {
                url: process.env.SERVER_URL || 'http://localhost:3001',
                description: 'Servidor de desarrollo',
            },
        ],
    },
    apis: ['./routes/*.js', './routes/*.ts'], // archivos que contienen anotaciones, añadimos soporte para .ts
};
exports.default = (0, swagger_jsdoc_1.default)(swaggerOptions);
//# sourceMappingURL=swaggerConfig.js.map