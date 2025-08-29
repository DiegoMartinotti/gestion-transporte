import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IEscenarioSimulacion, IResultadoSimulacion } from '../../../types/tarifa';
import { simuladorService } from '../TarifaSimulatorServices';

export const useTarifaSimulatorHandlers = () => {
  const [escenarios, setEscenarios] = useState<IEscenarioSimulacion[]>([]);
  const [resultados, setResultados] = useState<IResultadoSimulacion[]>([]);
  const [simulando, setSimulando] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('escenarios');

  const handleAddEscenario = (values: IEscenarioSimulacion) => {
    if (escenarios.some((e) => e.nombre === values.nombre)) {
      notifications.show({
        title: 'Error',
        message: 'Ya existe un escenario con ese nombre',
        color: 'red',
      });
      return;
    }

    setEscenarios((prev) => [...prev, { ...values }]);

    notifications.show({
      title: 'Éxito',
      message: 'Escenario agregado correctamente',
      color: 'green',
    });
  };

  const handleRemoveEscenario = (index: number) => {
    setEscenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimular = async () => {
    if (escenarios.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Debe agregar al menos un escenario',
        color: 'red',
      });
      return;
    }

    try {
      setSimulando(true);
      const resultados = await simuladorService.simular(escenarios);
      setResultados(resultados);
      setActiveTab('resultados');

      notifications.show({
        title: 'Éxito',
        message: `Simulación completada: ${resultados.length} escenarios procesados`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al ejecutar la simulación',
        color: 'red',
      });
    } finally {
      setSimulando(false);
    }
  };

  const handleExportar = async (formato: 'excel' | 'pdf') => {
    if (resultados.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'No hay resultados para exportar',
        color: 'red',
      });
      return;
    }

    await simuladorService.exportar(resultados, formato);
  };

  const handleLimpiar = () => {
    setEscenarios([]);
    setResultados([]);
    setActiveTab('escenarios');
  };

  return {
    escenarios,
    resultados,
    simulando,
    activeTab,
    handleAddEscenario,
    handleRemoveEscenario,
    handleSimular,
    handleExportar,
    handleLimpiar,
    setActiveTab,
  };
};