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
  },
  formulaPaletSider: {
    type: String,
    default: "Valor * Palets + Peaje", // Fórmula por defecto para cálculo tipo Palet con unidad Sider
    trim: true
  },
  formulaPaletBitren: {
    type: String,
    default: "Valor * Palets + Peaje", // Fórmula por defecto para cálculo tipo Palet con unidad Bitren
    trim: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt
});

module.exports = mongoose.model('Cliente', clienteSchema);
