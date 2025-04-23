import mongoose, { Document, Schema, model, Types } from 'mongoose';

// Interfaz que define la estructura del documento Empresa
export interface IEmpresa extends Document {
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  razonSocial?: string;
  direccion?: string;
  telefono?: string;
  mail?: string;
  cuit?: string;
  contactoPrincipal?: string;
  flota?: Types.ObjectId[];
  personal?: Types.ObjectId[];
  activa: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
  getInfoContacto(): string;
}

// Schema de Mongoose para la Empresa
const empresaSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la empresa es obligatorio'],
    trim: true,
    unique: true
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de empresa es obligatorio'],
    enum: ['Propia', 'Subcontratada'],
    trim: true
  },
  razonSocial: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  mail: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Por favor ingrese un email válido'
    }
  },
  cuit: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/.test(v);
      },
      message: 'Por favor ingrese un CUIT válido'
    }
  },
  contactoPrincipal: {
    type: String,
    trim: true
  },
  flota: [{
    type: Schema.Types.ObjectId,
    ref: 'Vehiculo'
  }],
  personal: [{
    type: Schema.Types.ObjectId,
    ref: 'Personal'
  }],
  activa: {
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

// Añadir índices para mejorar rendimiento en búsquedas
empresaSchema.index({ cuit: 1 });
empresaSchema.index({ tipo: 1 });

// Método para obtener información completa de contacto
empresaSchema.methods.getInfoContacto = function(this: IEmpresa): string {
  const contacto: string[] = [];
  if (this.direccion) contacto.push(this.direccion);
  if (this.telefono) contacto.push(`Tel: ${this.telefono}`);
  if (this.mail) contacto.push(`Email: ${this.mail}`);
  if (this.contactoPrincipal) contacto.push(`Contacto: ${this.contactoPrincipal}`);
  return contacto.join(' | ') || 'Sin información de contacto';
};

// Exportar el modelo con tipado
export default model<IEmpresa>('Empresa', empresaSchema); 