// Helpers para el ViajeValidator - reduce complejidad cognitiva
import {
  TIPO_PERSONAL,
  LIMITE_DIAS_FUTURO,
  VALIDATION_SUGGESTIONS,
} from './ViajeValidatorConstants';

export interface ViajeData {
  cliente?: Cliente;
  tramo?: Tramo;
  vehiculos?: Vehiculo[];
  personal?: Personal[];
  fecha?: Date;
  palets?: number;
  extras?: Extra[];
  observaciones?: string;
  estado?: string;
  ordenCompra?: OrdenCompra;
  tarifaCalculada?: number;
  formulasAplicadas?: Formula[];
}

interface Cliente {
  _id: string;
  nombre: string;
}

interface Tramo {
  _id: string;
  cliente: string | Cliente;
  nombre: string;
}

interface Vehiculo {
  _id: string;
  patente?: string;
  nombre?: string;
  documentacion?: Record<string, Documento>;
}

interface Personal {
  _id: string;
  nombre: string;
  tipo?: string;
  tipoPersonal?: string;
}

interface Extra {
  _id: string;
  concepto: string;
  valor: number;
}

interface OrdenCompra {
  _id: string;
  numero: string;
}

interface Formula {
  _id: string;
  nombre: string;
  formula: string;
}

interface Documento {
  fechaVencimiento?: Date;
  vigente?: boolean;
}

// Helper para validar documentación de vehículos
export const validarDocumentacionVehiculos = (vehiculos: Vehiculo[]) => {
  const vehiculosConProblemas = vehiculos.filter((vehiculo) => {
    const documentos = vehiculo.documentacion || {};
    return Object.values(documentos).some((doc: Documento) => {
      if (doc.fechaVencimiento) {
        return new Date(doc.fechaVencimiento) < new Date();
      }
      return false;
    });
  });

  return {
    vehiculosConProblemas,
    passed: vehiculosConProblemas.length === 0,
    message:
      vehiculosConProblemas.length === 0
        ? 'Documentación de vehículos vigente'
        : `${vehiculosConProblemas.length} vehículo(s) con documentación vencida`,
    details: vehiculosConProblemas.map((v) => `${v.patente || v.nombre}: Documentación vencida`),
    suggestion:
      vehiculosConProblemas.length > 0 ? VALIDATION_SUGGESTIONS.REVISE_DOCUMENTACION : undefined,
  };
};

// Helper para validar choferes
export const validarChoferes = (personal: Personal[]) => {
  const choferes = personal.filter(
    (p) => p.tipo === TIPO_PERSONAL.CHOFER || p.tipoPersonal === TIPO_PERSONAL.CHOFER
  );

  return {
    choferes,
    passed: choferes.length > 0,
    message:
      choferes.length > 0
        ? `${choferes.length} chofer(es) asignado(s)`
        : 'Debe asignar al menos un chofer',
    suggestion: choferes.length === 0 ? VALIDATION_SUGGESTIONS.ASIGNE_CHOFER_PRINCIPAL : undefined,
  };
};

// Helper para validar fecha de viaje
export const validarFechaViaje = (fecha: Date) => {
  const fechaViaje = new Date(fecha);
  const ahora = new Date();
  const diferenciaDias = Math.ceil(
    (fechaViaje.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferenciaDias < 0) {
    return {
      passed: false,
      message: 'La fecha del viaje está en el pasado',
      suggestion: VALIDATION_SUGGESTIONS.VERIFIQUE_FECHA_PASADA,
    };
  }

  if (diferenciaDias > LIMITE_DIAS_FUTURO) {
    return {
      passed: false,
      message: 'La fecha del viaje está muy lejana',
      suggestion: VALIDATION_SUGGESTIONS.VERIFIQUE_FECHA_LEJANA,
    };
  }

  return {
    passed: true,
    message:
      diferenciaDias === 0
        ? 'Viaje programado para hoy'
        : `Viaje programado en ${diferenciaDias} día(s)`,
  };
};

// Helper para validar compatibilidad cliente-tramo
export const validarCompatibilidadClienteTramo = (cliente: Cliente, tramo: Tramo) => {
  const clienteId = typeof cliente === 'string' ? cliente : cliente._id;
  const tramoClienteId = typeof tramo.cliente === 'string' ? tramo.cliente : tramo.cliente?._id;

  return {
    passed: clienteId === tramoClienteId,
    message:
      clienteId === tramoClienteId
        ? 'Cliente y tramo son compatibles'
        : 'El tramo no pertenece al cliente seleccionado',
    suggestion:
      clienteId !== tramoClienteId ? VALIDATION_SUGGESTIONS.SELECCIONE_TRAMO_COMPATIBLE : undefined,
  };
};

// Helper para verificar si un valor es requerido
export const esRequerido = (value: unknown): boolean => {
  return value !== null && value !== undefined && value !== '';
};

// Helper para verificar si es una fecha válida
export const esFechaValida = (fecha: unknown): fecha is Date => {
  return fecha instanceof Date && !isNaN(fecha.getTime());
};

// Helper para verificar si es un número válido
export const esNumeroValido = (numero: unknown): numero is number => {
  return typeof numero === 'number' && !isNaN(numero) && isFinite(numero);
};

// Helper para verificar si es un array válido
export const esArrayValido = (array: unknown): array is unknown[] => {
  return Array.isArray(array) && array.length > 0;
};
