import { Extra } from '../../../services/extraService';

export const TIPOS_EXTRA = ['PEAJE', 'COMBUSTIBLE', 'ESTADIA', 'CARGA_DESCARGA', 'SEGURO', 'OTROS'];

export const getVigenciaStatus = (extra: Extra) => {
  const now = new Date();
  const desde = new Date(extra.vigenciaDesde);
  const hasta = new Date(extra.vigenciaHasta);

  if (now < desde) {
    return { status: 'pendiente', color: 'blue', text: 'Pendiente' };
  } else if (now > hasta) {
    return { status: 'vencido', color: 'red', text: 'Vencido' };
  } else {
    return { status: 'vigente', color: 'green', text: 'Vigente' };
  }
};

export const getTipoBadgeColor = (tipo: string) => {
  switch (tipo) {
    case 'PEAJE':
      return 'blue';
    case 'COMBUSTIBLE':
      return 'orange';
    case 'ESTADIA':
      return 'yellow';
    case 'CARGA_DESCARGA':
      return 'violet';
    case 'SEGURO':
      return 'green';
    case 'OTROS':
      return 'gray';
    default:
      return 'gray';
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};