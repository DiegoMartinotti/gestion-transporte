import { ReglaTarifaFormData, ReglaTarifaFilters, IReglaTarifa } from '../../../types/tarifa';
import { Cliente } from '../../../types';

const DEFAULT_DATE = '2024-01-01';

// Servicio para reglas de tarifa
export const reglaTarifaService = {
  getAll: async (_filters?: ReglaTarifaFilters) => {
    return {
      data: [
        {
          _id: '1',
          codigo: 'DESC_VOLUMEN',
          nombre: 'Descuento por Volumen',
          descripcion: 'Descuento del 10% para viajes con más de 20 palets',
          cliente: 'Cliente ABC',
          metodoCalculo: 'DISTANCIA_PALET',
          condiciones: [
            {
              campo: 'viaje.palets',
              operador: 'mayor' as const,
              valor: 20,
            },
          ],
          operadorLogico: 'AND' as const,
          modificadores: [
            {
              tipo: 'porcentaje' as const,
              valor: -10,
              aplicarA: 'total' as const,
              descripcion: 'Descuento 10%',
            },
          ],
          prioridad: 100,
          activa: true,
          fechaInicioVigencia: DEFAULT_DATE,
          aplicarEnCascada: true,
          excluirOtrasReglas: false,
          estadisticas: {
            vecesAplicada: 45,
            montoTotalModificado: -25000,
          },
          createdAt: DEFAULT_DATE,
          updatedAt: DEFAULT_DATE,
        },
      ] as IReglaTarifa[],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 50,
      },
    };
  },

  create: async (data: ReglaTarifaFormData) => {
    console.log('Creating business rule:', data);
    return { success: true };
  },

  update: async (id: string, data: ReglaTarifaFormData) => {
    console.log('Updating business rule:', id, data);
    return { success: true };
  },

  delete: async (id: string) => {
    console.log('Deleting business rule:', id);
    return { success: true };
  },

  updatePriorities: async (rules: { id: string; prioridad: number }[]) => {
    console.log('Updating priorities:', rules);
    return { success: true };
  },
};

// Servicio para clientes
export const clienteService = {
  getAll: async () => ({
    data: [
      { _id: '1', nombre: 'Cliente ABC' },
      { _id: '2', nombre: 'Cliente XYZ' },
    ] as Cliente[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 50,
    },
  }),
};
