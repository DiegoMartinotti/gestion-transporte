import { Schema, model } from 'mongoose';
// Schema de Mongoose para el Cliente
const clienteSchema = new Schema({
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
export default model('Cliente', clienteSchema);
//# sourceMappingURL=Cliente.js.map