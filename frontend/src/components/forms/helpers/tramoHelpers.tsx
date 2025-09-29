import { notifications } from '@mantine/notifications';
import { tramoService } from '../../../services/tramoService';
import { calculateHaversineDistance } from '../validation/tramoValidation';
import type { Site } from '../../../types';

interface CalculateDistanceParams {
  origen: string;
  destino: string;
  sitesFiltered: Site[];
  setCalculatingDistance: (value: boolean) => void;
  onSuccess: (distance: number) => void;
}

export async function calculateDistance({
  origen,
  destino,
  sitesFiltered,
  setCalculatingDistance,
  onSuccess,
}: CalculateDistanceParams) {
  if (!origen || !destino) {
    notifications.show({
      title: 'Error',
      message: 'Selecciona origen y destino para calcular distancia',
      color: 'red',
    });
    return;
  }

  const origenSite = sitesFiltered.find((s) => s._id === origen);
  const destinoSite = sitesFiltered.find((s) => s._id === destino);

  if (!origenSite?.coordenadas || !destinoSite?.coordenadas) {
    notifications.show({
      title: 'Error',
      message: 'Los sitios seleccionados no tienen coordenadas válidas',
      color: 'red',
    });
    return;
  }

  setCalculatingDistance(true);
  try {
    // Simular cálculo de distancia (en implementación real usaríamos Google Maps API)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const lat1 = origenSite.coordenadas.lat;
    const lon1 = origenSite.coordenadas.lng;
    const lat2 = destinoSite.coordenadas.lat;
    const lon2 = destinoSite.coordenadas.lng;

    const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    const roundedDistance = Math.round(distance);

    onSuccess(roundedDistance);

    notifications.show({
      title: 'Éxito',
      message: `Distancia calculada: ${roundedDistance} km`,
      color: 'green',
    });
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'Error al calcular distancia',
      color: 'red',
    });
  } finally {
    setCalculatingDistance(false);
  }
}

interface TarifaConflictsParams {
  formValues: {
    cliente: string;
    origen: string;
    destino: string;
    tarifasHistoricas: unknown[];
  };
  setConflicts: (conflicts: unknown[]) => void;
  setValidatingConflicts: (value: boolean) => void;
}

export async function validateTarifaConflicts({
  formValues,
  setConflicts,
  setValidatingConflicts,
}: TarifaConflictsParams) {
  if (!formValues.cliente || !formValues.origen || !formValues.destino) return;

  setValidatingConflicts(true);
  try {
    const result = await tramoService.validarConflictosTarifas({
      origen: formValues.origen,
      destino: formValues.destino,
      cliente: formValues.cliente,
      tarifasHistoricas: formValues.tarifasHistoricas as TarifaHistorica[],
    });

    setConflicts(result.conflicts || []);
  } catch (error) {
    console.error('Error validating conflicts:', error);
  } finally {
    setValidatingConflicts(false);
  }
}

interface FilterSitesByClientParams {
  clientId: string;
  sites: Site[];
  form: {
    values: {
      origen: string;
      destino: string;
    };
    setFieldValue: (field: string, value: unknown) => void;
  };
  setSitesFiltered: (sites: Site[]) => void;
}

export function filterSitesByClient({
  clientId,
  sites,
  form,
  setSitesFiltered,
}: FilterSitesByClientParams) {
  if (clientId) {
    const filtered = sites.filter((site) => site.cliente === clientId);
    setSitesFiltered(filtered);

    // Limpiar origen y destino si no pertenecen al cliente seleccionado
    if (form.values.origen && !filtered.find((s) => s._id === form.values.origen)) {
      form.setFieldValue('origen', '');
    }
    if (form.values.destino && !filtered.find((s) => s._id === form.values.destino)) {
      form.setFieldValue('destino', '');
    }
  } else {
    setSitesFiltered([]);
  }
}
