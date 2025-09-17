/**
 * @module services/tramo/TramoValidationHelpers
 * @description Helpers para validación de datos de tramos
 */

import Cliente from '../../models/Cliente';
import Site from '../../models/Site';
import { ITarifaHistorica } from '../../models/Tramo';
import { fechasSuperpuestas } from '../../utils/tramoValidator';

/**
 * Interfaz para datos requeridos de tramo
 */
export interface RequiredTramoFields {
  origen?: unknown;
  destino?: unknown;
  cliente?: unknown;
  tarifasHistoricas?: ITarifaHistorica[];
}

/**
 * Valida campos requeridos básicos de un tramo
 */
export function validateRequiredFields(data: RequiredTramoFields): void {
  if (!data) {
    throw new Error('Los datos del tramo son requeridos');
  }

  validateRequiredField(data.origen, 'El sitio origen es obligatorio');
  validateRequiredField(data.destino, 'El sitio destino es obligatorio');
  validateRequiredField(data.cliente, 'El cliente es obligatorio');
  validateOrigenDestinoDifferent(data.origen, data.destino);
}

/**
 * Valida un campo requerido individual
 */
function validateRequiredField(value: unknown, errorMessage: string): void {
  if (value !== undefined && !value) {
    throw new Error(errorMessage);
  }
}

/**
 * Valida que origen y destino sean diferentes
 */
function validateOrigenDestinoDifferent(origen: unknown, destino: unknown): void {
  if (origen && destino && origen.toString() === destino.toString()) {
    throw new Error('El origen y el destino no pueden ser el mismo sitio');
  }
}

/**
 * Valida que las referencias de cliente y sitios existan
 */
export async function validateReferences(data: RequiredTramoFields): Promise<void> {
  if (data.cliente) {
    const clienteExiste = await Cliente.findById(data.cliente);
    if (!clienteExiste) {
      throw new Error('El cliente especificado no existe');
    }
  }

  if (data.origen) {
    const origenExiste = await Site.findById(data.origen);
    if (!origenExiste) {
      throw new Error('El sitio origen especificado no existe');
    }
  }

  if (data.destino) {
    const destinoExiste = await Site.findById(data.destino);
    if (!destinoExiste) {
      throw new Error('El sitio destino especificado no existe');
    }
  }
}

/**
 * Valida que las tarifas históricas no tengan conflictos de fechas
 */
export function validateTarifasHistoricas(tarifas: ITarifaHistorica[]): void {
  // Validar que cada tarifa tenga vigenciaHasta >= vigenciaDesde
  for (const tarifa of tarifas) {
    if (tarifa.vigenciaHasta < tarifa.vigenciaDesde) {
      throw new Error('La fecha de fin de vigencia debe ser mayor o igual a la fecha de inicio');
    }
  }

  // Verificar superposición de fechas entre tarifas del mismo tipo y método
  for (let i = 0; i < tarifas.length - 1; i++) {
    for (let j = i + 1; j < tarifas.length; j++) {
      const tarifaA = tarifas[i];
      const tarifaB = tarifas[j];

      // Si el tipo o método de cálculo es diferente, pueden coexistir
      if (tarifaA.tipo !== tarifaB.tipo || tarifaA.metodoCalculo !== tarifaB.metodoCalculo) {
        continue;
      }

      // Comprobar si hay superposición usando la función utilitaria
      if (
        fechasSuperpuestas(
          tarifaA.vigenciaDesde,
          tarifaA.vigenciaHasta,
          tarifaB.vigenciaDesde,
          tarifaB.vigenciaHasta
        )
      ) {
        throw new Error(
          `Existen tarifas con el mismo tipo (${tarifaA.tipo}) y método de cálculo (${tarifaA.metodoCalculo}) con fechas que se superponen`
        );
      }
    }
  }
}
