import { notifications } from '@mantine/notifications';
import { vehiculoService } from '../../../services/vehiculoService';
import { empresaService } from '../../../services/empresaService';
import { Vehiculo } from '../../../types/vehiculo';
import { Empresa } from '../../../types';
import { normalizeVehiculoData } from '../validation/vehiculoValidation';

export async function loadEmpresas(setEmpresas: (empresas: Empresa[]) => void) {
  try {
    const response = await empresaService.getAll();
    setEmpresas(response.data);
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'Error al cargar las empresas',
      color: 'red',
    });
  }
}

export async function submitVehiculo(
  values: Vehiculo,
  vehiculo: Vehiculo | null | undefined,
  onSuccess: () => void,
  onClose: () => void,
  setLoading: (loading: boolean) => void
) {
  try {
    setLoading(true);

    // Normalizar datos
    const normalizedValues = normalizeVehiculoData(values);

    if (vehiculo?._id) {
      await vehiculoService.updateVehiculo(vehiculo._id, normalizedValues);
      notifications.show({
        title: 'Éxito',
        message: 'Vehículo actualizado correctamente',
        color: 'green',
      });
    } else {
      await vehiculoService.createVehiculo(normalizedValues);
      notifications.show({
        title: 'Éxito',
        message: 'Vehículo creado correctamente',
        color: 'green',
      });
    }

    onSuccess();
    onClose();
  } catch (error: any) {
    notifications.show({
      title: 'Error',
      message: error.response?.data?.message || 'Error al guardar el vehículo',
      color: 'red',
    });
  } finally {
    setLoading(false);
  }
}
