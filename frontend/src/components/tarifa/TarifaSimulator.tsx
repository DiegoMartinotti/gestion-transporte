import React from 'react';
import { Stack } from '@mantine/core';
import { useModal } from '../../hooks/useModal';
import {
  IEscenarioSimulacion,
  IResultadoSimulacion,
  ITarifaMetodo,
  IReglaTarifa,
} from '../../types/tarifa';
import { useTarifaSimulatorData as useChartData } from './TarifaSimulatorHelpers';
import { useTarifaSimulatorHandlers } from './hooks/useTarifaSimulatorHandlers';
import { useTarifaSimulatorData } from './hooks/useTarifaSimulatorData';
import TarifaSimulatorHeader from './components/TarifaSimulatorHeader';
import TarifaSimulatorTabs from './components/TarifaSimulatorTabs';
import EscenarioModal from './components/EscenarioModal';
import DetalleResultadoModal from './components/DetalleResultadoModal';

interface TarifaSimulatorProps {
  metodosDisponibles?: ITarifaMetodo[];
  reglasDisponibles?: IReglaTarifa[];
}

// Services now imported from separate file

const TarifaSimulator: React.FC<TarifaSimulatorProps> = ({
  metodosDisponibles = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  reglasDisponibles = [], // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  // Custom hooks
  const {
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
  } = useTarifaSimulatorHandlers();

  const { clientes, tramos, form } = useTarifaSimulatorData();

  // Modals
  const escenarioModal = useModal<IEscenarioSimulacion>();
  const detalleModal = useModal<IResultadoSimulacion>();

  // Charts data using helper hook
  const { chartData, pieData, estadisticas } = useChartData(resultados);

  const handleAddEscenarioWithFormReset = (values: IEscenarioSimulacion) => {
    handleAddEscenario(values);
    form.reset();
    escenarioModal.close();
  };

  return (
    <Stack gap="md">
      <TarifaSimulatorHeader
        escenarios={escenarios}
        simulando={simulando}
        onSimular={handleSimular}
        onLimpiar={handleLimpiar}
      />

      <TarifaSimulatorTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        escenarios={escenarios}
        resultados={resultados}
        clientes={clientes}
        chartData={chartData}
        pieData={pieData}
        estadisticas={estadisticas}
        onAddEscenario={escenarioModal.openCreate}
        onRemoveEscenario={handleRemoveEscenario}
        onExportar={handleExportar}
        onViewDetalle={detalleModal.openView}
      />

      {/* Modals */}
      <EscenarioModal
        opened={escenarioModal.isOpen}
        onClose={escenarioModal.close}
        onSubmit={handleAddEscenarioWithFormReset}
        form={form}
        clientes={clientes}
        tramos={tramos}
      />

      <DetalleResultadoModal
        opened={detalleModal.isOpen}
        onClose={detalleModal.close}
        resultado={detalleModal.selectedItem}
      />
    </Stack>
  );
};

export default TarifaSimulator;
