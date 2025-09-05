import { notifications } from '@mantine/notifications';
import { TarifaMetodoFormData, TarifaMetodoFilters } from '../types/tarifa';

// Mock service - en producción sería un servicio real
export const tarifaMetodoService = {
  getAll: async (_filters?: TarifaMetodoFilters) => {
    // Simulación de datos
    return {
      data: [
        {
          _id: '1',
          codigo: 'DISTANCIA_PALET',
          nombre: 'Cálculo por Distancia y Palets',
          descripcion: 'Tarifa basada en distancia kilométrica y cantidad de palets',
          formulaBase: 'Valor * Distancia * Palets + Peaje',
          variables: [
            {
              nombre: 'Distancia',
              descripcion: 'Distancia en kilómetros',
              tipo: 'number' as const,
              origen: 'tramo' as const,
              campo: 'distancia',
              requerido: true,
            },
          ],
          activo: true,
          prioridad: 100,
          requiereDistancia: true,
          requierePalets: true,
          permiteFormulasPersonalizadas: true,
          configuracion: {},
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 50,
      },
    };
  },

  create: async (data: TarifaMetodoFormData) => {
    console.log('Creating tarifa method:', data);
    notifications.show({
      title: 'Éxito',
      message: 'Método de tarifa creado correctamente',
      color: 'green',
    });
    return { success: true };
  },

  update: async (id: string, data: TarifaMetodoFormData) => {
    console.log('Updating tarifa method:', id, data);
    notifications.show({
      title: 'Éxito',
      message: 'Método de tarifa actualizado correctamente',
      color: 'green',
    });
    return { success: true };
  },

  delete: async (id: string) => {
    console.log('Deleting tarifa method:', id);
    notifications.show({
      title: 'Éxito',
      message: 'Método de tarifa eliminado correctamente',
      color: 'green',
    });
    return { success: true };
  },
};
