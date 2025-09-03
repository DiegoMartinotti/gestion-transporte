import { Extra } from '../services/extraService';

export interface VigenciaStatus {
  status: 'pendiente' | 'vigente' | 'vencido';
  color: 'blue' | 'green' | 'red';
  text: string;
}

export const getVigenciaStatus = (extra: Extra): VigenciaStatus => {
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

export const filterExtrasBySearch = (extras: Extra[], searchTerm: string): Extra[] => {
  return extras.filter(
    (extra) =>
      extra.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      extra.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ''
  );
};
