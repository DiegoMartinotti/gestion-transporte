const mongoose = require('mongoose');

const viajeSchema = new mongoose.Schema({
  cliente: { type: String, required: true },
  fecha: { type: Date, required: true },
  origen: { type: String, required: true },
  destino: { type: String, required: true },
  tarifa: { type: Number, required: true },
  dt: { type: String, required: true }, // <-- Nuevo campo agregado
  extras: {
    demoras: { type: Number, default: 0 },
    operativos: { type: Number, default: 0 },
    estadias: { type: Number, default: 0 },
  },
  cobrado: { type: Boolean, default: false },
  paletas: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  estado: {
    type: String,
    enum: ['Pendiente', 'En Curso', 'Completado', 'Cancelado'],
    default: 'Pendiente'
  },
  observaciones: String
}, {
  timestamps: true
});

// Hook para calcular el total antes de guardar en la base de datos
viajeSchema.pre('save', function (next) {
  this.total = this.tarifa + this.extras.demoras + this.extras.operativos + this.extras.estadias;
  next();
});

// Validación: La `dt` debe ser única por cliente
viajeSchema.index({ dt: 1, cliente: 1 }, { unique: true });

const Viaje = mongoose.model('Viaje', viajeSchema);
module.exports = Viaje;
