const mongoose = require('mongoose');
const Tramo = require('./Tramo');
const Cliente = require('./Cliente');
const Extra = require('./Extra');
const { calcularTarifaPaletConFormula } = require('../utils/formulaParser');
const { actualizarEstadoPartida } = require('../utils/estadoPartida');
const logger = require('../utils/logger');
const Personal = require('./Personal');
const Vehiculo = require('./Vehiculo');

/**
 * @typedef {Object} Viaje
 * @description Modelo que representa un viaje en el sistema.
 * 
 * El viaje tiene un total calculado en base a su tarifa y extras.
 * Este total se compara con la suma de los importes asignados en las OCs
 * para determinar su estado de partida (Abierta/Cerrada).
 * 
 * El estado de partida se actualiza automáticamente cuando:
 * 1. Cambia el total del viaje (por modificación de tarifa o extras)
 * 2. Se modifica una OC que incluye este viaje
 */

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
  /**
   * Chofer asignado al viaje, debe ser un Personal activo
   */
  chofer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personal',
    required: true,
    validate: {
      validator: async function(value) {
        const personal = await Personal.findById(value).lean();
        return personal && personal.activo === true;
      },
      message: 'El chofer debe ser un personal activo'
    }
  },
  /**
   * Configuración de vehículos para el viaje
   * Al menos debe tener un vehículo (el principal)
   */
  vehiculos: [{
    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehiculo',
      required: true
    },
    posicion: {
      type: Number,
      default: 1,
      min: 1
    },
    observaciones: String
  }],
  /**
   * El tipo de unidad ahora se obtiene del vehículo principal
   * Se mantiene por compatibilidad con código existente
   */
  tipoUnidad: { 
    type: String, 
    enum: ['Sider', 'Bitren'], 
    default: 'Sider',
    required: true
  },
  paletas: { type: Number, default: 0 },
  /**
   * Tarifa base del viaje, calculada según el tramo y método de cálculo
   */
  tarifa: { 
    type: Number, 
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'La tarifa debe ser mayor o igual a 0'
    }
  },
  peaje: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'El peaje debe ser mayor o igual a 0'
    }
  },
  dt: { type: String, required: true },
  /**
   * Extras aplicados al viaje, cada uno con su cantidad
   */
  extras: [{
    extra: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Extra',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    }
  }],
  /**
   * Referencias a las OCs que incluyen este viaje
   */
  cobros: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdenCompra',
    required: true
  }],
  /**
   * Total del viaje = tarifa base + suma de extras
   */
  total: { type: Number, default: 0 },
  estado: {
    type: String,
    enum: ['Pendiente', 'En Curso', 'Completado', 'Cancelado'],
    default: 'Pendiente'
  },
  /**
   * Estado de la partida:
   * - Abierta: El total cobrado es menor al total del viaje
   * - Cerrada: El total cobrado es mayor o igual al total del viaje
   */
  estadoPartida: {
    type: String,
    enum: ['Abierta', 'Cerrada'],
    default: 'Abierta'
  },
  observaciones: String
}, {
  timestamps: true
});

/**
 * Validación para asegurar que al menos hay un vehículo en la configuración
 * y que las posiciones son únicas
 */
viajeSchema.path('vehiculos').validate(function(vehiculos) {
  if (!vehiculos || vehiculos.length === 0) {
    return false;
  }
  
  // Verificar que no hay posiciones duplicadas
  const posiciones = vehiculos.map(v => v.posicion);
  return posiciones.length === new Set(posiciones).size;
}, 'Debe asignarse al menos un vehículo al viaje y las posiciones deben ser únicas');

/**
 * Middleware que se ejecuta antes de guardar un viaje
 * Calcula la tarifa y el total del viaje según:
 * 1. Tramo y método de cálculo correspondiente
 * 2. Fórmulas personalizadas del cliente si existen
 * 3. Extras aplicados
 * 
 * También actualiza el tipoUnidad basado en el vehículo principal
 */
viajeSchema.pre('save', async function (next) {
  try {
    // Verificar y actualizar el tipo de unidad basado en el vehículo principal
    if (this.isNew || this.isModified('vehiculos')) {
      if (this.vehiculos && this.vehiculos.length > 0) {
        // Optimización: Usar lean() para mejorar rendimiento
        const vehiculoPrincipal = await Vehiculo.findById(this.vehiculos[0].vehiculo).lean();
        
        if (!vehiculoPrincipal) {
          throw new Error('Vehículo principal no encontrado');
        }
        
        // Simplificar la asignación del tipo de unidad
        this.tipoUnidad = vehiculoPrincipal.tipo === 'Bitren' ? 'Bitren' : 'Sider';
      }
    }
    
    // Si es un documento nuevo o se modificaron campos relevantes
    if (this.isNew || this.isModified('origen') || this.isModified('destino') || 
        this.isModified('tipoTramo') || this.isModified('tipoUnidad') || this.isModified('paletas')) {
      
      // Cargamos el documento cliente completo
      const clienteDoc = await Cliente.findById(this.cliente);
      
      if (!clienteDoc) {
        throw new Error('Cliente no encontrado');
      }
      
      // Buscar el tramo correspondiente usando el ObjectId del cliente
      const tramo = await Tramo.findOne({
        cliente: clienteDoc._id, // Cambiado para usar el ObjectId
        origen: this.origen,
        destino: this.destino
      }).populate('tarifasHistoricas'); // Poblar las tarifas para acceder a sus datos
      
      if (!tramo) {
        // Intentar poblar nombres para un mensaje de error más claro
        await this.populate('origen destino');
        const origenNombre = this.origen ? this.origen.Site : 'ID desconocido';
        const destinoNombre = this.destino ? this.destino.Site : 'ID desconocido';
        throw new Error(`No se encontró un tramo válido para el cliente ${clienteDoc.Cliente} (${clienteDoc._id}) desde ${origenNombre} hasta ${destinoNombre} para la fecha ${this.fecha.toISOString().split('T')[0]}`);
      }

      // Encontrar la tarifa vigente para el tipo de tramo y fecha
      const tarifaVigente = tramo.getTarifaVigente(this.fecha, this.tipoTramo);

      if (!tarifaVigente) {
        await this.populate('origen destino');
        const origenNombre = this.origen ? this.origen.Site : 'ID desconocido';
        const destinoNombre = this.destino ? this.destino.Site : 'ID desconocido';
        throw new Error(`No se encontró una tarifa ${this.tipoTramo} vigente para el tramo ${origenNombre} → ${destinoNombre} (Cliente: ${clienteDoc.Cliente}) en la fecha ${this.fecha.toISOString().split('T')[0]}`);
      }
      
      // Asignar el peaje de la tarifa vigente
      this.peaje = Number(tarifaVigente.valorPeaje) || 0;
      
      // Calcular tarifa base según el método de cálculo de la tarifa vigente
      let tarifaBase = 0;
      const numPalets = Number(this.paletas) || 0;
      
      switch (tarifaVigente.metodoCalculo) {
        case 'Palet':
          // Verificar si el cliente tiene una fórmula personalizada para el tipo de unidad
          const formulaKey = this.tipoUnidad === 'Bitren' ? 'formulaPaletBitren' : 'formulaPaletSider';
          const formulaPersonalizada = clienteDoc[formulaKey];
          
          if (formulaPersonalizada) {
            logger.info(`Usando fórmula personalizada para ${clienteDoc.Cliente} (${this.tipoUnidad}): ${formulaPersonalizada}`);
            const resultado = calcularTarifaPaletConFormula(tramo.valor, this.peaje, numPalets, formulaPersonalizada);
            tarifaBase = resultado.tarifaBase;
          } else {
            // Cálculo por defecto
            tarifaBase = tarifaVigente.valor * numPalets;
          }
          break;
          
        case 'Kilometro':
          // Asegurarse que la distancia está cargada en el tramo
          if (!tramo.distancia || tramo.distancia <= 0) {
             logger.warn(`[TARIFA] El tramo ${tramo._id} no tiene distancia calculada para tarifa por Km.`);
             // Opcional: Lanzar error o usar valor por defecto
             // throw new Error(`El tramo ${tramo._id} no tiene distancia calculada.`);
             tarifaBase = 0; // O algún valor por defecto o manejo específico
          } else {
            tarifaBase = tarifaVigente.valor * tramo.distancia;
          }
          break;
          
        case 'Fijo':
          tarifaBase = tarifaVigente.valor;
          break;
          
        default:
          throw new Error('Método de cálculo no válido');
      }
      
      // Asignar la tarifa calculada
      this.tarifa = Math.round(tarifaBase * 100) / 100;
      
      // Validar que tanto tarifa como peaje sean válidos
      if (this.tarifa < 0 || this.peaje < 0) {
        throw new Error('La tarifa y el peaje deben ser mayores o iguales a 0');
      }
    }
    
    // Calcular el total (tarifa + extras)
    let totalExtras = 0;
    
    // Cargar los extras si existen
    if (this.extras && this.extras.length > 0) {
      await this.populate('extras.extra');
      
      // Sumar el valor de cada extra multiplicado por su cantidad
      totalExtras = this.extras.reduce((sum, extraItem) => {
        return sum + (extraItem.extra.valor * extraItem.cantidad);
      }, 0);
    }
    
    // Calcular el total final
    this.total = Math.round((this.tarifa + totalExtras) * 100) / 100;
    
    next();
  } catch (error) {
    logger.error('Error calculando tarifa automática:', error);
    next(error);
  }
});

/**
 * Middleware que se ejecuta después de guardar un viaje
 * Si el total cambió, recalcula el estado de la partida
 * comparando con la suma de importes en las OCs
 */
viajeSchema.post('save', async function(doc) {
  try {
    // Si el total cambió, necesitamos recalcular el estado
    if (doc.isModified('total')) {
      await actualizarEstadoPartida(doc._id);
    }
  } catch (error) {
    logger.error('Error actualizando estado de partida:', error);
  }
});

// Validación: La `dt` debe ser única por cliente
viajeSchema.index({ dt: 1, cliente: 1 }, { unique: true });

const Viaje = mongoose.model('Viaje', viajeSchema);
module.exports = Viaje;
