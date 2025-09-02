import { useState, useEffect, useCallback } from 'react';
import { EstadoPartida } from '../../../types/ordenCompra';

interface PartidaData {
  numero: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaVencimiento?: Date;
}

interface EstadisticasPartidas {
  totalPartidas: number;
  abiertas: number;
  pagadas: number;
  vencidas: number;
  montoTotal: number;
  montoPagado: number;
  montoPendiente: number;
  porcentajePagado: number;
}

export const usePartidaCalculator = (
  partidas: PartidaData[],
  onStateChange?: (partidaNumero: string, nuevoEstado: EstadoPartida) => void
) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPartidas>({
    totalPartidas: 0,
    abiertas: 0,
    pagadas: 0,
    vencidas: 0,
    montoTotal: 0,
    montoPagado: 0,
    montoPendiente: 0,
    porcentajePagado: 0,
  });

  const calcularEstadisticas = useCallback(() => {
    const ahora = new Date();

    const stats = partidas.reduce(
      (acc, partida) => {
        acc.totalPartidas++;
        acc.montoTotal += partida.montoOriginal;
        acc.montoPagado += partida.importePagado;
        acc.montoPendiente += partida.importePendiente;

        switch (partida.estado) {
          case 'abierta':
            acc.abiertas++;
            if (partida.fechaVencimiento && partida.fechaVencimiento < ahora) {
              acc.vencidas++;
            }
            break;
          case 'pagada':
            acc.pagadas++;
            break;
        }

        return acc;
      },
      {
        totalPartidas: 0,
        abiertas: 0,
        pagadas: 0,
        vencidas: 0,
        montoTotal: 0,
        montoPagado: 0,
        montoPendiente: 0,
        porcentajePagado: 0,
      }
    );

    stats.porcentajePagado =
      stats.montoTotal > 0 ? (stats.montoPagado / stats.montoTotal) * 100 : 0;

    setEstadisticas(stats);
  }, [partidas]);

  const calcularNuevoEstado = useCallback((partida: PartidaData): EstadoPartida => {
    const tolerancia = 0.01; // Tolerancia para diferencias de centavos

    if (Math.abs(partida.importePendiente) <= tolerancia) {
      return 'pagada';
    } else if (partida.importePendiente > 0) {
      const ahora = new Date();
      if (partida.fechaVencimiento && partida.fechaVencimiento < ahora) {
        return 'vencida';
      }
      return 'abierta';
    }

    return partida.estado;
  }, []);

  const actualizarEstadosAutomatico = useCallback(() => {
    partidas.forEach((partida) => {
      const nuevoEstado = calcularNuevoEstado(partida);
      if (nuevoEstado !== partida.estado && onStateChange) {
        onStateChange(partida.numero, nuevoEstado);
      }
    });
  }, [partidas, calcularNuevoEstado, onStateChange]);

  useEffect(() => {
    calcularEstadisticas();
  }, [calcularEstadisticas]);

  return {
    estadisticas,
    calcularNuevoEstado,
    actualizarEstadosAutomatico,
  };
};
