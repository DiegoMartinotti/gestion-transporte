import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import { clienteService } from '../../services/clienteService';
import { tramoService } from '../../services/tramoService';
import type { IEscenarioSimulacion, IResultadoSimulacion } from '../../types/tarifa';

export const useTarifaSimulatorState = () => {
  const [escenarios, setEscenarios] = useState<IEscenarioSimulacion[]>([]);
  const [resultados, setResultados] = useState<IResultadoSimulacion[]>([]);
  const [simulando, setSimulando] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('escenarios');

  return {
    escenarios,
    setEscenarios,
    resultados,
    setResultados,
    simulando,
    setSimulando,
    activeTab,
    setActiveTab,
  };
};

export const useTarifaSimulatorData = () => {
  const { data: clientes } = useDataLoader({
    fetchFunction: clienteService.getAll,
    errorMessage: 'Error al cargar clientes',
  });

  const { data: tramos } = useDataLoader({
    fetchFunction: tramoService.getAll,
    errorMessage: 'Error al cargar tramos',
  });

  return { clientes: clientes || [], tramos: tramos || [] };
};

export const useTarifaSimulatorModals = () => {
  const escenarioModal = useModal<IEscenarioSimulacion>();
  const detalleModal = useModal<IResultadoSimulacion>();

  return { escenarioModal, detalleModal };
};

export const useTarifaSimulatorForm = () => {
  return useForm<IEscenarioSimulacion>({
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
};

export const useTarifaSimulatorOperations = (
  escenarios: IEscenarioSimulacion[],
  setEscenarios: (escenarios: IEscenarioSimulacion[]) => void,
  setResultados: (resultados: IResultadoSimulacion[]) => void,
  setSimulando: (simulando: boolean) => void
) => {
  const agregarEscenario = (escenario: IEscenarioSimulacion) => {
    const nuevoEscenario: IEscenarioSimulacion = {
      ...escenario,
      id: Date.now().toString(),
      fechaCreacion: new Date().toISOString(),
      activo: true,
    };
    setEscenarios([...escenarios, nuevoEscenario]);
  };

  const editarEscenario = (escenarioEditado: IEscenarioSimulacion) => {
    setEscenarios(
      escenarios.map((e) => (e.id === escenarioEditado.id ? escenarioEditado : e))
    );
  };

  const eliminarEscenario = (id: string) => {
    setEscenarios(escenarios.filter((e) => e.id !== id));
  };

  const duplicarEscenario = (escenario: IEscenarioSimulacion) => {
    const duplicado: IEscenarioSimulacion = {
      ...escenario,
      id: Date.now().toString(),
      nombre: `${escenario.nombre} (Copia)`,
      fechaCreacion: new Date().toISOString(),
    };
    setEscenarios([...escenarios, duplicado]);
  };

  const createResultadoFromEscenario = (escenario: IEscenarioSimulacion): IResultadoSimulacion => {
    const tarifaOriginal = escenario.valoresBase.tarifa || Math.random() * 30000 + 5000;
    const peajeOriginal = escenario.valoresBase.peaje || Math.random() * 5000 + 1000;
    const extrasOriginal = escenario.valoresBase.extras || Math.random() * 3000;
    const totalOriginal = tarifaOriginal + peajeOriginal + extrasOriginal;

    const tarifaFinal = tarifaOriginal * 1.1;
    const peajeFinal = peajeOriginal * 1.05;
    const extrasFinal = extrasOriginal * 1.15;
    const totalFinal = totalOriginal * 1.1;

    return {
      escenario: escenario.nombre,
      valoresOriginales: {
        tarifa: tarifaOriginal,
        peaje: peajeOriginal,
        extras: extrasOriginal,
        total: totalOriginal
      },
      valoresFinales: {
        tarifa: tarifaFinal,
        peaje: peajeFinal,
        extras: extrasFinal,
        total: totalFinal
      },
      reglasAplicadas: [
        {
          codigo: 'REG001',
          nombre: 'Ajuste por distancia',
          modificacion: 10
        }
      ],
      diferencia: {
        tarifa: tarifaFinal - tarifaOriginal,
        peaje: peajeFinal - peajeOriginal,
        extras: extrasFinal - extrasOriginal,
        total: totalFinal - totalOriginal,
        porcentaje: ((totalFinal - totalOriginal) / totalOriginal) * 100
      }
    };
  };

  const ejecutarSimulacion = async (escenariosSeleccionados: IEscenarioSimulacion[]) => {
    setSimulando(true);
    try {
      // Simular delay para mostrar loading
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const resultados: IResultadoSimulacion[] = escenariosSeleccionados.map(createResultadoFromEscenario);

      setResultados(resultados);
      return resultados;
    } finally {
      setSimulando(false);
    }
  };

  return {
    agregarEscenario,
    editarEscenario,
    eliminarEscenario,
    duplicarEscenario,
    ejecutarSimulacion,
  };
};