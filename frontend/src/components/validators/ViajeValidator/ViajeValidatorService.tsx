import { BaseValidator, ValidationRule } from '../BaseValidator';

const VALIDATION_CATEGORIES = {
  DATOS_BASICOS: 'Datos Básicos',
  VEHICULOS: 'Vehículos',
  PERSONAL: 'Personal',
  DOCUMENTACION: 'Documentación',
} as const;

interface ClienteData {
  _id?: string;
  [key: string]: unknown;
}

interface TramoData {
  cliente?: string | ClienteData;
  [key: string]: unknown;
}

interface ViajeData {
  cliente?: string | ClienteData;
  tramo?: TramoData;
  vehiculos?: Record<string, unknown>[];
  personal?: Record<string, unknown>[];
  fecha?: Date;
  palets?: number;
  extras?: Record<string, unknown>[];
  observaciones?: string;
  estado?: string;
  ordenCompra?: Record<string, unknown>;
  tarifaCalculada?: number;
  formulasAplicadas?: Record<string, unknown>[];
}

export class ViajeValidatorService extends BaseValidator<ViajeData> {
  private getBasicValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'cliente-required',
        category: VALIDATION_CATEGORIES.DATOS_BASICOS,
        name: 'Cliente Requerido',
        description: 'El viaje debe tener un cliente asignado',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isRequired(data.cliente),
          message: data.cliente ? 'Cliente asignado correctamente' : 'Debe seleccionar un cliente',
          suggestion: !data.cliente ? 'Seleccione un cliente de la lista' : undefined,
        }),
      },
      {
        id: 'tramo-required',
        category: VALIDATION_CATEGORIES.DATOS_BASICOS,
        name: 'Tramo Requerido',
        description: 'El viaje debe tener un tramo definido',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isRequired(data.tramo),
          message: data.tramo ? 'Tramo asignado correctamente' : 'Debe seleccionar un tramo',
          suggestion: !data.tramo
            ? 'Seleccione un tramo de la lista de rutas disponibles'
            : undefined,
        }),
      },
      {
        id: 'fecha-required',
        category: VALIDATION_CATEGORIES.DATOS_BASICOS,
        name: 'Fecha Requerida',
        description: 'El viaje debe tener una fecha programada',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidDate(data.fecha),
          message: data.fecha
            ? 'Fecha asignada correctamente'
            : 'Debe establecer una fecha para el viaje',
          suggestion: !data.fecha ? 'Seleccione la fecha programada del viaje' : undefined,
        }),
      },
      {
        id: 'palets-required',
        category: VALIDATION_CATEGORIES.DATOS_BASICOS,
        name: 'Cantidad de Palets',
        description: 'Debe especificar la cantidad de palets a transportar',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidNumber(data.palets) && (data.palets ?? 0) > 0,
          message:
            data.palets && data.palets > 0
              ? `${data.palets} palets especificados`
              : 'Debe especificar una cantidad válida de palets',
          suggestion:
            !data.palets || data.palets <= 0
              ? 'Ingrese la cantidad de palets a transportar (mayor a 0)'
              : undefined,
        }),
      },
    ];
  }

  private getVehicleValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'vehiculos-required',
        category: 'Vehículos',
        name: 'Vehículos Asignados',
        description: 'El viaje debe tener al menos un vehículo asignado',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidArray(data.vehiculos),
          message:
            data.vehiculos && data.vehiculos.length > 0
              ? `${data.vehiculos.length} vehículo(s) asignado(s)`
              : 'Debe asignar al menos un vehículo',
          suggestion:
            !data.vehiculos || data.vehiculos.length === 0
              ? 'Seleccione los vehículos que realizarán el viaje'
              : undefined,
        }),
      },
      {
        id: 'vehiculos-documentacion',
        category: 'Vehículos',
        name: 'Documentación de Vehículos',
        description: 'Los vehículos deben tener documentación vigente',
        severity: 'warning',
        required: false,
        validator: (data) => {
          if (!this.isValidArray(data.vehiculos)) {
            return { passed: false, message: 'No hay vehículos para validar' };
          }

          const vehiculosConProblemas = (data.vehiculos ?? []).filter((vehiculo) => {
            const documentos = vehiculo.documentacion || {};
            return Object.values(documentos).some((doc: Record<string, unknown>) => {
              if (doc.fechaVencimiento) {
                return new Date(doc.fechaVencimiento as string) < new Date();
              }
              return false;
            });
          });

          return {
            passed: vehiculosConProblemas.length === 0,
            message:
              vehiculosConProblemas.length === 0
                ? 'Documentación de vehículos vigente'
                : `${vehiculosConProblemas.length} vehículo(s) con documentación vencida`,
            details: vehiculosConProblemas.map(
              (v) => `${v.patente || v.nombre}: Documentación vencida`
            ),
            suggestion:
              vehiculosConProblemas.length > 0
                ? 'Revise y actualice la documentación de los vehículos'
                : undefined,
          };
        },
      },
    ];
  }

  private getPersonalValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'personal-required',
        category: 'Personal',
        name: 'Personal Asignado',
        description: 'El viaje debe tener personal asignado',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidArray(data.personal),
          message:
            data.personal && data.personal.length > 0
              ? `${data.personal.length} persona(s) asignada(s)`
              : 'Debe asignar personal al viaje',
          suggestion:
            !data.personal || data.personal.length === 0
              ? 'Asigne al menos un chofer al viaje'
              : undefined,
        }),
      },
      {
        id: 'chofer-requerido',
        category: 'Personal',
        name: 'Chofer Principal',
        description: 'Debe haber al menos un chofer asignado',
        severity: 'error',
        required: true,
        validator: (data) => {
          if (!this.isValidArray(data.personal)) {
            return { passed: false, message: 'No hay personal asignado' };
          }

          const choferes = (data.personal ?? []).filter(
            (p) => p.tipo === 'CHOFER' || p.tipoPersonal === 'CHOFER'
          );
          return {
            passed: choferes.length > 0,
            message:
              choferes.length > 0
                ? `${choferes.length} chofer(es) asignado(s)`
                : 'Debe asignar al menos un chofer',
            suggestion:
              choferes.length === 0 ? 'Asigne un chofer principal para el viaje' : undefined,
          };
        },
      },
    ];
  }

  private getSchedulingValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'fecha-futura',
        category: 'Programación',
        name: 'Fecha Válida',
        description: 'La fecha del viaje debe ser válida',
        severity: 'warning',
        required: false,
        validator: (data) => {
          if (!this.isValidDate(data.fecha)) {
            return { passed: false, message: 'No hay fecha asignada' };
          }

          const fechaViaje = new Date(data.fecha ?? new Date());
          const ahora = new Date();
          const diferenciaDias = Math.ceil(
            (fechaViaje.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diferenciaDias < 0) {
            return {
              passed: false,
              message: 'La fecha del viaje está en el pasado',
              suggestion: 'Verifique si es correcto programar un viaje en fecha pasada',
            };
          }

          if (diferenciaDias > 365) {
            return {
              passed: false,
              message: 'La fecha del viaje está muy lejana',
              suggestion: 'Verifique la fecha del viaje',
            };
          }

          return {
            passed: true,
            message:
              diferenciaDias === 0
                ? 'Viaje programado para hoy'
                : `Viaje programado en ${diferenciaDias} día(s)`,
          };
        },
      },
    ];
  }

  private getCalculationValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'tarifa-calculada',
        category: 'Cálculos',
        name: 'Tarifa Calculada',
        description: 'El viaje debe tener una tarifa calculada',
        severity: 'warning',
        required: false,
        validator: (data) => ({
          passed: this.isValidNumber(data.tarifaCalculada) && (data.tarifaCalculada ?? 0) > 0,
          message:
            data.tarifaCalculada && data.tarifaCalculada > 0
              ? `Tarifa calculada: $${data.tarifaCalculada.toLocaleString()}`
              : 'No hay tarifa calculada',
          suggestion:
            !data.tarifaCalculada || data.tarifaCalculada <= 0
              ? 'Calcule la tarifa del viaje'
              : undefined,
        }),
      },
    ];
  }

  private getCompatibilityValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'cliente-tramo-compatibilidad',
        category: 'Compatibilidad',
        name: 'Cliente-Tramo Compatible',
        description: 'El tramo debe pertenecer al cliente seleccionado',
        severity: 'error',
        required: true,
        validator: (data) => {
          if (!this.isRequired(data.cliente) || !this.isRequired(data.tramo)) {
            return { passed: false, message: 'Faltan datos para validar compatibilidad' };
          }

          const clienteId =
            typeof data.cliente === 'string' ? data.cliente : (data.cliente as ClienteData)?._id;
          const tramoClienteId =
            typeof data.tramo?.cliente === 'string'
              ? data.tramo.cliente
              : (data.tramo?.cliente as ClienteData)?._id;

          return {
            passed: clienteId === tramoClienteId,
            message:
              clienteId === tramoClienteId
                ? 'Cliente y tramo son compatibles'
                : 'El tramo no pertenece al cliente seleccionado',
            suggestion:
              clienteId !== tramoClienteId
                ? 'Seleccione un tramo que pertenezca al cliente elegido'
                : undefined,
          };
        },
      },
    ];
  }

  getValidationRules(): ValidationRule<ViajeData>[] {
    return [
      ...this.getBasicValidationRules(),
      ...this.getVehicleValidationRules(),
      ...this.getPersonalValidationRules(),
      ...this.getSchedulingValidationRules(),
      ...this.getCalculationValidationRules(),
      ...this.getCompatibilityValidationRules(),
    ];
  }
}

export type { ViajeData };
