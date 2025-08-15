import { useState, useMemo } from 'react';
import { EstadoPartida } from '../../../types/ordenCompra';
import { PartidaReportData, FiltrosReporte } from '../types';

const applyEstadoFilter = (
  partidas: PartidaReportData[],
  estadoPartida?: EstadoPartida | ''
): PartidaReportData[] => {
  if (!estadoPartida) return partidas;
  return partidas.filter((p) => p.estado === estadoPartida);
};

const applyClienteFilter = (
  partidas: PartidaReportData[],
  cliente?: string
): PartidaReportData[] => {
  if (!cliente) return partidas;
  const clienteLower = cliente.toLowerCase();
  return partidas.filter((p) => p.cliente.toLowerCase().includes(clienteLower));
};

const applyDateFilters = (
  partidas: PartidaReportData[],
  fechaDesde?: Date,
  fechaHasta?: Date
): PartidaReportData[] => {
  let resultado = partidas;

  if (fechaDesde) {
    resultado = resultado.filter((p) => p.fechaCreacion >= fechaDesde);
  }

  if (fechaHasta) {
    resultado = resultado.filter((p) => p.fechaCreacion <= fechaHasta);
  }

  return resultado;
};

const applyAmountFilters = (
  partidas: PartidaReportData[],
  montoMinimo?: number,
  montoMaximo?: number
): PartidaReportData[] => {
  let resultado = partidas;

  if (montoMinimo !== undefined) {
    resultado = resultado.filter((p) => p.montoOriginal >= montoMinimo);
  }

  if (montoMaximo !== undefined) {
    resultado = resultado.filter((p) => p.montoOriginal <= montoMaximo);
  }

  return resultado;
};

const applyVencidaFilter = (
  partidas: PartidaReportData[],
  soloVencidas?: boolean
): PartidaReportData[] => {
  if (!soloVencidas) return partidas;
  return partidas.filter((p) => p.estado === 'vencida');
};

export const usePartidaFilters = (partidas: PartidaReportData[]) => {
  const [filtros, setFiltros] = useState<FiltrosReporte>({});

  const partidasFiltradas = useMemo(() => {
    let resultado = [...partidas];

    resultado = applyEstadoFilter(resultado, filtros.estadoPartida);
    resultado = applyClienteFilter(resultado, filtros.cliente);
    resultado = applyDateFilters(resultado, filtros.fechaDesde, filtros.fechaHasta);
    resultado = applyAmountFilters(resultado, filtros.montoMinimo, filtros.montoMaximo);
    resultado = applyVencidaFilter(resultado, filtros.soloVencidas);

    return resultado;
  }, [partidas, filtros]);

  return {
    filtros,
    setFiltros,
    partidasFiltradas,
  };
};
