import { useMemo } from 'react';
import { IResultadoSimulacion } from '../../types/tarifa';

export const useTarifaSimulatorData = (resultados: IResultadoSimulacion[]) => {
  const chartData = useMemo(() => {
    return resultados.map((resultado) => ({
      nombre: resultado.escenario,
      original: resultado.valoresOriginales.total,
      final: resultado.valoresFinales.total,
      diferencia: resultado.diferencia.total,
    }));
  }, [resultados]);

  const pieData = useMemo(() => {
    const incrementos = resultados.filter((r) => r.diferencia.total > 0).length;
    const decrementos = resultados.filter((r) => r.diferencia.total < 0).length;
    const sinCambios = resultados.filter((r) => r.diferencia.total === 0).length;

    return [
      { name: 'Incrementos', value: incrementos, color: '#ff6b6b' },
      { name: 'Decrementos', value: decrementos, color: '#51cf66' },
      { name: 'Sin Cambios', value: sinCambios, color: '#868e96' },
    ];
  }, [resultados]);

  const estadisticas = useMemo(() => {
    if (resultados.length === 0) return null;

    const totalOriginal = resultados.reduce((sum, r) => sum + r.valoresOriginales.total, 0);
    const totalFinal = resultados.reduce((sum, r) => sum + r.valoresFinales.total, 0);
    const diferenciaTotalAbs = Math.abs(totalFinal - totalOriginal);
    const diferenciaTotalPct = ((totalFinal - totalOriginal) / totalOriginal) * 100;

    const mayorIncremento = resultados.reduce((max, r) =>
      r.diferencia.total > max.diferencia.total ? r : max
    );

    const mayorDecremento = resultados.reduce((min, r) =>
      r.diferencia.total < min.diferencia.total ? r : min
    );

    return {
      totalEscenarios: resultados.length,
      totalOriginal,
      totalFinal,
      diferenciaTotalAbs,
      diferenciaTotalPct,
      mayorIncremento,
      mayorDecremento,
      promedioVariacion:
        resultados.reduce((sum, r) => sum + r.diferencia.porcentaje, 0) / resultados.length,
    };
  }, [resultados]);

  return { chartData, pieData, estadisticas };
};