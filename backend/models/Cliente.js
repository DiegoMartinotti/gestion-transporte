const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  Cliente: {
    type: String,
    required: true,
    unique: true, // Para asegurar que no haya duplicados
    trim: true
  },
  CUIT: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt
});

module.exports = mongoose.model('Cliente', clienteSchema);
