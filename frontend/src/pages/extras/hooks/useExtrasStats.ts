import { useMemo } from 'react';
import { Extra } from '../../../services/extraService';

export const useExtrasStats = (extras: Extra[]) => {
  return useMemo(() => {
    const now = new Date();
    
    const vigentesCount = extras.filter((extra) => {
      const desde = new Date(extra.vigenciaDesde);
      const hasta = new Date(extra.vigenciaHasta);
      return now >= desde && now <= hasta;
    }).length;

    const vencidosCount = extras.filter((extra) => {
      const hasta = new Date(extra.vigenciaHasta);
      return now > hasta;
    }).length;

    const pendientesCount = extras.filter((extra) => {
      const desde = new Date(extra.vigenciaDesde);
      return now < desde;
    }).length;

    return {
      vigentesCount,
      vencidosCount,
      pendientesCount,
      totalCount: extras.length,
    };
  }, [extras]);
};