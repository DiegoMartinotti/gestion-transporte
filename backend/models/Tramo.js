const mongoose = require('mongoose');
const Site = require('./Site');

// Función para calcular distancia entre dos puntos geográficos
function calcularDistancia(coordenadas1, coordenadas2) {
  // Radio de la Tierra en kilómetros
  const R = 6371;
  
  // Convertir latitud/longitud de grados a radianes
  const lat1 = (coordenadas1[1] * Math.PI) / 180;
  const lon1 = (coordenadas1[0] * Math.PI) / 180;
  const lat2 = (coordenadas2[1] * Math.PI) / 180;
  const lon2 = (coordenadas2[0] * Math.PI) / 180;
  
  // Fórmula haversine
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;
  
  // Redondear a 2 decimales
  return Math.round(distancia * 100) / 100;
}

// Actualización del enum en metodoCalculo para que coincida con el frontend
const tramoSchema = new mongoose.Schema({
  origen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'El origen del tramo es obligatorio']
  },
  destino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'El destino del tramo es obligatorio']
  },
  tipo: {
    type: String,
    enum: ['TRMC', 'TMRI'],
    default: 'TRMC'
  },
  cliente: {
    type: String,
    required: [true, 'El cliente es obligatorio']
  },
  distancia: {
    type: Number,
    default: 0
  },
  vigenciaDesde: {
    type: Date,
    required: [true, 'La fecha de inicio de vigencia es obligatoria']
  },
  vigenciaHasta: {
    type: Date,
    required: [true, 'La fecha de fin de vigencia es obligatoria']
  },
  metodoCalculo: {
    type: String,
    enum: ['Palet', 'Kilometro', 'Fijo'],
    required: [true, 'El método de cálculo es obligatorio']
  },
  valorPeaje: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Crear índice compuesto para garantizar la unicidad según los requisitos
tramoSchema.index(
  { 
    origen: 1, 
    destino: 1, 
    cliente: 1, 
    vigenciaDesde: 1, 
    vigenciaHasta: 1, 
    metodoCalculo: 1 
  }, 
  { unique: true }
);

// Middleware para calcular la distancia automáticamente antes de guardar
tramoSchema.pre('save', async function(next) {
  try {
    // Si origen o destino son nuevos o han cambiado, recalcular distancia
    if (this.isNew || this.isModified('origen') || this.isModified('destino')) {
      const origenDoc = await Site.findById(this.origen);
      const destinoDoc = await Site.findById(this.destino);
      
      if (origenDoc && destinoDoc && 
          origenDoc.location && origenDoc.location.coordinates &&
          destinoDoc.location && destinoDoc.location.coordinates) {
        
        this.distancia = calcularDistancia(
          origenDoc.location.coordinates,
          destinoDoc.location.coordinates
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Validación para asegurar que origen y destino sean diferentes
tramoSchema.path('destino').validate(function(value) {
  return String(value) !== String(this.origen);
}, 'El origen y el destino no pueden ser el mismo Site');

// Validación para verificar que vigenciaHasta sea posterior a vigenciaDesde
tramoSchema.path('vigenciaHasta').validate(function(value) {
  return this.vigenciaDesde <= value;
}, 'La fecha de fin de vigencia debe ser posterior a la fecha de inicio');

const Tramo = mongoose.model('Tramo', tramoSchema);

module.exports = Tramo;
