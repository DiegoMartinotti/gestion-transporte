import mongoose, { Document, Schema, model } from 'mongoose';

// Interfaz que define la estructura del documento Cliente
export interface ICliente extends Document {
  nombre: string;
  cuit: string;
  createdAt: Date;
  updatedAt: Date;
}

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
export default model<ICliente>('Cliente', clienteSchema); 