import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Definición de la interfaz para el historial de cambios
export interface IHistorialCambio {
  fecha: Date;
  usuario?: Types.ObjectId;
  formulaAnterior: string;
  formulaNueva: string;
  motivo?: string;
}

// Definición de la interfaz para el documento
export interface IFormulasPersonalizadasCliente extends Document {
  clienteId: Types.ObjectId;
  tipoUnidad: 'Sider' | 'Bitren' | 'General' | 'Todos';
  metodoCalculo: string; // Ahora soporta cualquier método, no solo 'Palet'
  formula: string;
  nombre?: string;
  descripcion?: string;
  prioridad: number;
  condiciones?: {
    campo: string;
    operador: string;
    valor: unknown;
  }[];
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
  activa: boolean;
  historialCambios: IHistorialCambio[];
  estadisticas: {
    vecesUtilizada: number;
    ultimoUso?: Date;
    montoTotalCalculado: number;
  };
  validacionFormula?: {
    esValida: boolean;
    mensaje?: string;
    ultimaValidacion: Date;
  };
  etiquetas?: string[];
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  validarFormula(): Promise<boolean>;
  registrarUso(monto: number): Promise<void>;
  clonar(): Promise<IFormulasPersonalizadasCliente>;
}

// Schema para el historial de cambios
const historialCambioSchema = new Schema<IHistorialCambio>(
  {
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    formulaAnterior: {
      type: String,
      required: true,
    },
    formulaNueva: {
      type: String,
      required: true,
    },
    motivo: String,
  },
  { _id: false }
);

// Definición del schema de Mongoose con tipos
const formulasPersonalizadasClienteSchema = new Schema(
  {
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
      index: true,
    },
    tipoUnidad: {
      type: String,
      required: true,
      enum: ['Sider', 'Bitren', 'General', 'Todos'],
      default: 'General',
      index: true,
    },
    metodoCalculo: {
      type: String,
      required: true,
      default: 'Palet',
      index: true,
    },
    formula: {
      type: String,
      required: true,
      trim: true,
    },
    nombre: {
      type: String,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    prioridad: {
      type: Number,
      default: 100,
      min: 1,
    },
    condiciones: [
      {
        campo: {
          type: String,
          required: true,
        },
        operador: {
          type: String,
          required: true,
          enum: [
            'igual',
            'diferente',
            'mayor',
            'menor',
            'mayorIgual',
            'menorIgual',
            'entre',
            'en',
            'contiene',
          ],
        },
        valor: Schema.Types.Mixed,
      },
    ],
    vigenciaDesde: {
      type: Date,
      required: true,
      index: true,
    },
    vigenciaHasta: {
      type: Date,
      index: true,
    },
    activa: {
      type: Boolean,
      default: true,
      index: true,
    },
    historialCambios: [historialCambioSchema],
    estadisticas: {
      vecesUtilizada: {
        type: Number,
        default: 0,
      },
      ultimoUso: Date,
      montoTotalCalculado: {
        type: Number,
        default: 0,
      },
    },
    validacionFormula: {
      esValida: {
        type: Boolean,
        default: true,
      },
      mensaje: String,
      ultimaValidacion: {
        type: Date,
        default: Date.now,
      },
    },
    etiquetas: [String],
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas comunes y validación de solapamientos
formulasPersonalizadasClienteSchema.index({
  clienteId: 1,
  tipoUnidad: 1,
  metodoCalculo: 1,
  vigenciaDesde: 1,
});
formulasPersonalizadasClienteSchema.index({
  clienteId: 1,
  tipoUnidad: 1,
  metodoCalculo: 1,
  vigenciaHasta: 1,
});
formulasPersonalizadasClienteSchema.index({ activa: 1, prioridad: -1 });

// Método para validar la fórmula
formulasPersonalizadasClienteSchema.methods.validarFormula = async function (): Promise<boolean> {
  try {
    // Importar el validador de fórmulas
    const { evaluarFormula } = await import('../utils/formulaParser');

    // Variables de prueba para validación
    const variablesPrueba = {
      Valor: 100,
      Peaje: 10,
      Palets: 5,
      Cantidad: 5,
      Distancia: 50,
      Peso: 1000,
      TipoUnidad: this.tipoUnidad,
    };

    // Intentar evaluar la fórmula
    const resultado = evaluarFormula(this.formula, variablesPrueba);

    // Actualizar estado de validación
    this.validacionFormula = {
      esValida: !isNaN(resultado) && isFinite(resultado),
      mensaje:
        !isNaN(resultado) && isFinite(resultado) ? 'Fórmula válida' : 'Error en la evaluación',
      ultimaValidacion: new Date(),
    };

    await this.save();
    return this.validacionFormula.esValida;
  } catch (error: unknown) {
    this.validacionFormula = {
      esValida: false,
      mensaje: (error instanceof Error ? error.message : String(error)) || 'Error al validar la fórmula',
      ultimaValidacion: new Date(),
    };

    await this.save();
    return false;
  }
};

// Método para registrar uso de la fórmula
formulasPersonalizadasClienteSchema.methods.registrarUso = async function (
  monto: number
): Promise<void> {
  this.estadisticas.vecesUtilizada++;
  this.estadisticas.ultimoUso = new Date();
  this.estadisticas.montoTotalCalculado += monto;
  await this.save();
};

// Método para clonar una fórmula
formulasPersonalizadasClienteSchema.methods.clonar =
  async function (): Promise<IFormulasPersonalizadasCliente> {
    const FormulaModel = this.constructor as Model<IFormulasPersonalizadasCliente>;

    const nuevaFormula = new FormulaModel({
      clienteId: this.clienteId,
      tipoUnidad: this.tipoUnidad,
      metodoCalculo: this.metodoCalculo,
      formula: this.formula,
      nombre: this.nombre ? `${this.nombre} (Copia)` : undefined,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      condiciones: this.condiciones,
      vigenciaDesde: new Date(),
      vigenciaHasta: this.vigenciaHasta,
      activa: false, // Desactivada por defecto
      etiquetas: this.etiquetas,
    });

    return await nuevaFormula.save();
  };

// Middleware para registrar cambios en el historial
formulasPersonalizadasClienteSchema.pre('save', async function (next) {
  if (this.isModified('formula') && !this.isNew) {
    const FormulaModel = this.constructor as Model<IFormulasPersonalizadasCliente>;
    const original = await FormulaModel.findById(this._id);
    if (original) {
      this.historialCambios.push({
        fecha: new Date(),
        formulaAnterior: original.formula,
        formulaNueva: this.formula,
        motivo: 'Actualización de fórmula',
      });
    }
  }
  next();
});

// Método estático para buscar fórmula aplicable
formulasPersonalizadasClienteSchema.statics.findFormulaAplicable = async function (
  clienteId: string,
  tipoUnidad: string,
  metodoCalculo: string,
  fecha: Date = new Date()
): Promise<IFormulasPersonalizadasCliente | null> {
  const formulas = await this.find({
    clienteId,
    activa: true,
    vigenciaDesde: { $lte: fecha },
    $or: [{ vigenciaHasta: { $gte: fecha } }, { vigenciaHasta: { $exists: false } }],
    $and: [
      { $or: [{ tipoUnidad }, { tipoUnidad: 'Todos' }] },
      { $or: [{ metodoCalculo }, { metodoCalculo: { $exists: false } }] },
    ],
  }).sort({ prioridad: -1 });

  // Evaluar condiciones si existen
  for (const formula of formulas) {
    if (!formula.condiciones || formula.condiciones.length === 0) {
      return formula;
    }
    // Aquí se evaluarían las condiciones adicionales
    // Por ahora retornamos la primera que encontramos
    return formula;
  }

  return null;
};

// Interfaz para el modelo con métodos estáticos
interface IFormulasPersonalizadasClienteModel extends Model<IFormulasPersonalizadasCliente> {
  findFormulaAplicable(
    clienteId: string,
    tipoUnidad: string,
    metodoCalculo: string,
    fecha?: Date
  ): Promise<IFormulasPersonalizadasCliente | null>;
}

// Creación y exportación del modelo tipado
const FormulasPersonalizadasCliente = mongoose.model<
  IFormulasPersonalizadasCliente,
  IFormulasPersonalizadasClienteModel
>('FormulasPersonalizadasCliente', formulasPersonalizadasClienteSchema);

export default FormulasPersonalizadasCliente;
