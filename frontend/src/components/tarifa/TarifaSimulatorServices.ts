import { notifications } from '@mantine/notifications';
import { IEscenarioSimulacion, IResultadoSimulacion } from '../../types/tarifa';
import { Cliente } from '../../types';

export const simuladorService = {
  simular: async (escenarios: IEscenarioSimulacion[]): Promise<IResultadoSimulacion[]> => {
    // Simulación de cálculo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return escenarios.map((escenario, index) => {
      const base = escenario.valoresBase;
      const totalOriginal = base.tarifa + base.peaje + base.extras;

      // Simulamos diferentes modificaciones
      const modificacion = index % 3 === 0 ? -0.1 : index % 2 === 0 ? 0.05 : 0;

      const tarifaFinal = base.tarifa * (1 + modificacion);
      const totalFinal = tarifaFinal + base.peaje + base.extras;

      return {
        escenario: escenario.nombre,
        valoresOriginales: {
          tarifa: base.tarifa,
          peaje: base.peaje,
          extras: base.extras,
          total: totalOriginal,
        },
        valoresFinales: {
          tarifa: tarifaFinal,
          peaje: base.peaje,
          extras: base.extras,
          total: totalFinal,
        },
        reglasAplicadas:
          modificacion !== 0
            ? [
                {
                  codigo: 'REGLA_EJEMPLO',
                  nombre: `${modificacion > 0 ? 'Recargo' : 'Descuento'} por Volumen`,
                  modificacion: totalFinal - totalOriginal,
                },
              ]
            : [],
        diferencia: {
          tarifa: tarifaFinal - base.tarifa,
          peaje: 0,
          extras: 0,
          total: totalFinal - totalOriginal,
          porcentaje: ((totalFinal - totalOriginal) / totalOriginal) * 100,
        },
      };
    });
  },

  exportar: async (resultados: IResultadoSimulacion[], formato: 'excel' | 'pdf') => {
    console.log(`Exportando ${resultados.length} resultados a ${formato}`);
    notifications.show({
      title: 'Éxito',
      message: `Resultados exportados a ${formato.toUpperCase()}`,
      color: 'green',
    });
  },
};

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

interface TramoData {
  _id: string;
  origen: { nombre: string };
  destino: { nombre: string };
  distancia: number;
}

export const tramoService = {
  getAll: async () => ({
    data: [
      {
        _id: '1',
        origen: { nombre: 'Buenos Aires' },
        destino: { nombre: 'Córdoba' },
        distancia: 700,
      },
      { _id: '2', origen: { nombre: 'Rosario' }, destino: { nombre: 'Mendoza' }, distancia: 650 },
    ] as TramoData[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 50,
    },
  }),
};