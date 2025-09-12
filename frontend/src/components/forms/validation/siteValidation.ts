import { CreateSiteData } from '../../../services/siteService';
import { Site } from '../../../types';

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
  site: Site | CreateSiteData | { cliente: { _id: string } } | null | undefined
): CreateSiteData => {
  if (!site) {
    return {
      nombre: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
      pais: 'Argentina',
      cliente: '',
      coordenadas: { lat: 0, lng: 0 },
      contacto: '',
      telefono: '',
      activo: true,
    };
  }

  return {
    nombre: 'nombre' in site ? site.nombre : '',
    direccion: 'direccion' in site ? site.direccion : '',
    ciudad: 'localidad' in site ? site.localidad : 'ciudad' in site ? site.ciudad : '',
    provincia: 'provincia' in site ? site.provincia : '',
    codigoPostal: '',
    pais: 'Argentina',
    cliente: typeof site.cliente === 'string' ? site.cliente : site.cliente?._id || '',
    coordenadas: 'coordenadas' in site ? site.coordenadas : { lat: 0, lng: 0 },
    contacto: '',
    telefono: '',
    activo: true,
  };
};

export const hasValidCoordinates = (coordenadas?: { lat: number; lng: number }) => {
  return coordenadas?.lat !== 0 && coordenadas?.lng !== 0;
};
