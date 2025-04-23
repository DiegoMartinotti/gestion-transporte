"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Schema de Mongoose para el Cliente
const clienteSchema = new mongoose_1.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true, // Para asegurar que no haya duplicados
        trim: true
    },
    cuit: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true // Agrega createdAt y updatedAt
});
// Exportar el modelo con tipado
exports.default = (0, mongoose_1.model)('Cliente', clienteSchema);
//# sourceMappingURL=Cliente.js.map