import mongoose, { Document, Schema, model, Model, Types, CallbackError } from 'mongoose';
import { IEmpresa } from './Empresa';

// Interfaces para estructuras anidadas
interface IDireccion {
  calle?: string;
  numero?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

interface IContacto {
  telefono?: string;
  telefonoEmergencia?: string;
  email?: string;
}

interface IPeriodoEmpleo {
  fechaIngreso: Date;
  fechaEgreso?: Date;
  motivo?: string;
  categoria?: string;
}

interface ILicenciaConducir {
  numero?: string;
  categoria?: string;
  vencimiento?: Date;
}

interface ICarnetProfesional {
  numero?: string;
  vencimiento?: Date;
}

interface IEvaluacion {
  fecha?: Date;
  vencimiento?: Date;
  resultado?: string;
}

interface IDocumentacion {
  licenciaConducir?: ILicenciaConducir;
  carnetProfesional?: ICarnetProfesional;
  evaluacionMedica?: IEvaluacion;
  psicofisico?: IEvaluacion;
}

interface IDatosLaborales {
  categoria?: string;
  obraSocial?: string;
  art?: string;
}

interface ICapacitacion {
  nombre?: string;
  fecha?: Date;
  vencimiento?: Date;
  institucion?: string;
  certificado?: string;
}

interface IIncidente {
  fecha?: Date;
  tipo?: 'Accidente' | 'Infracción' | 'Otro';
  descripcion?: string;
  consecuencias?: string;
}

interface IVencimiento {
  tipo: string;
  vencimiento: Date;
}

// Interfaz principal para el modelo Personal
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
  
  // Métodos
  getVencimientosProximos(diasLimite?: number): IVencimiento[];
  getEdad(): number | null;
  estaEmpleadoActualmente(): boolean;
}

// Interfaz para el modelo (incluye métodos estáticos)
interface IPersonalModel extends Model<IPersonal> {
  // Si hay métodos estáticos, se definirían aquí
}

const personalSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  dni: {
    type: String,
    required: [true, 'El DNI es obligatorio'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[0-9]{7,8}$/.test(v);
      },
      message: 'Formato de DNI inválido'
    }
  },
  cuil: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9]{2}-[0-9]{8}-[0-9]$/.test(v);
      },
      message: 'Formato de CUIL inválido'
    }
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de personal es obligatorio'],
    enum: ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'],
    trim: true
  },
  fechaNacimiento: {
    type: Date
  },
  direccion: {
    calle: String,
    numero: String,
    localidad: String,
    provincia: String,
    codigoPostal: String
  },
  contacto: {
    telefono: String,
    telefonoEmergencia: String,
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Email inválido'
      }
    }
  },
  empresa: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: [true, 'La empresa es obligatoria']
  },
  numeroLegajo: {
    type: String,
    trim: true
  },
  periodosEmpleo: [{
    fechaIngreso: {
      type: Date,
      required: [true, 'La fecha de ingreso es obligatoria para cada período']
    },
    fechaEgreso: Date,
    motivo: String,
    categoria: String
  }],
  documentacion: {
    licenciaConducir: {
      numero: String,
      categoria: String,
      vencimiento: Date
    },
    carnetProfesional: {
      numero: String,
      vencimiento: Date
    },
    evaluacionMedica: {
      fecha: Date,
      vencimiento: Date,
      resultado: String
    },
    psicofisico: {
      fecha: Date,
      vencimiento: Date,
      resultado: String
    }
  },
  datosLaborales: {
    categoria: String,
    obraSocial: String,
    art: String
  },
  capacitaciones: [{
    nombre: String,
    fecha: Date,
    vencimiento: Date,
    institucion: String,
    certificado: String
  }],
  incidentes: [{
    fecha: Date,
    tipo: {
      type: String,
      enum: ['Accidente', 'Infracción', 'Otro']
    },
    descripcion: String,
    consecuencias: String
  }],
  activo: {
    type: Boolean,
    default: true
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices
personalSchema.index({ empresa: 1, dni: 1 });
personalSchema.index({ empresa: 1, numeroLegajo: 1 }, { unique: true, sparse: true });
personalSchema.index({ empresa: 1, 'documentacion.licenciaConducir.vencimiento': 1 });
personalSchema.index({ empresa: 1, 'documentacion.psicofisico.vencimiento': 1 });

// Middleware para normalizar datos y generar legajo automáticamente
personalSchema.pre('save', async function(this: IPersonal, next) {
  try {
    // Normalizar datos
    if (this.dni) this.dni = this.dni.replace(/\D/g, '');
    
    // Si no hay número de legajo, generarlo automáticamente
    if (!this.numeroLegajo && this.empresa) {
      const Personal = this.constructor as IPersonalModel;
      
      // Buscar el último legajo para esta empresa
      const ultimoPersonal = await Personal.findOne(
        { empresa: this.empresa, numeroLegajo: { $exists: true, $ne: null } },
        { numeroLegajo: 1 },
        { sort: { numeroLegajo: -1 } }
      );
      
      let nuevoNumero = 1;
      if (ultimoPersonal && ultimoPersonal.numeroLegajo) {
        // Extraer el número del último legajo (asumiendo formato numérico)
        const ultimoNumero = parseInt(ultimoPersonal.numeroLegajo, 10);
        if (!isNaN(ultimoNumero)) {
          nuevoNumero = ultimoNumero + 1;
        }
      }
      
      // Formatear el nuevo número de legajo (con ceros a la izquierda)
      this.numeroLegajo = nuevoNumero.toString().padStart(4, '0');
    }
    // Si se proporciona un número de legajo, verificar que esté disponible
    else if (this.isModified('numeroLegajo') && this.numeroLegajo) {
      const Personal = this.constructor as IPersonalModel;
      const existeLegajo = await Personal.findOne({
        empresa: this.empresa,
        numeroLegajo: this.numeroLegajo,
        _id: { $ne: this._id } // Excluir el documento actual en caso de actualización
      });
      
      if (existeLegajo) {
        throw new Error(`El número de legajo ${this.numeroLegajo} ya está en uso en esta empresa`);
      }
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

// Método para verificar vencimientos próximos
personalSchema.methods.getVencimientosProximos = function(this: IPersonal, diasLimite: number = 30): IVencimiento[] {
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + diasLimite);
  
  const vencimientos: IVencimiento[] = [];
  
  if (this.documentacion?.licenciaConducir?.vencimiento && 
      this.documentacion.licenciaConducir.vencimiento <= limite) {
    vencimientos.push({
      tipo: 'Licencia de Conducir',
      vencimiento: this.documentacion.licenciaConducir.vencimiento
    });
  }
  
  if (this.documentacion?.psicofisico?.vencimiento && 
      this.documentacion.psicofisico.vencimiento <= limite) {
    vencimientos.push({
      tipo: 'Psicofísico',
      vencimiento: this.documentacion.psicofisico.vencimiento
    });
  }
  
  return vencimientos;
};

// Método para obtener edad
personalSchema.methods.getEdad = function(this: IPersonal): number | null {
  if (!this.fechaNacimiento) return null;
  const hoy = new Date();
  const edad = hoy.getFullYear() - this.fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - this.fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < this.fechaNacimiento.getDate())) {
    return edad - 1;
  }
  return edad;
};

// Método para verificar si está actualmente empleado
personalSchema.methods.estaEmpleadoActualmente = function(this: IPersonal): boolean {
  if (!this.periodosEmpleo || this.periodosEmpleo.length === 0) return false;
  
  // Obtener el último período de empleo
  const ultimoPeriodo = this.periodosEmpleo[this.periodosEmpleo.length - 1];
  
  // Si no tiene fecha de egreso en el último período, está empleado actualmente
  return !ultimoPeriodo.fechaEgreso;
};

// Exportar el modelo con tipado
export default model<IPersonal, IPersonalModel>('Personal', personalSchema); 