const mongoose = require('mongoose');

const formulasPersonalizadasClienteSchema = new mongoose.Schema({
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
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


module.exports = mongoose.model('FormulasPersonalizadasCliente', formulasPersonalizadasClienteSchema); 