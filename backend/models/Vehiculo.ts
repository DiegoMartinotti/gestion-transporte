import { Document, Schema, Types, model, Model } from 'mongoose';

/**
 * Interface for Documentacion subdocument
 */
export interface IDocumentacion {
  seguro?: {
    numero?: string;
    vencimiento?: Date;
    compania?: string;
  };
  vtv?: {
    numero?: string;
    vencimiento?: Date;
  };
  ruta?: {
    numero?: string;
    vencimiento?: Date;
  };
  senasa?: {
    numero?: string;
    vencimiento?: Date;
  };
}

/**
 * Interface for Caracteristicas subdocument
 */
export interface ICaracteristicas {
  capacidadCarga?: number; // en kilogramos
  tara?: number; // peso del vehículo vacío
  largo?: number; // en metros
  ancho?: number; // en metros
  alto?: number; // en metros
  configuracionEjes?: string;
  tipoCarroceria?: string;
}

/**
 * Interface for Mantenimiento subdocument
 */
export interface IMantenimiento {
  _id?: Types.ObjectId;
  fecha?: Date;
  tipo?: 'Preventivo' | 'Correctivo' | 'Revisión';
  kilometraje?: number;
  descripcion?: string;
  costo?: number;
}

/**
 * Interface for Vencimiento Proximo
 */
export interface IVencimientoProximo {
  tipo: string;
  vencimiento: Date;
}

/**
 * Interface for Vehiculo document
 */
export interface IVehiculo extends Document {
  dominio: string;
  tipo: 'Camión' | 'Acoplado' | 'Semirremolque' | 'Bitren' | 'Furgón' | 'Utilitario';
  marca?: string;
  modelo?: string;
  año?: number;
  numeroChasis?: string;
  numeroMotor?: string;
  empresa: Types.ObjectId;
  documentacion?: IDocumentacion;
  caracteristicas?: ICaracteristicas;
  mantenimiento?: IMantenimiento[];
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  getVencimientosProximos(diasLimite?: number): IVencimientoProximo[];
  getResumen(): string;
}

/**
 * Interface for Vehiculo Model
 */
type IVehiculoModel = Model<IVehiculo>;

const vehiculoSchema = new Schema<IVehiculo>(
  {
    dominio: {
      type: String,
      required: [true, 'La patente/dominio es obligatoria'],
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v: string) {
          // Validación para patentes argentinas (formato viejo y nuevo)
          return /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/.test(v);
        },
        message: 'Formato de patente inválido',
      },
    },
    tipo: {
      type: String,
      required: [true, 'El tipo de vehículo es obligatorio'],
      enum: ['Camión', 'Acoplado', 'Semirremolque', 'Bitren', 'Furgón', 'Utilitario'],
      trim: true,
    },
    marca: {
      type: String,
      trim: true,
    },
    modelo: {
      type: String,
      trim: true,
    },
    año: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 1,
    },
    numeroChasis: {
      type: String,
      trim: true,
      uppercase: true,
    },
    numeroMotor: {
      type: String,
      trim: true,
      uppercase: true,
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
    },
    documentacion: {
      seguro: {
        numero: String,
        vencimiento: Date,
        compania: String,
      },
      vtv: {
        numero: String,
        vencimiento: Date,
      },
      ruta: {
        numero: String,
        vencimiento: Date,
      },
      senasa: {
        numero: String,
        vencimiento: Date,
      },
    },
    caracteristicas: {
      capacidadCarga: Number, // en kilogramos
      tara: Number, // peso del vehículo vacío
      largo: Number, // en metros
      ancho: Number, // en metros
      alto: Number, // en metros
      configuracionEjes: String,
      tipoCarroceria: String,
    },
    mantenimiento: [
      {
        fecha: Date,
        tipo: {
          type: String,
          enum: ['Preventivo', 'Correctivo', 'Revisión'],
        },
        kilometraje: Number,
        descripcion: String,
        costo: Number,
      },
    ],
    activo: {
      type: Boolean,
      default: true,
    },
    observaciones: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices
vehiculoSchema.index({ empresa: 1, dominio: 1 });
vehiculoSchema.index({ 'documentacion.seguro.vencimiento': 1 });
vehiculoSchema.index({ 'documentacion.vtv.vencimiento': 1 });
vehiculoSchema.index({ 'documentacion.ruta.vencimiento': 1 });

// Middleware para normalizar datos
vehiculoSchema.pre('save', function (next) {
  if (this.dominio) this.dominio = this.dominio.toUpperCase();
  if (this.numeroChasis) this.numeroChasis = this.numeroChasis.toUpperCase();
  if (this.numeroMotor) this.numeroMotor = this.numeroMotor.toUpperCase();
  next();
});

// Método para verificar vencimientos próximos
vehiculoSchema.methods.getVencimientosProximos = function (
  this: IVehiculo,
  diasLimite: number = 30
): IVencimientoProximo[] {
  const limite = new Date();
  limite.setDate(limite.getDate() + diasLimite);

  const vencimientos: IVencimientoProximo[] = [];

  if (this.documentacion?.seguro?.vencimiento && this.documentacion.seguro.vencimiento <= limite) {
    vencimientos.push({
      tipo: 'Seguro',
      vencimiento: this.documentacion.seguro.vencimiento,
    });
  }

  if (this.documentacion?.vtv?.vencimiento && this.documentacion.vtv.vencimiento <= limite) {
    vencimientos.push({
      tipo: 'VTV',
      vencimiento: this.documentacion.vtv.vencimiento,
    });
  }

  return vencimientos;
};

// Método para obtener información resumida
vehiculoSchema.methods.getResumen = function (this: IVehiculo): string {
  return `${this.dominio} - ${this.marca} ${this.modelo} (${this.tipo})`;
};

const Vehiculo = model<IVehiculo, IVehiculoModel>('Vehiculo', vehiculoSchema);

export default Vehiculo;
