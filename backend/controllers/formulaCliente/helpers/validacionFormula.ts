/**
 * Helpers para validación de fórmulas
 */

import FormulasPersonalizadasCliente from '../../../models/FormulasPersonalizadasCliente';
import logger from '../../../utils/logger';

export function necesitaRevalidacion(formula: {
  validacionFormula?: { ultimaValidacion?: Date };
}): boolean {
  if (!formula.validacionFormula?.ultimaValidacion) return true;
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  return formula.validacionFormula.ultimaValidacion < hace30Dias;
}

export function validarCompatibilidadMetodo(
  formula: { formula: string },
  metodo: { obtenerVariablesDisponibles?: () => Array<{ nombre: string }> } | null
): { compatible: boolean; advertencias: string[] } {
  const advertencias: string[] = [];
  if (!metodo) {
    advertencias.push('Método de cálculo no encontrado o inactivo');
    return { compatible: false, advertencias };
  }
  const variablesEnFormula = formula.formula.match(/\b[A-Za-z]\w*\b/g) || [];
  const variablesDisponibles =
    metodo.obtenerVariablesDisponibles?.().map((v: { nombre: string }) => v.nombre) || [];
  const variablesNoEncontradas = variablesEnFormula.filter(
    (variable: string) => !variablesDisponibles.includes(variable)
  );
  if (variablesNoEncontradas.length > 0)
    advertencias.push(`Variables no definidas en el método: ${variablesNoEncontradas.join(', ')}`);
  return { compatible: advertencias.length === 0, advertencias };
}

export async function verificarConflictos(formula: {
  _id: unknown;
  clienteId: unknown;
  metodoCalculo: string;
  tipoUnidad: string;
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
}): Promise<{ tieneConflictos: boolean; conflictos: unknown[] }> {
  try {
    const conflictosPotenciales = await FormulasPersonalizadasCliente.find({
      _id: { $ne: formula._id },
      clienteId: formula.clienteId,
      metodoCalculo: formula.metodoCalculo,
      tipoUnidad: { $in: [formula.tipoUnidad, 'Todos'] },
      activa: true,
      vigenciaDesde: { $lte: formula.vigenciaHasta || new Date('2099-12-31') },
      $or: [
        { vigenciaHasta: { $gte: formula.vigenciaDesde } },
        { vigenciaHasta: { $exists: false } },
      ],
    }).select('nombre vigenciaDesde vigenciaHasta prioridad tipoUnidad');
    return {
      tieneConflictos: conflictosPotenciales.length > 0,
      conflictos: conflictosPotenciales.map((conflicto) => ({
        id: conflicto._id,
        nombre: conflicto.nombre,
        vigencia: { desde: conflicto.vigenciaDesde, hasta: conflicto.vigenciaHasta },
        prioridad: conflicto.prioridad,
        tipoUnidad: conflicto.tipoUnidad,
      })),
    };
  } catch (error) {
    logger.error('[FormulasCliente] Error al verificar conflictos:', error);
    return { tieneConflictos: false, conflictos: [] };
  }
}
