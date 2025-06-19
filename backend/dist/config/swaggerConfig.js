import swaggerJsDoc from 'swagger-jsdoc';
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
export default swaggerJsDoc(swaggerOptions);
//# sourceMappingURL=swaggerConfig.js.map