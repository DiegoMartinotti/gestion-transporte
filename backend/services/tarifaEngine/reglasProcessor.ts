/**
 * @module services/tarifaEngine/reglasProcessor
 * @description Procesamiento de reglas de negocio para tarifas
 */

import ReglaTarifa from '../../models/ReglaTarifa';
import logger from '../../utils/logger';
import { FormulaContext } from '../../utils/formulaParser';
import { IContextoCalculo, IResultadoCalculo, ReglaTarifaDocument } from './types';

/**
 * Aplica las reglas de negocio al cálculo
 */
export async function aplicarReglas(
  contexto: IContextoCalculo,
  contextoCompleto: FormulaContext,
  resultado: IResultadoCalculo
): Promise<IResultadoCalculo> {
  logger.debug('[TarifaEngine] Aplicando reglas de negocio');

  // Preparar contexto para reglas
  const contextoReglas = prepararContextoReglas(contexto, contextoCompleto, resultado);

  // Obtener reglas aplicables
  const reglas = await ReglaTarifa.findReglasAplicables(contextoReglas, contexto.fecha);

  if (reglas.length === 0) {
    logger.debug('[TarifaEngine] No se encontraron reglas aplicables');
    return resultado;
  }

  logger.info(`[TarifaEngine] Aplicando ${reglas.length} reglas`);

  // Procesar reglas y obtener resultado
  const { valores, reglasAplicadas } = procesarReglas(reglas, resultado);

  return construirResultadoConReglas(resultado, valores, reglasAplicadas);
}

/**
 * Prepara el contexto necesario para la aplicación de reglas
 */
function prepararContextoReglas(
  contexto: IContextoCalculo,
  contextoCompleto: FormulaContext,
  resultado: IResultadoCalculo
) {
  return {
    ...contextoCompleto,
    cliente: contexto.clienteId,
    metodoCalculo: resultado.metodoUtilizado,
    tarifa: resultado.tarifaBase,
    peaje: resultado.peaje,
    total: resultado.total,
  };
}

/**
 * Procesa todas las reglas aplicables y calcula modificaciones
 */
function procesarReglas(reglas: ReglaTarifaDocument[], resultado: IResultadoCalculo) {
  let valores = {
    tarifa: resultado.tarifaBase,
    peaje: resultado.peaje,
    extras: 0,
    total: resultado.total,
  };

  const reglasAplicadas: Array<{
    codigo: string;
    nombre: string;
    modificacion: number;
  }> = [];

  for (const regla of reglas) {
    const valoresAnteriores = { ...valores };
    const resultadoModificado = regla.aplicarModificadores(valores);
    valores = {
      tarifa: resultadoModificado.tarifa || valores.tarifa,
      peaje: resultadoModificado.peaje || valores.peaje,
      extras: resultadoModificado.extras || valores.extras,
      total: resultadoModificado.total || valores.total,
    };

    const modificacion = valores.total - valoresAnteriores.total;

    reglasAplicadas.push({
      codigo: regla.codigo,
      nombre: regla.nombre,
      modificacion: Math.round(modificacion * 100) / 100,
    });

    logger.debug(`[TarifaEngine] Regla ${regla.codigo} aplicada: modificación = ${modificacion}`);

    if (regla.excluirOtrasReglas) {
      logger.debug('[TarifaEngine] Regla excluye otras, deteniendo aplicación');
      break;
    }
  }

  return { valores, reglasAplicadas };
}

/**
 * Construye el resultado final con las reglas aplicadas
 */
function construirResultadoConReglas(
  resultado: IResultadoCalculo,
  valores: { tarifa: number; peaje: number; total: number },
  reglasAplicadas: Array<{ codigo: string; nombre: string; modificacion: number }>
): IResultadoCalculo {
  return {
    ...resultado,
    tarifaBase: Math.round(valores.tarifa * 100) / 100,
    peaje: Math.round(valores.peaje * 100) / 100,
    total: Math.round(valores.total * 100) / 100,
    reglasAplicadas,
  };
}
