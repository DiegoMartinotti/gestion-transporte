/**
 * Helpers para cálculos de fórmulas
 */

export function calcularDiasTranscurridos(formula: { vigenciaDesde: Date }, fecha: Date): number {
  const diferencia = fecha.getTime() - new Date(formula.vigenciaDesde).getTime();
  return Math.max(0, Math.floor(diferencia / (1000 * 60 * 60 * 24)));
}

export function calcularDiasRestantes(
  formula: { vigenciaHasta?: Date },
  fecha: Date
): number | null {
  if (!formula.vigenciaHasta) return null;
  const diferencia = new Date(formula.vigenciaHasta).getTime() - fecha.getTime();
  return Math.max(0, Math.ceil(diferencia / (1000 * 60 * 60 * 24)));
}

export function esFormulaVigente(
  formula: { activa: boolean; vigenciaDesde: Date; vigenciaHasta?: Date },
  fecha: Date
): boolean {
  return (
    formula.activa &&
    formula.vigenciaDesde <= fecha &&
    (!formula.vigenciaHasta || formula.vigenciaHasta >= fecha)
  );
}

export function calcularFrecuenciaUso(formula: {
  estadisticas: { ultimoUso?: Date; vecesUtilizada: number };
  vigenciaDesde: Date;
}): string {
  if (!formula.estadisticas.ultimoUso) return 'Nunca utilizada';
  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  if (diasVigente === 0) return 'Recién creada';
  const usosPorDia = formula.estadisticas.vecesUtilizada / diasVigente;
  const diasDesdeUltimoUso = Math.floor(
    (new Date().getTime() - formula.estadisticas.ultimoUso.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (usosPorDia >= 1) return 'Uso diario';
  if (usosPorDia >= 0.14) return 'Uso semanal';
  if (usosPorDia >= 0.03) return 'Uso mensual';
  return diasDesdeUltimoUso > 30 ? 'Uso esporádico' : 'Uso reciente';
}
