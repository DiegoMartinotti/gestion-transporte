import { notifications } from '@mantine/notifications';
import { siteService, CreateSiteData } from '../../../services/siteService';
import { clienteService } from '../../../services/clienteService';
import { Cliente, Site } from '../../../types';

export const loadClientes = async (
  setClientes: (clientes: Cliente[]) => void,
  setLoadingClientes: (loading: boolean) => void
) => {
  try {
    setLoadingClientes(true);
    const response = await clienteService.getAll({ limit: 1000 });
    setClientes(response.data);
  } catch (error) {
    console.error('loadClientes - failed to fetch clientes', error);
    notifications.show({
      title: 'Error',
      message: 'No se pudieron cargar los clientes',
      color: 'red',
    });
  } finally {
    setLoadingClientes(false);
  }
};

export const geocodeAddress = async (
  direccion: string,
  ciudad: string,
  provincia: string,
  pais: string
): Promise<{ lat: number; lng: number } | null> => {
  const fullAddress = `${direccion}, ${ciudad}, ${provincia}, ${pais}`;

  if (!direccion || !ciudad) {
    notifications.show({
      title: 'Error',
      message: 'Ingrese al menos la dirección y ciudad para geocodificar',
      color: 'orange',
    });
    return null;
  }

  try {
    const coords = await siteService.geocodeAddress(fullAddress);
    notifications.show({
      title: 'Éxito',
      message: 'Coordenadas obtenidas correctamente',
      color: 'green',
    });
    return coords;
  } catch (error) {
    console.error('geocodeAddress - failed to retrieve coordinates', error);
    notifications.show({
      title: 'Error',
      message: 'No se pudieron obtener las coordenadas de la dirección',
      color: 'red',
    });
    return null;
  }
};

export const submitSite = async (
  values: CreateSiteData,
  site: Site | null | undefined,
  onSubmit: (site: Site) => void
) => {
  try {
    let result: Site;

    if (site) {
      result = await siteService.update(site._id, values);
      notifications.show({
        title: 'Éxito',
        message: 'Site actualizado correctamente',
        color: 'green',
      });
    } else {
      result = await siteService.create(values);
      notifications.show({
        title: 'Éxito',
        message: 'Site creado correctamente',
        color: 'green',
      });
    }

    onSubmit(result);
  } catch (error) {
    console.error(`submitSite - failed to ${site ? 'update' : 'create'} site`, error);
    notifications.show({
      title: 'Error',
      message: `No se pudo ${site ? 'actualizar' : 'crear'} el site`,
      color: 'red',
    });
  }
};

export const openGoogleMaps = (lat: number, lng: number) => {
  const url = `https://maps.google.com/?q=${lat},${lng}`;
  window.open(url, '_blank');
};
