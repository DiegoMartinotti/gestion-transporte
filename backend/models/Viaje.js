const mongoose = require('mongoose');
const Tramo = require('./Tramo');
const Cliente = require('./Cliente');
const { calcularTarifaPaletConFormula } = require('../utils/formulaParser');

const viajeSchema = new mongoose.Schema({
  cliente: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  fecha: { type: Date, required: true },
  origen: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  destino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  tipoTramo: { 
    type: String, 
    enum: ['TRMC', 'TRMI'], 
    default: 'TRMC',
    required: true
  },
  tipoUnidad: { 
    type: String, 
    enum: ['Sider', 'Bitren'], 
    default: 'Sider',
    required: true
  },
  paletas: { type: Number, default: 0 },
  tarifa: { type: Number, required: true },
  dt: { type: String, required: true },
  extras: {
    demoras: { type: Number, default: 0 },
    operativos: { type: Number, default: 0 },
    estadias: { type: Number, default: 0 },
  },
  cobrado: { type: Boolean, default: false },
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

// Hook para calcular la tarifa automáticamente si es un nuevo documento (no está establecida)
viajeSchema.pre('save', async function (next) {
  try {
    // Si es un documento nuevo o la tarifa no está establecida
    if (this.isNew || this.isModified('origen') || this.isModified('destino') || 
        this.isModified('tipoTramo') || this.isModified('tipoUnidad') || this.isModified('paletas')) {
      
      // Cargamos el documento cliente completo
      const clienteDoc = await Cliente.findById(this.cliente);
      
      if (!clienteDoc) {
        throw new Error('Cliente no encontrado');
      }
      
      // Buscar el tramo correspondiente
      const tramo = await Tramo.findOne({
        cliente: clienteDoc.Cliente, // Usamos el nombre del cliente
        origen: this.origen,
        destino: this.destino,
        tipo: this.tipoTramo,
        vigenciaDesde: { $lte: this.fecha },
        vigenciaHasta: { $gte: this.fecha }
      }).populate('origen destino');
      
      if (!tramo) {
        // Si no encontramos un tramo válido, pasamos al siguiente middleware
        // La tarifa se mantendrá como la indicó el usuario
        console.warn(`No se encontró un tramo válido para el viaje de ${clienteDoc.Cliente} desde ${this.origen} hasta ${this.destino}`);
        return next();
      }
      
      // Calcular tarifa según el método de cálculo del tramo
      let tarifaBase = 0;
      let peaje = Number(tramo.valorPeaje) || 0;
      const numPalets = Number(this.paletas) || 0;
      
      switch (tramo.metodoCalculo) {
        case 'Palet':
          // Verificar si el cliente tiene una fórmula personalizada para el tipo de unidad
          const formulaKey = this.tipoUnidad === 'Bitren' ? 'formulaPaletBitren' : 'formulaPaletSider';
          const formulaPersonalizada = clienteDoc[formulaKey];
          
          if (formulaPersonalizada) {
            console.log(`Usando fórmula personalizada para ${clienteDoc.Cliente} (${this.tipoUnidad}): ${formulaPersonalizada}`);
            const resultado = calcularTarifaPaletConFormula(tramo.valor, peaje, numPalets, formulaPersonalizada);
            tarifaBase = resultado.tarifaBase;
          } else {
            // Cálculo por defecto
            tarifaBase = tramo.valor * numPalets;
          }
          break;
          
        case 'Kilometro':
          tarifaBase = tramo.valor * tramo.distancia;
          break;
          
        case 'Fijo':
          tarifaBase = tramo.valor;
          break;
          
        default:
          tarifaBase = 0;
      }
      
      // Asignar la tarifa calculada
      this.tarifa = Math.round(tarifaBase * 100) / 100;
    }
    
    // Calcular el total (tarifa + extras)
    this.total = this.tarifa + this.extras.demoras + this.extras.operativos + this.extras.estadias;
    
    next();
  } catch (error) {
    console.error('Error calculando tarifa automática:', error);
    next(error);
  }
});

// Validación: La `dt` debe ser única por cliente
viajeSchema.index({ dt: 1, cliente: 1 }, { unique: true });

const Viaje = mongoose.model('Viaje', viajeSchema);
module.exports = Viaje;
