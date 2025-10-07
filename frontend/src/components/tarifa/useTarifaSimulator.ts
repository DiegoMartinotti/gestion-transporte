import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import { clienteService } from '../../services/clienteService';
import { tramoService } from '../../services/tramoService';
import type { IEscenarioSimulacion, IResultadoSimulacion } from '../../types/tarifa';
import type { Tramo, TramoFilters } from '../../types';

type EditableEscenario = IEscenarioSimulacion & {
  id?: string;
  fechaCreacion?: string;
  activo?: boolean;
};

export const useTarifaSimulatorState = () => {
  const [escenarios, setEscenarios] = useState<EditableEscenario[]>([]);
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

  const { data: tramos } = useDataLoader<Tramo, TramoFilters>({
    fetchFunction: async (params) => {
      const data = await tramoService.getAll(params);
      return {
        data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: data.length,
          itemsPerPage: data.length === 0 ? 1 : data.length,
        },
      };
    },
    enablePagination: false,
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
  escenarios: EditableEscenario[],
  setEscenarios: (escenarios: EditableEscenario[]) => void,
  setResultados: (resultados: IResultadoSimulacion[]) => void,
  setSimulando: (simulando: boolean) => void
) => {
  const agregarEscenario = (escenario: IEscenarioSimulacion) => {
    const nuevoEscenario: EditableEscenario = {
      ...escenario,
      id: Date.now().toString(),
      fechaCreacion: new Date().toISOString(),
      activo: true,
    };
    setEscenarios([...escenarios, nuevoEscenario]);
  };

  const editarEscenario = (escenarioEditado: EditableEscenario) => {
    setEscenarios(escenarios.map((e) => (e.id === escenarioEditado.id ? escenarioEditado : e)));
  };

  const eliminarEscenario = (id: string) => {
    setEscenarios(escenarios.filter((e) => e.id !== id));
  };

  const duplicarEscenario = (escenario: EditableEscenario) => {
    const duplicado: EditableEscenario = {
      ...escenario,
      id: Date.now().toString(),
      nombre: `${escenario.nombre} (Copia)`,
      fechaCreacion: new Date().toISOString(),
    };
    setEscenarios([...escenarios, duplicado]);
  };

  const createResultadoFromEscenario = (escenario: IEscenarioSimulacion): IResultadoSimulacion => {
    const tarifaOriginal = escenario.valoresBase.tarifa ?? 20000;
    const peajeOriginal = escenario.valoresBase.peaje ?? 5000;
    const extrasOriginal = escenario.valoresBase.extras ?? 2000;
    const totalOriginal = tarifaOriginal + peajeOriginal + extrasOriginal;

    const factorPalets = escenario.contexto.palets ? escenario.contexto.palets * 0.01 : 0.05;
    const tarifaFinal = tarifaOriginal * (1 + factorPalets);
    const peajeFinal = peajeOriginal * 1.05;
    const extrasFinal = extrasOriginal * 1.08;
    const totalFinal = tarifaFinal + peajeFinal + extrasFinal;

    const diferenciaTotal = totalFinal - totalOriginal;
    const porcentaje = totalOriginal === 0 ? 0 : (diferenciaTotal / totalOriginal) * 100;

    return {
      escenario: escenario.nombre,
      valoresOriginales: {
        tarifa: tarifaOriginal,
        peaje: peajeOriginal,
        extras: extrasOriginal,
        total: totalOriginal,
      },
      valoresFinales: {
        tarifa: tarifaFinal,
        peaje: peajeFinal,
        extras: extrasFinal,
        total: totalFinal,
      },
      reglasAplicadas: [
        {
          codigo: 'REG001',
          nombre: 'Ajuste por distancia',
          modificacion: diferenciaTotal,
        },
      ],
      diferencia: {
        tarifa: tarifaFinal - tarifaOriginal,
        peaje: peajeFinal - peajeOriginal,
        extras: extrasFinal - extrasOriginal,
        total: diferenciaTotal,
        porcentaje,
      },
    };
  };

  const ejecutarSimulacion = async (escenariosSeleccionados: EditableEscenario[]) => {
    setSimulando(true);
    try {
      // Simular delay para mostrar loading
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const resultados: IResultadoSimulacion[] = escenariosSeleccionados.map(
        createResultadoFromEscenario
      );

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
