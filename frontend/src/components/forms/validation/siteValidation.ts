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

type SiteLike = Partial<Site> & Partial<CreateSiteData> & { cliente?: string | { _id: string } };

function getStringProp(obj: SiteLike | undefined, ...keys: string[]): string {
  if (!obj) return '';
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (typeof v === 'string') return v;
  }
  return '';
}

function getClienteId(obj: SiteLike | undefined): string {
  if (!obj || obj.cliente == null) return '';
  return typeof obj.cliente === 'string' ? obj.cliente : (obj.cliente._id ?? '');
}

function getCoords(obj: SiteLike | undefined): { lat: number; lng: number } {
  const c = obj?.coordenadas as { lat?: number; lng?: number } | undefined;
  if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
    return { lat: c.lat, lng: c.lng };
  }
  return { lat: 0, lng: 0 };
}

export const getInitialValues = (
  site: Site | CreateSiteData | { cliente: { _id: string } } | null | undefined
): CreateSiteData => {
  const s: SiteLike | undefined = site ?? undefined;

  return {
    nombre: getStringProp(s, 'nombre'),
    direccion: getStringProp(s, 'direccion'),
    ciudad: getStringProp(s, 'localidad', 'ciudad'),
    provincia: getStringProp(s, 'provincia'),
    codigoPostal: '',
    pais: 'Argentina',
    cliente: getClienteId(s),
    coordenadas: getCoords(s),
    contacto: '',
    telefono: '',
    activo: true,
  };
};

export const hasValidCoordinates = (coordenadas?: { lat: number; lng: number }) => {
  return coordenadas?.lat !== 0 && coordenadas?.lng !== 0;
};
