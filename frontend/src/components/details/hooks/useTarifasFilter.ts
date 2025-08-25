import { useMemo } from 'react';
import { TarifaHistorica, TarifaStatus } from '../TramoDetail.types';

export const useTarifasFilter = (tarifasHistoricas: TarifaHistorica[]) => {
  const { tarifasVigentes, tarifasPasadas, tarifasFuturas } = useMemo(() => {
    const now = new Date();

    const vigentes = tarifasHistoricas.filter((tarifa) => {
      const desde = new Date(tarifa.vigenciaDesde);
      const hasta = new Date(tarifa.vigenciaHasta);
      return desde <= now && hasta >= now;
    });

    const pasadas = tarifasHistoricas.filter((tarifa) => {
      const hasta = new Date(tarifa.vigenciaHasta);
      return hasta < now;
    });

    const futuras = tarifasHistoricas.filter((tarifa) => {
      const desde = new Date(tarifa.vigenciaDesde);
      return desde > now;
    });

    return { tarifasVigentes: vigentes, tarifasPasadas: pasadas, tarifasFuturas: futuras };
  }, [tarifasHistoricas]);

  const getTarifaStatus = (tarifa: TarifaHistorica): TarifaStatus => {
    const now = new Date();
    const desde = new Date(tarifa.vigenciaDesde);
    const hasta = new Date(tarifa.vigenciaHasta);
    const vigente = desde <= now && hasta >= now;

    return {
      vigente,
      color: vigente ? 'green' : 'gray',
      label: vigente ? 'Vigente' : 'No vigente',
    };
  };

  return { tarifasVigentes, tarifasPasadas, tarifasFuturas, getTarifaStatus };
};
