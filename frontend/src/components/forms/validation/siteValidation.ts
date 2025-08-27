import { CreateSiteData } from '../../../services/siteService';

export const siteValidationRules = {
  nombre: (value: string) => (!value ? 'El nombre es requerido' : null),
  direccion: (value: string) => (!value ? 'La dirección es requerida' : null),
  ciudad: (value: string) => (!value ? 'La ciudad es requerida' : null),
  provincia: (value: string) => (!value ? 'La provincia es requerida' : null),
  pais: (value: string) => (!value ? 'El país es requerido' : null),
  cliente: (value: string) => (!value ? 'Debe seleccionar un cliente' : null),
  coordenadas: {
    lat: (value: number) => (value === 0 ? 'Las coordenadas son requeridas' : null),
    lng: (value: number) => (value === 0 ? 'Las coordenadas son requeridas' : null),
  },
};

export const getInitialValues = (
  site: CreateSiteData | { cliente: { _id: string } } | null
): CreateSiteData => ({
  nombre: site?.nombre || '',
  direccion: site?.direccion || '',
  ciudad: site?.localidad || '',
  provincia: site?.provincia || '',
  codigoPostal: '',
  pais: 'Argentina',
  cliente: typeof site?.cliente === 'string' ? site.cliente : site?.cliente?._id || '',
  coordenadas: site?.coordenadas || { lat: 0, lng: 0 },
  contacto: '',
  telefono: '',
  activo: true,
});

export const hasValidCoordinates = (coordenadas?: { lat: number; lng: number }) => {
  return coordenadas?.lat !== 0 && coordenadas?.lng !== 0;
};
