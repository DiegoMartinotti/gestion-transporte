import mongoose, { Schema, Types, model } from 'mongoose';
import { attachViajeHooks, UNKNOWN_SITE_LABEL, getSiteName } from './viajeHooks';
import type { IViaje, IViajeModel, IVehiculoViaje, IExtraViaje } from './viaje.types';

const vehiculoSchema = new Schema<IVehiculoViaje>(
  {
    vehiculo: {
      type: Schema.Types.ObjectId,
      ref: 'Vehiculo',
      required: true,
    },
    posicion: {
      type: Number,
      default: 1,
      min: 1,
    },
    observaciones: String,
  },
  { _id: false }
);

const extraSchema = new Schema<IExtraViaje>(
  {
    extra: {
      type: Schema.Types.ObjectId,
      ref: 'Extra',
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const viajeSchema = new Schema<IViaje>(
  {
    cliente: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    fecha: { type: Date, required: true },
    origen: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    destino: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    tipoTramo: {
      type: String,
      enum: ['TRMC', 'TRMI'],
      default: 'TRMC',
      required: true,
    },
    chofer: {
      type: Schema.Types.ObjectId,
      ref: 'Personal',
      required: true,
      validate: {
        validator: async (value: Types.ObjectId) => {
          const personal = await mongoose
            .model('Personal')
            .findById(value)
            .lean<{ activo?: boolean }>();
          return personal?.activo === true;
        },
        message: 'El chofer debe ser un personal activo',
      },
    },
    vehiculos: {
      type: [vehiculoSchema],
      default: [],
    },
    tipoUnidad: {
      type: String,
      enum: ['Sider', 'Bitren'],
      default: 'Sider',
      required: true,
    },
    paletas: { type: Number, default: 0 },
    tarifa: {
      type: Number,
      required: true,
      min: 0,
    },
    peaje: {
      type: Number,
      required: true,
      min: 0,
    },
    dt: { type: String, required: true },
    extras: {
      type: [extraSchema],
      default: [],
    },
    cobros: [
      {
        type: Schema.Types.ObjectId,
        ref: 'OrdenCompra',
        required: true,
      },
    ],
    total: { type: Number, default: 0 },
    estado: {
      type: String,
      enum: ['Pendiente', 'En Curso', 'Completado', 'Cancelado'],
      default: 'Pendiente',
    },
    estadoPartida: {
      type: String,
      enum: ['Abierta', 'Cerrada'],
      default: 'Abierta',
    },
    observaciones: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

attachViajeHooks(viajeSchema);

viajeSchema.post('init', (doc: IViaje) => {
  if (!Array.isArray(doc.vehiculos)) {
    doc.vehiculos = [];
  }
  if (!Array.isArray(doc.extras)) {
    doc.extras = [];
  }
});

viajeSchema.index({ dt: 1, cliente: 1 }, { unique: true });
viajeSchema.index({ cliente: 1, fecha: -1 });
viajeSchema.index({ vehiculos: 1, fecha: -1 });
viajeSchema.index({ estado: 1, fecha: -1 });
viajeSchema.index({ origen: 1 });
viajeSchema.index({ destino: 1 });

viajeSchema.methods.getDescripcionCorta = function (this: IViaje): string {
  const origenNombre = getSiteName(this.origen) ?? UNKNOWN_SITE_LABEL;
  const destinoNombre = getSiteName(this.destino) ?? UNKNOWN_SITE_LABEL;
  return `${origenNombre} -> ${destinoNombre}`;
};

viajeSchema.methods.isCompleto = function (this: IViaje): boolean {
  const fechaFin = (this as { fecha_fin?: Date }).fecha_fin;
  return Boolean(this.origen && this.destino && this.vehiculos && this.fecha && fechaFin);
};

const Viaje = model<IViaje, IViajeModel>('Viaje', viajeSchema);

export default Viaje;
