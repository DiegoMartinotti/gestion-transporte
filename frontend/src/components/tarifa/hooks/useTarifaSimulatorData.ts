import { useForm } from '@mantine/form';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { IEscenarioSimulacion } from '../../../types/tarifa';
import { clienteService, tramoService } from '../TarifaSimulatorServices';

export const useTarifaSimulatorData = () => {
  // Data loading
  const { data: clientes } = useDataLoader({
    fetchFunction: clienteService.getAll,
    errorMessage: 'Error al cargar clientes',
  });

  const { data: tramos } = useDataLoader({
    fetchFunction: tramoService.getAll,
    errorMessage: 'Error al cargar tramos',
  });

  // Form for new scenario
  const form = useForm<IEscenarioSimulacion>({
    initialValues: {
      nombre: '',
      contexto: {
        cliente: '',
        tramo: '',
        distancia: 0,
        palets: 0,
        fecha: '',
        vehiculo: '',
      },
      valoresBase: {
        tarifa: 0,
        peaje: 0,
        extras: 0,
      },
    },
    validate: {
      nombre: (value) => (!value ? 'El nombre es requerido' : null),
    },
  });

  return {
    clientes,
    tramos,
    form,
  };
};