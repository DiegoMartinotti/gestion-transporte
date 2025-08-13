import { notifications } from '@mantine/notifications';
import { tramoService } from '../../../services/tramoService';
import { calculateHaversineDistance } from '../validation/tramoValidation';

export async function calculateDistance(
  origen: string,
  destino: string,
  sitesFiltered: any[],
  setCalculatingDistance: (value: boolean) => void,
  onSuccess: (distance: number) => void
) {
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

  if (!origenSite?.location?.coordinates || !destinoSite?.location?.coordinates) {
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

    const lat1 = origenSite.location.coordinates[1];
    const lon1 = origenSite.location.coordinates[0];
    const lat2 = destinoSite.location.coordinates[1];
    const lon2 = destinoSite.location.coordinates[0];

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

export async function validateTarifaConflicts(
  formValues: any,
  setConflicts: (conflicts: any[]) => void,
  setValidatingConflicts: (value: boolean) => void
) {
  if (!formValues.cliente || !formValues.origen || !formValues.destino) return;

  setValidatingConflicts(true);
  try {
    const result = await tramoService.validarConflictosTarifas({
      origen: formValues.origen,
      destino: formValues.destino,
      cliente: formValues.cliente,
      tarifasHistoricas: formValues.tarifasHistoricas,
    });

    setConflicts(result.conflicts || []);
  } catch (error) {
    console.error('Error validating conflicts:', error);
  } finally {
    setValidatingConflicts(false);
  }
}

export function filterSitesByClient(
  clientId: string,
  sites: any[],
  form: any,
  setSitesFiltered: (sites: any[]) => void
) {
  if (clientId) {
    const filtered = sites.filter((site) => site.cliente === clientId);
    setSitesFiltered(filtered);

    // Limpiar origen y destino si no pertenecen al cliente seleccionado
    if (form.values.origen && !filtered.find((s: any) => s._id === form.values.origen)) {
      form.setFieldValue('origen', '');
    }
    if (form.values.destino && !filtered.find((s: any) => s._id === form.values.destino)) {
      form.setFieldValue('destino', '');
    }
  } else {
    setSitesFiltered([]);
  }
}
