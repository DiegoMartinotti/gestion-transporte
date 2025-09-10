/**
 * @module services/tarifaEngine/calculoHelpers
 * @description Helpers para cálculo de tarifa base y desglose
 */

import Tramo from '../../models/Tramo';
import { ITarifaMetodo } from '../../models/TarifaMetodo';
import { calcularTarifaConContexto, FormulaContext } from '../../utils/formulaParser';
import logger from '../../utils/logger';
import { IResultadoCalculo } from './types';

/**
 * Calcula la tarifa base usando la fórmula
 */
export async function calcularTarifaBase(
  contexto: FormulaContext,
  formula: string,
  metodo: ITarifaMetodo
): Promise<IResultadoCalculo> {
  logger.debug('[TarifaEngine] Calculando tarifa base con fórmula:', formula);

  // Obtener valores de tarifa del tramo si es necesario
  if (!contexto.Valor) {
    const tramo = await Tramo.findOne({
      cliente: contexto.TipoCliente,
      origen: contexto.Fecha,
      destino: contexto.DiaSemana,
    });

    if (tramo) {
      const tarifaVigente = tramo.getTarifaVigente(contexto.Fecha as Date);
      if (tarifaVigente) {
        contexto.Valor = tarifaVigente.valor;
        contexto.Peaje = tarifaVigente.valorPeaje;
      }
    }
  }

  // Calcular usando la fórmula
  const resultado = calcularTarifaConContexto(contexto, formula);

  // Construir resultado completo
  const resultadoCompleto: IResultadoCalculo = {
    ...resultado,
    metodoUtilizado: metodo.codigo,
    formulaAplicada: formula,
    contextoUtilizado: contexto,
    advertencias: [],
    cacheUtilizado: false,
  };

  // Agregar advertencias si hay valores inusuales
  if (resultado.total === 0) {
    resultadoCompleto.advertencias?.push('El cálculo resultó en un total de 0');
  }

  if (!contexto.Valor || contexto.Valor === 0) {
    resultadoCompleto.advertencias?.push('No se encontró valor de tarifa en el tramo');
  }

  return resultadoCompleto;
}

/**
 * Genera el desglose detallado del cálculo
 */
export function generarDesgloseCalculo(
  contexto: FormulaContext,
  resultado: IResultadoCalculo
): Array<{ etapa: string; valor: number; descripcion: string }> {
  const desglose = [];

  // Tarifa base
  desglose.push({
    etapa: 'Tarifa Base',
    valor: resultado.tarifaBase,
    descripcion: `Calculado con método ${resultado.metodoUtilizado}`,
  });

  // Peaje
  if (resultado.peaje > 0) {
    desglose.push({
      etapa: 'Peaje',
      valor: resultado.peaje,
      descripcion: 'Costo de peaje incluido',
    });
  }

  // Reglas aplicadas
  if (resultado.reglasAplicadas && resultado.reglasAplicadas.length > 0) {
    for (const regla of resultado.reglasAplicadas) {
      desglose.push({
        etapa: `Regla: ${regla.nombre}`,
        valor: regla.modificacion,
        descripcion: `Modificación aplicada por regla ${regla.codigo}`,
      });
    }
  }

  // Total
  desglose.push({
    etapa: 'Total Final',
    valor: resultado.total,
    descripcion: 'Suma de todos los componentes',
  });

  return desglose;
}

/**
 * Genera un resultado de error
 */
export function generarResultadoError(mensaje: string): IResultadoCalculo {
  return {
    tarifaBase: 0,
    peaje: 0,
    total: 0,
    metodoUtilizado: 'ERROR',
    formulaAplicada: '',
    advertencias: [mensaje],
    cacheUtilizado: false,
  };
}
