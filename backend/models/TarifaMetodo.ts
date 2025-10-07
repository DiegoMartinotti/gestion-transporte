import mongoose, { Document, Schema, model } from 'mongoose';

/**
 * Interface for variable definition in formula
 */
export interface IVariableDefinition {
  nombre: string;
  descripcion: string;
  tipo: 'number' | 'string' | 'boolean' | 'date';
  origen: 'tramo' | 'viaje' | 'cliente' | 'vehiculo' | 'calculado' | 'constante';
  campo?: string; // Campo específico del origen
  valorPorDefecto?: unknown;
  requerido: boolean;
}

/**
 * Interface for TarifaMetodo document
 */
export interface ITarifaMetodo extends Document {
  codigo: string;
  nombre: string;
  descripcion: string;
  formulaBase: string;
  variables: IVariableDefinition[];
  activo: boolean;
  prioridad: number;
  requiereDistancia: boolean;
  requierePalets: boolean;
  permiteFormulasPersonalizadas: boolean;
  configuracion: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  validarFormula(formula: string): boolean;
  obtenerVariablesDisponibles(): IVariableDefinition[];
}

/**
 * Interface for TarifaMetodo Model
 */
export interface ITarifaMetodoModel extends mongoose.Model<ITarifaMetodo> {
  findByCodigoActivo(codigo: string): Promise<ITarifaMetodo | null>;
  getMetodosActivos(): Promise<ITarifaMetodo[]>;
}

const variableDefinitionSchema = new Schema<IVariableDefinition>(
  {
    nombre: {
      type: String,
      required: true,
      match: /^[A-Za-z]\w*$/,
    },
    descripcion: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['number', 'string', 'boolean', 'date'],
      required: true,
    },
    origen: {
      type: String,
      enum: ['tramo', 'viaje', 'cliente', 'vehiculo', 'calculado', 'constante'],
      required: true,
    },
    campo: String,
    valorPorDefecto: Schema.Types.Mixed,
    requerido: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const tarifaMetodoSchema = new Schema<ITarifaMetodo>(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: /^[A-Z]\w*$/,
    },
    nombre: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    formulaBase: {
      type: String,
      required: true,
      default: 'Valor * Cantidad + Peaje',
    },
    variables: [variableDefinitionSchema],
    activo: {
      type: Boolean,
      default: true,
    },
    prioridad: {
      type: Number,
      default: 100,
      min: 1,
    },
    requiereDistancia: {
      type: Boolean,
      default: false,
    },
    requierePalets: {
      type: Boolean,
      default: false,
    },
    permiteFormulasPersonalizadas: {
      type: Boolean,
      default: true,
    },
    configuracion: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'tarifametodos',
  }
);

// Índices
tarifaMetodoSchema.index({ codigo: 1, activo: 1 });
tarifaMetodoSchema.index({ prioridad: -1, activo: 1 });

// Método para validar una fórmula
tarifaMetodoSchema.methods.validarFormula = function (formula: string): boolean {
  // Obtener todas las variables disponibles
  const variablesDisponibles = this.variables.map((v: IVariableDefinition) => v.nombre);

  // Extraer variables de la fórmula (palabras que empiezan con letra)
  const variablesEnFormula = formula.match(/\b[A-Za-z]\w*\b/g) || [];

  // Filtrar funciones conocidas
  const funcionesPermitidas = ['SI', 'MAX', 'MIN', 'REDONDEAR', 'ABS', 'PROMEDIO'];
  const variablesFiltradas = variablesEnFormula.filter(
    (v) => !funcionesPermitidas.includes(v.toUpperCase())
  );

  // Verificar que todas las variables están definidas
  return variablesFiltradas.every((variable) => variablesDisponibles.includes(variable));
};

// Método para obtener variables disponibles
tarifaMetodoSchema.methods.obtenerVariablesDisponibles = function (): IVariableDefinition[] {
  // Agregar variables estándar siempre disponibles
  const variablesEstandar: IVariableDefinition[] = [
    {
      nombre: 'Valor',
      descripcion: 'Valor base de la tarifa',
      tipo: 'number',
      origen: 'tramo',
      campo: 'valor',
      requerido: true,
    },
    {
      nombre: 'Peaje',
      descripcion: 'Valor del peaje',
      tipo: 'number',
      origen: 'tramo',
      campo: 'valorPeaje',
      requerido: false,
    },
    {
      nombre: 'Cantidad',
      descripcion: 'Cantidad para el cálculo (palets, km, etc)',
      tipo: 'number',
      origen: 'viaje',
      campo: 'paletas',
      requerido: false,
    },
  ];

  return [...variablesEstandar, ...this.variables];
};

// Método estático para buscar método activo por código
tarifaMetodoSchema.statics.findByCodigoActivo = async function (
  codigo: string
): Promise<ITarifaMetodo | null> {
  return this.findOne({ codigo: codigo.toUpperCase(), activo: true });
};

// Método estático para obtener todos los métodos activos
tarifaMetodoSchema.statics.getMetodosActivos = async function (): Promise<ITarifaMetodo[]> {
  return this.find({ activo: true }).sort({ prioridad: -1 });
};

const TarifaMetodo = model<ITarifaMetodo, ITarifaMetodoModel>('TarifaMetodo', tarifaMetodoSchema);

export default TarifaMetodo;
