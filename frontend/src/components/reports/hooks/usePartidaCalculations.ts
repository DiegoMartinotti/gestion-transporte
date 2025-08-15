import { useMemo } from 'react';
import { PartidaReportData, ResumenFinanciero } from '../types';

const calculateTotals = (partidas: PartidaReportData[]) => {
  const totalPartidas = partidas.length;
  const montoTotalOriginal = partidas.reduce((sum, p) => sum + p.montoOriginal, 0);
  const montoTotalPagado = partidas.reduce((sum, p) => sum + p.importePagado, 0);
  const montoTotalPendiente = partidas.reduce((sum, p) => sum + p.importePendiente, 0);

  return {
    totalPartidas,
    montoTotalOriginal,
    montoTotalPagado,
    montoTotalPendiente,
  };
};

const calculateStatusCounts = (partidas: PartidaReportData[]) => {
  const partidasAbiertas = partidas.filter((p) => p.estado === 'abierta').length;
  const partidasPagadas = partidas.filter((p) => p.estado === 'pagada').length;
  const partidasVencidas = partidas.filter((p) => p.estado === 'vencida').length;

  return {
    partidasAbiertas,
    partidasPagadas,
    partidasVencidas,
  };
};

const calculateAveragePaymentTime = (partidas: PartidaReportData[]): number => {
  const partidasConPago = partidas.filter((p) => p.fechaPago);

  if (partidasConPago.length === 0) return 0;

  const totalDays = partidasConPago.reduce((sum, p) => {
    if (p.fechaPago && p.fechaCreacion) {
      const daysDiff = (p.fechaPago.getTime() - p.fechaCreacion.getTime()) / (1000 * 60 * 60 * 24);
      return sum + daysDiff;
    }
    return sum;
  }, 0);

  return totalDays / partidasConPago.length;
};

const calculatePercentagePaid = (montoTotalOriginal: number, montoTotalPagado: number): number => {
  return montoTotalOriginal > 0 ? (montoTotalPagado / montoTotalOriginal) * 100 : 0;
};

export const usePartidaCalculations = (partidas: PartidaReportData[]) => {
  const resumen = useMemo((): ResumenFinanciero | null => {
    if (partidas.length === 0) return null;

    const totals = calculateTotals(partidas);
    const statusCounts = calculateStatusCounts(partidas);
    const promedioTiempoPago = calculateAveragePaymentTime(partidas);
    const porcentajePagado = calculatePercentagePaid(
      totals.montoTotalOriginal,
      totals.montoTotalPagado
    );

    return {
      ...totals,
      ...statusCounts,
      porcentajePagado,
      promedioTiempoPago,
    };
  }, [partidas]);

  return { resumen };
};
