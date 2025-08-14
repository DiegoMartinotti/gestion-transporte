import { Site, Cliente } from '../../types';

export const getMarkerIcon = (isActive: boolean): string => {
  const iconTemplate = (color: string) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  `;

  const color = isActive ? '#228be6' : '#dc3545';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(iconTemplate(color));
};

export const createInfoWindowContent = (site: Site, clientes: Cliente[]): string => {
  const clienteNombre =
    typeof site.cliente === 'string'
      ? clientes.find((c) => c._id === site.cliente)?.nombre || 'Cliente no encontrado'
      : site.cliente?.nombre || 'Sin cliente';

  return `
    <div style="max-width: 300px; padding: 8px;">
      <h3 style="margin: 0 0 8px 0; color: #228be6;">${site.nombre}</h3>
      <p style="margin: 4px 0; color: #666;"><strong>Cliente:</strong> ${clienteNombre}</p>
      <p style="margin: 4px 0; color: #666;"><strong>Dirección:</strong> ${site.direccion}</p>
      <p style="margin: 4px 0; color: #666;"><strong>Ciudad:</strong> ${site.localidad || site.ciudad || 'N/A'}</p>
      <p style="margin: 4px 0; color: #666;"><strong>Provincia:</strong> ${site.provincia}</p>
      <p style="margin: 4px 0; color: #666;">
        <strong>Estado:</strong> 
        <span style="color: ${site.activo === false ? '#dc3545' : '#28a745'};">
          ${site.activo === false ? 'Inactivo' : 'Activo'}
        </span>
      </p>
      <p style="margin: 8px 0 4px 0; font-size: 12px; color: #999;">
        Lat: ${site.coordenadas?.lat.toFixed(6)}, Lng: ${site.coordenadas?.lng.toFixed(6)}
      </p>
    </div>
  `;
};

export const getClienteName = (site: Site, clientes: Cliente[]): string => {
  return typeof site.cliente === 'string'
    ? clientes.find((c) => c._id === site.cliente)?.nombre || 'Cliente no encontrado'
    : site.cliente?.nombre || 'Sin cliente';
};

export const filterSites = (
  sites: Site[],
  selectedCliente: string,
  showInactiveSites: boolean
): Site[] => {
  let filtered = sites;

  if (selectedCliente) {
    filtered = filtered.filter((site) =>
      typeof site.cliente === 'string'
        ? site.cliente === selectedCliente
        : site.cliente._id === selectedCliente
    );
  }

  if (!showInactiveSites) {
    filtered = filtered.filter((site) => site.activo !== false);
  }

  return filtered;
};

export const isValidCoordinates = (site: Site): boolean => {
  return !!(site.coordenadas && site.coordenadas.lat !== 0 && site.coordenadas.lng !== 0);
};

export const adjustMapBounds = (map: any, sites: Site[], window: Window): void => {
  if (sites.length === 0) return;

  if (sites.length === 1) {
    const site = sites[0];
    if (site.coordenadas) {
      map.setCenter({ lat: site.coordenadas.lat, lng: site.coordenadas.lng });
      map.setZoom(15);
    }
    return;
  }

  const bounds = new window.google.maps.LatLngBounds();
  sites.forEach((site) => {
    if (isValidCoordinates(site)) {
      bounds.extend({ lat: site.coordenadas!.lat, lng: site.coordenadas!.lng });
    }
  });

  map.fitBounds(bounds);
  const padding = { top: 50, right: 50, bottom: 50, left: 50 };
  map.fitBounds(bounds, padding);
};
