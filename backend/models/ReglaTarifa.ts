/* eslint-disable max-lines */
import mongoose, { Document, Schema, Types, model } from 'mongoose';

/**
 * Interface for condition in ReglaTarifa
 */
export interface ICondicion {
  campo: string;
  operador:
    | 'igual'
    | 'diferente'
    | 'mayor'
    | 'menor'
    | 'mayorIgual'
    | 'menorIgual'
    | 'entre'
    | 'en'
    | 'contiene';
  valor: unknown;
  valorHasta?: unknown; // Para operador 'entre'
}

/**
 * Interface for tariff modifier
 */
export interface IModificador {
  tipo: 'porcentaje' | 'fijo' | 'formula';
  valor: number | string;
  aplicarA: 'tarifa' | 'peaje' | 'total' | 'extras';
  descripcion?: string;
}

/**
 * Interface for ReglaTarifa document
 */
export interface IReglaTarifa extends Document {
  codigo: string;
  nombre: string;
  descripcion: string;
  cliente?: Types.ObjectId;
  metodoCalculo?: string;
  condiciones: ICondicion[];
  operadorLogico: 'AND' | 'OR';
  modificadores: IModificador[];
  prioridad: number;
  activa: boolean;
  fechaInicioVigencia: Date;
  fechaFinVigencia?: Date;
  aplicarEnCascada: boolean;
  excluirOtrasReglas: boolean;
  diasSemana?: number[];
  horariosAplicacion?: {
    horaInicio: string;
    horaFin: string;
  };
  temporadas?: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  }[];
  estadisticas: {
    vecesAplicada: number;
    ultimaAplicacion?: Date;
    montoTotalModificado: number;
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  evaluarCondiciones(contexto: unknown): boolean;
  aplicarModificadores(valores: unknown): unknown;
  esVigente(fecha?: Date): boolean;
}

/**
 * Interface for ReglaTarifa Model
 */
export interface IReglaTarifaModel extends mongoose.Model<IReglaTarifa> {
  findReglasAplicables(contexto: unknown, fecha?: Date): Promise<IReglaTarifa[]>;
  aplicarReglas(contexto: unknown, valores: unknown): Promise<unknown>;
}

const condicionSchema = new Schema<ICondicion>(
  {
    campo: {
      type: String,
      required: true,
    },
    operador: {
      type: String,
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
      required: true,
    },
    valor: {
      type: Schema.Types.Mixed,
      required: true,
    },
    valorHasta: Schema.Types.Mixed,
  },
  { _id: false }
);

const modificadorSchema = new Schema<IModificador>(
  {
    tipo: {
      type: String,
      enum: ['porcentaje', 'fijo', 'formula'],
      required: true,
    },
    valor: {
      type: Schema.Types.Mixed,
      required: true,
    },
    aplicarA: {
      type: String,
      enum: ['tarifa', 'peaje', 'total', 'extras'],
      required: true,
    },
    descripcion: String,
  },
  { _id: false }
);

const reglaTarifaSchema = new Schema<IReglaTarifa>(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
    },
    metodoCalculo: String,
    condiciones: [condicionSchema],
    operadorLogico: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
    modificadores: [modificadorSchema],
    prioridad: {
      type: Number,
      default: 100,
      min: 1,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    fechaInicioVigencia: {
      type: Date,
      required: true,
    },
    fechaFinVigencia: Date,
    aplicarEnCascada: {
      type: Boolean,
      default: true,
    },
    excluirOtrasReglas: {
      type: Boolean,
      default: false,
    },
    diasSemana: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],
    horariosAplicacion: {
      horaInicio: String,
      horaFin: String,
    },
    temporadas: [
      {
        nombre: String,
        fechaInicio: String,
        fechaFin: String,
      },
    ],
    estadisticas: {
      vecesAplicada: {
        type: Number,
        default: 0,
      },
      ultimaAplicacion: Date,
      montoTotalModificado: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    collection: 'reglastarifas',
  }
);

// Índices
reglaTarifaSchema.index({ cliente: 1, activa: 1, prioridad: -1 });
reglaTarifaSchema.index({ fechaInicioVigencia: 1, fechaFinVigencia: 1 });
reglaTarifaSchema.index({ codigo: 1, activa: 1 });

// Método para evaluar condiciones
reglaTarifaSchema.methods.evaluarCondiciones = function (contexto: unknown): boolean {
  if (!this.condiciones || this.condiciones.length === 0) {
    return true; // Sin condiciones, siempre aplica
  }

  // eslint-disable-next-line complexity
  const resultados = this.condiciones.map((condicion: ICondicion) => {
    const valorContexto = obtenerValorDeContexto(contexto, condicion.campo);

    switch (condicion.operador) {
      case 'igual':
        return valorContexto === condicion.valor;
      case 'diferente':
        return valorContexto !== condicion.valor;
      case 'mayor':
        return (valorContexto as number) > (condicion.valor as number);
      case 'menor':
        return (valorContexto as number) < (condicion.valor as number);
      case 'mayorIgual':
        return (valorContexto as number) >= (condicion.valor as number);
      case 'menorIgual':
        return (valorContexto as number) <= (condicion.valor as number);
      case 'entre':
        return (
          (valorContexto as number) >= (condicion.valor as number) &&
          (valorContexto as number) <= (condicion.valorHasta as number)
        );
      case 'en':
        return Array.isArray(condicion.valor) && condicion.valor.includes(valorContexto);
      case 'contiene':
        return String(valorContexto).includes(String(condicion.valor));
      default:
        return false;
    }
  });

  if (this.operadorLogico === 'AND') {
    return resultados.every((r: boolean) => r);
  } else {
    return resultados.some((r: boolean) => r);
  }
};

// Método para aplicar modificadores
// eslint-disable-next-line complexity
reglaTarifaSchema.methods.aplicarModificadores = function (
  valores: Record<string, unknown>
): Record<string, unknown> {
  const resultado: Record<string, unknown> = { ...valores };

  for (const modificador of this.modificadores) {
    const campo = modificador.aplicarA;
    const valorActual = (resultado[campo] as number) || 0;

    switch (modificador.tipo) {
      case 'porcentaje': {
        const porcentaje = Number(modificador.valor) / 100;
        resultado[campo] = valorActual * (1 + porcentaje);
        break;
      }
      case 'fijo':
        resultado[campo] = valorActual + Number(modificador.valor);
        break;
      case 'formula':
        // Aquí se evaluaría la fórmula con el contexto
        // Por ahora, mantenemos el valor actual
        break;
    }
  }

  // Actualizar el total si se modificaron componentes
  if (
    (resultado.tarifa as number) !== (valores.tarifa as number) ||
    (resultado.peaje as number) !== (valores.peaje as number) ||
    (resultado.extras as number) !== (valores.extras as number)
  ) {
    resultado.total =
      ((resultado.tarifa as number) || 0) +
      ((resultado.peaje as number) || 0) +
      ((resultado.extras as number) || 0);
  }

  return resultado;
};

// Método para verificar vigencia
// eslint-disable-next-line complexity
reglaTarifaSchema.methods.esVigente = function (fecha: Date = new Date()): boolean {
  if (this.fechaInicioVigencia > fecha) {
    return false;
  }

  if (this.fechaFinVigencia && this.fechaFinVigencia < fecha) {
    return false;
  }

  // Verificar día de la semana
  if (this.diasSemana && this.diasSemana.length > 0) {
    const diaSemana = fecha.getDay();
    if (!this.diasSemana.includes(diaSemana)) {
      return false;
    }
  }

  // Verificar horario
  if (this.horariosAplicacion) {
    const hora = fecha.toTimeString().slice(0, 5);
    if (hora < this.horariosAplicacion.horaInicio || hora > this.horariosAplicacion.horaFin) {
      return false;
    }
  }

  // Verificar temporadas
  if (this.temporadas && this.temporadas.length > 0) {
    const mesdia = `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const enTemporada = this.temporadas.some(
      (t: { fechaInicio: string; fechaFin: string }) =>
        mesdia >= t.fechaInicio && mesdia <= t.fechaFin
    );
    if (!enTemporada) {
      return false;
    }
  }

  return true;
};

// Método estático para encontrar reglas aplicables
reglaTarifaSchema.statics.findReglasAplicables = async function (
  contexto: Record<string, unknown>,
  fecha: Date = new Date()
): Promise<IReglaTarifa[]> {
  const query: Record<string, unknown> = {
    activa: true,
    fechaInicioVigencia: { $lte: fecha },
  };

  if (contexto.cliente) {
    query.$or = [{ cliente: contexto.cliente }, { cliente: { $exists: false } }];
  }

  if (contexto.metodoCalculo) {
    query.$or = [{ metodoCalculo: contexto.metodoCalculo }, { metodoCalculo: { $exists: false } }];
  }

  const reglas = await this.find(query).sort({ prioridad: -1 });

  // Filtrar por vigencia y condiciones
  return reglas.filter((regla: IReglaTarifa) => {
    return regla.esVigente(fecha) && regla.evaluarCondiciones(contexto);
  });
};

// Método estático para aplicar reglas
reglaTarifaSchema.statics.aplicarReglas = async function (
  contexto: Record<string, unknown>,
  valores: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const modelo = this as IReglaTarifaModel;
  const reglas = await modelo.findReglasAplicables(contexto);
  let resultado: Record<string, unknown> = { ...valores };

  for (const regla of reglas) {
    resultado = regla.aplicarModificadores(resultado) as Record<string, unknown>;

    // Actualizar estadísticas
    regla.estadisticas.vecesAplicada++;
    regla.estadisticas.ultimaAplicacion = new Date();
    regla.estadisticas.montoTotalModificado +=
      (resultado.total as number) - (valores.total as number);
    await regla.save();

    // Si la regla excluye otras, parar aquí
    if (regla.excluirOtrasReglas) {
      break;
    }

    // Si no aplicar en cascada, usar valores originales para la siguiente
    if (!regla.aplicarEnCascada) {
      resultado = { ...valores };
    }
  }

  return resultado;
};

// Función auxiliar para obtener valor del contexto
function obtenerValorDeContexto(contexto: unknown, campo: string): unknown {
  const partes = campo.split('.');
  let valor: unknown = contexto;

  for (const parte of partes) {
    // Protección contra prototype pollution
    if (parte === '__proto__' || parte === 'constructor' || parte === 'prototype') {
      return undefined;
    }

    if (valor && typeof valor === 'object') {
      valor = (valor as Record<string, unknown>)[parte];
    } else {
      return undefined;
    }
  }

  return valor;
}

// Cast necesario para TypeScript reconozca los métodos estáticos
const ReglaTarifa = model<IReglaTarifa, IReglaTarifaModel>(
  'ReglaTarifa',
  reglaTarifaSchema
) as IReglaTarifaModel;

export default ReglaTarifa;
