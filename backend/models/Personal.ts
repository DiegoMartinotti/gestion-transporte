import { Document, Schema, model, Model, Types } from 'mongoose';
import { IEmpresa } from './Empresa';
import {
  IDireccion,
  IContacto,
  IPeriodoEmpleo,
  IDocumentacion,
  IDatosLaborales,
  ICapacitacion,
  IIncidente,
  IVencimiento,
} from './personal.interfaces';

export interface IPersonal extends Document {
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string;
  tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  fechaNacimiento?: Date;
  direccion?: IDireccion;
  contacto?: IContacto;
  empresa: Types.ObjectId | IEmpresa;
  numeroLegajo?: string;
  periodosEmpleo: IPeriodoEmpleo[];
  documentacion?: IDocumentacion;
  datosLaborales?: IDatosLaborales;
  capacitaciones?: ICapacitacion[];
  incidentes?: IIncidente[];
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;

  getVencimientosProximos(diasLimite?: number): IVencimiento[];
  getEdad(): number | null;
  estaEmpleadoActualmente(): boolean;
}

type IPersonalModel = Model<IPersonal>;

const sanitizeDni = (dni?: string): string | undefined => (dni ? dni.replace(/\D/g, '') : dni);

const getPersonalModel = (doc: IPersonal): IPersonalModel => doc.constructor as IPersonalModel;

const assignNextLegajo = async (doc: IPersonal): Promise<void> => {
  const PersonalModel = getPersonalModel(doc);
  const ultimoPersonal = await PersonalModel.findOne(
    { empresa: doc.empresa, numeroLegajo: { $exists: true, $ne: null } },
    { numeroLegajo: 1 },
    { sort: { numeroLegajo: -1 } }
  ).lean();

  let nuevoNumero = 1;
  if (ultimoPersonal?.numeroLegajo) {
    const ultimoNumero = parseInt(ultimoPersonal.numeroLegajo, 10);
    if (!Number.isNaN(ultimoNumero)) {
      nuevoNumero = ultimoNumero + 1;
    }
  }

  doc.numeroLegajo = nuevoNumero.toString().padStart(4, '0');
};

const ensureLegajoDisponible = async (doc: IPersonal): Promise<void> => {
  const PersonalModel = getPersonalModel(doc);
  const existeLegajo = await PersonalModel.findOne({
    empresa: doc.empresa,
    numeroLegajo: doc.numeroLegajo,
    _id: { $ne: doc._id },
  }).lean();

  if (existeLegajo) {
    throw new Error(`El número de legajo ${doc.numeroLegajo} ya está en uso en esta empresa`);
  }
};

const personalSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },
    dni: {
      type: String,
      required: [true, 'El DNI es obligatorio'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^\d{7,8}$/.test(v);
        },
        message: 'Formato de DNI inválido',
      },
    },
    cuil: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\d{2}-\d{8}-\d$/.test(v);
        },
        message: 'Formato de CUIL inválido',
      },
    },
    tipo: {
      type: String,
      required: [true, 'El tipo de personal es obligatorio'],
      enum: ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'],
      trim: true,
    },
    fechaNacimiento: {
      type: Date,
    },
    direccion: {
      calle: String,
      numero: String,
      localidad: String,
      provincia: String,
      codigoPostal: String,
    },
    contacto: {
      telefono: String,
      telefonoEmergencia: String,
      email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (v: string) {
            return !v || /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/u.test(v);
          },
          message: 'Email inválido',
        },
      },
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
    },
    numeroLegajo: {
      type: String,
      trim: true,
    },
    periodosEmpleo: [
      {
        fechaIngreso: {
          type: Date,
          required: [true, 'La fecha de ingreso es obligatoria para cada período'],
        },
        fechaEgreso: Date,
        motivo: String,
        categoria: String,
      },
    ],
    documentacion: {
      licenciaConducir: {
        numero: String,
        categoria: String,
        vencimiento: Date,
      },
      carnetProfesional: {
        numero: String,
        vencimiento: Date,
      },
      evaluacionMedica: {
        fecha: Date,
        vencimiento: Date,
        resultado: String,
      },
      psicofisico: {
        fecha: Date,
        vencimiento: Date,
        resultado: String,
      },
    },
    datosLaborales: {
      categoria: String,
      obraSocial: String,
      art: String,
    },
    capacitaciones: [
      {
        nombre: String,
        fecha: Date,
        vencimiento: Date,
        institucion: String,
        certificado: String,
      },
    ],
    incidentes: [
      {
        fecha: Date,
        tipo: {
          type: String,
          enum: ['Accidente', 'Infracción', 'Otro'],
        },
        descripcion: String,
        consecuencias: String,
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

personalSchema.index({ empresa: 1, dni: 1 });
personalSchema.index({ empresa: 1, numeroLegajo: 1 }, { unique: true, sparse: true });
personalSchema.index({ empresa: 1, 'documentacion.licenciaConducir.vencimiento': 1 });
personalSchema.index({ empresa: 1, 'documentacion.psicofisico.vencimiento': 1 });

personalSchema.pre('save', async function (this: IPersonal, next) {
  try {
    if (this.dni) {
      this.dni = sanitizeDni(this.dni) ?? this.dni;
    }

    if (!this.numeroLegajo && this.empresa) {
      await assignNextLegajo(this);
    } else if (this.isModified('numeroLegajo') && this.numeroLegajo) {
      await ensureLegajoDisponible(this);
    }

    next();
  } catch (error) {
    // Convertir cualquier error a Error standard para que sea aceptado por mongoose
    if (error instanceof Error) {
      next(error);
    } else {
      next(new Error('Error desconocido durante el guardado'));
    }
  }
});

personalSchema.methods.getVencimientosProximos = function (
  this: IPersonal,
  diasLimite: number = 30
): IVencimiento[] {
  const limite = new Date();
  limite.setDate(limite.getDate() + diasLimite);

  const vencimientos: IVencimiento[] = [];

  if (
    this.documentacion?.licenciaConducir?.vencimiento &&
    this.documentacion.licenciaConducir.vencimiento <= limite
  ) {
    vencimientos.push({
      tipo: 'Licencia de Conducir',
      vencimiento: this.documentacion.licenciaConducir.vencimiento,
    });
  }

  if (
    this.documentacion?.psicofisico?.vencimiento &&
    this.documentacion.psicofisico.vencimiento <= limite
  ) {
    vencimientos.push({
      tipo: 'Psicofísico',
      vencimiento: this.documentacion.psicofisico.vencimiento,
    });
  }

  return vencimientos;
};

personalSchema.methods.getEdad = function (this: IPersonal): number | null {
  if (!this.fechaNacimiento) return null;
  const hoy = new Date();
  const edad = hoy.getFullYear() - this.fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - this.fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < this.fechaNacimiento.getDate())) {
    return edad - 1;
  }
  return edad;
};

personalSchema.methods.estaEmpleadoActualmente = function (this: IPersonal): boolean {
  if (!this.periodosEmpleo || this.periodosEmpleo.length === 0) return false;

  // Obtener el último período de empleo
  const ultimoPeriodo = this.periodosEmpleo[this.periodosEmpleo.length - 1];

  // Si no tiene fecha de egreso en el último período, está empleado actualmente
  return !ultimoPeriodo.fechaEgreso;
};

// Exportar el modelo con tipado
export default model<IPersonal, IPersonalModel>('Personal', personalSchema);
