/**
 * Helpers para calcular eficiencia de fórmulas
 */

import { calcularDiasTranscurridos } from './calculosFormula';

export function calcularFactorUso(formula: {
  estadisticas: { vecesUtilizada: number };
  vigenciaDesde: Date;
}): { puntuacion: number; factor?: string } {
  const diasVigente = calcularDiasTranscurridos(formula, new Date());
  const usosPorDia = diasVigente > 0 ? formula.estadisticas.vecesUtilizada / diasVigente : 0;
  return usosPorDia > 0.1 ? { puntuacion: 20, factor: 'Uso regular' } : { puntuacion: 0 };
}

export function calcularFactorValidacion(formula: { validacionFormula?: { esValida?: boolean } }): {
  puntuacion: number;
  factor: string;
} {
  return formula.validacionFormula?.esValida
    ? { puntuacion: 15, factor: 'Fórmula válida' }
    : { puntuacion: -15, factor: 'Fórmula inválida' };
}

export function calcularFactorEstabilidad(formula: {
  estadisticas: { vecesUtilizada: number };
  historialCambios: Array<{ fecha: Date }>;
}): { puntuacion: number; factor?: string } {
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const cambiosRecientes = formula.historialCambios.filter(
    (cambio: { fecha: Date }) => cambio.fecha >= hace30Dias
  ).length;
  if (cambiosRecientes === 0 && formula.estadisticas.vecesUtilizada > 0)
    return { puntuacion: 10, factor: 'Fórmula estable' };
  if (cambiosRecientes > 3) return { puntuacion: -10, factor: 'Cambios frecuentes' };
  return { puntuacion: 0 };
}

export function calcularEficienciaFormula(formula: {
  estadisticas: { vecesUtilizada: number };
  validacionFormula?: { esValida?: boolean };
  nombre?: string;
  descripcion?: string;
  historialCambios: Array<{ fecha: Date }>;
  vigenciaDesde: Date;
}): { puntuacion: number; categoria: string; factores: string[] } {
  let puntuacion = 50;
  const factores: string[] = [];

  const factorUso = calcularFactorUso(formula);
  puntuacion += factorUso.puntuacion;
  if (factorUso.factor) factores.push(factorUso.factor);

  const factorValidacion = calcularFactorValidacion(formula);
  puntuacion += factorValidacion.puntuacion;
  factores.push(factorValidacion.factor);

  if (formula.nombre && formula.descripcion) {
    puntuacion += 10;
    factores.push('Documentación completa');
  }

  const factorEstabilidad = calcularFactorEstabilidad(formula);
  puntuacion += factorEstabilidad.puntuacion;
  if (factorEstabilidad.factor) factores.push(factorEstabilidad.factor);

  let categoria: string;
  if (puntuacion >= 80) categoria = 'Excelente';
  else if (puntuacion >= 65) categoria = 'Buena';
  else if (puntuacion >= 50) categoria = 'Regular';
  else if (puntuacion >= 35) categoria = 'Necesita mejora';
  else categoria = 'Problemática';

  return {
    puntuacion: Math.max(0, Math.min(100, puntuacion)),
    categoria,
    factores,
  };
}
