import mongoose, { Document, Schema, Model } from 'mongoose';

// Definición de la interfaz para el documento
export interface IFormulasPersonalizadasCliente extends Document {
  clienteId: mongoose.Types.ObjectId;
  tipoUnidad: 'Sider' | 'Bitren' | 'General';
  formula: string;
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Definición del schema de Mongoose con tipos
const formulasPersonalizadasClienteSchema = new Schema({
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
    index: true // Indexar para búsquedas eficientes
  },
  tipoUnidad: {
    type: String,
    required: true,
    enum: ['Sider', 'Bitren', 'General'], // Ajustar según tipos reales si es necesario
    default: 'General', // O el valor más común
    index: true // Indexar si se busca frecuentemente por tipo
  },
  formula: {
    type: String,
    required: true,
    trim: true
  },
  vigenciaDesde: {
    type: Date,
    required: true,
    index: true // Indexar para búsquedas por fecha
  },
  vigenciaHasta: {
    type: Date,
    index: true // Indexar para búsquedas por fecha. Null indica activa indefinidamente.
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice compuesto para búsquedas comunes y validación de solapamientos
formulasPersonalizadasClienteSchema.index({ clienteId: 1, tipoUnidad: 1, vigenciaDesde: 1 });
formulasPersonalizadasClienteSchema.index({ clienteId: 1, tipoUnidad: 1, vigenciaHasta: 1 });

// Creación y exportación del modelo tipado
const FormulasPersonalizadasCliente: Model<IFormulasPersonalizadasCliente> = mongoose.model<IFormulasPersonalizadasCliente>('FormulasPersonalizadasCliente', formulasPersonalizadasClienteSchema);

export default FormulasPersonalizadasCliente; 