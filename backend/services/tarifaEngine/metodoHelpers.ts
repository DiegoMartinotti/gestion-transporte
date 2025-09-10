/**
 * @module services/tarifaEngine/metodoHelpers
 * @description Helpers para obtención de métodos de cálculo y fórmulas
 */

import TarifaMetodo, { ITarifaMetodo } from '../../models/TarifaMetodo';
import FormulasPersonalizadasCliente from '../../models/FormulasPersonalizadasCliente';
import Tramo from '../../models/Tramo';
import { FormulaContext } from '../../utils/formulaParser';
import logger from '../../utils/logger';
import { IContextoCalculo } from './types';

/**
 * Obtiene el método de cálculo apropiado
 */
export async function obtenerMetodoCalculo(
  contexto: IContextoCalculo,
  _contextoCompleto: FormulaContext
): Promise<ITarifaMetodo> {
  logger.debug('[TarifaEngine] Obteniendo método de cálculo');

  // Si se especifica un método, intentar usarlo
  if (contexto.metodoCalculo) {
    const metodo = await TarifaMetodo.findByCodigoActivo(contexto.metodoCalculo);
    if (metodo) {
      return metodo;
    }
    logger.warn(`Método ${contexto.metodoCalculo} no encontrado, buscando alternativas`);
  }

  // Buscar en el tramo
  const tramo = await Tramo.findOne({
    cliente: contexto.clienteId,
    origen: contexto.origenId,
    destino: contexto.destinoId,
  });

  if (tramo) {
    const tarifaVigente = tramo.getTarifaVigente(contexto.fecha, contexto.tipoTramo);
    if (tarifaVigente?.metodoCalculo) {
      // Buscar método por el código del tramo
      const metodo = await TarifaMetodo.findByCodigoActivo(
        tarifaVigente.metodoCalculo.toUpperCase()
      );
      if (metodo) {
        return metodo;
      }

      // Si no existe como método dinámico, crear uno temporal con los valores legacy
      return crearMetodoLegacy(tarifaVigente.metodoCalculo);
    }
  }

  // Método por defecto
  const metodoPorDefecto = await TarifaMetodo.findByCodigoActivo('PALET');
  if (metodoPorDefecto) {
    return metodoPorDefecto;
  }

  // Crear método legacy por defecto
  return crearMetodoLegacy('Palet');
}

/**
 * Obtiene la fórmula aplicable según el contexto
 */
export async function obtenerFormula(
  contexto: IContextoCalculo,
  metodo: ITarifaMetodo
): Promise<string> {
  logger.debug('[TarifaEngine] Obteniendo fórmula aplicable');

  // Buscar fórmula personalizada del cliente
  if (metodo.permiteFormulasPersonalizadas) {
    const formulaPersonalizada = await FormulasPersonalizadasCliente.findOne({
      clienteId: contexto.clienteId,
      activa: true,
      metodoCalculo: metodo.codigo,
      vigenciaDesde: { $lte: contexto.fecha },
      $or: [{ vigenciaHasta: { $gte: contexto.fecha } }, { vigenciaHasta: { $exists: false } }],
      $and: [{ $or: [{ tipoUnidad: contexto.tipoUnidad }, { tipoUnidad: 'Todos' }] }],
    }).sort({ prioridad: -1 });

    if (formulaPersonalizada) {
      logger.info(
        `[TarifaEngine] Usando fórmula personalizada: ${formulaPersonalizada.nombre || formulaPersonalizada._id}`
      );
      await formulaPersonalizada.registrarUso(0); // Se actualizará con el monto real después
      return formulaPersonalizada.formula;
    }
  }

  // Usar fórmula base del método
  return metodo.formulaBase;
}

/**
 * Crea un método legacy temporal para compatibilidad
 */
function crearMetodoLegacy(nombre: string): ITarifaMetodo {
  const formulasLegacy: Record<string, string> = {
    Kilometro: 'Valor * Distancia + Peaje',
    Palet: 'Valor * Palets + Peaje',
    Fijo: 'Valor + Peaje',
  };

  return {
    codigo: nombre.toUpperCase(),
    nombre: nombre,
    descripcion: `Método legacy: ${nombre}`,
    formulaBase: formulasLegacy[nombre] || 'Valor * Cantidad + Peaje',
    variables: [],
    activo: true,
    prioridad: 50,
    requiereDistancia: nombre === 'Kilometro',
    requierePalets: nombre === 'Palet',
    permiteFormulasPersonalizadas: true,
    configuracion: {},
    validarFormula: () => true,
    obtenerVariablesDisponibles: () => [],
  } as unknown as ITarifaMetodo;
}
