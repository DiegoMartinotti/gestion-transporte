import React, { useEffect } from 'react';
import { Paper, Title, Badge, Group } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { useTotalCalculator } from './hooks/useTotalCalculator';
import { SimpleTotalView } from './components/SimpleTotalView';
import { TotalCalculatorTabs } from './components/TotalCalculatorTabs';

interface ExtrasIniciales {
  extraId: string;
  cantidad?: number;
  valor?: number;
}

interface TotalCalculatorProps {
  tarifaBase: number;
  clienteId?: string;
  extrasIniciales?: ExtrasIniciales[];
  onTotalChange?: (total: number) => void;
  readonly?: boolean;
  variant?: 'simple' | 'detailed';
  showTarifaBase?: boolean;
  showExtras?: boolean;
  breakdown?: {
    concepto: string;
    valor: number;
    tipo: 'tarifa' | 'extra';
  }[];
}

export const TotalCalculator: React.FC<TotalCalculatorProps> = ({
  tarifaBase,
  clienteId,
  extrasIniciales = [],
  onTotalChange,
  readonly = false,
  variant = 'detailed',
  showTarifaBase = true,
  showExtras = true,
}) => {
  const {
    selectedTab,
    extrasDisponibles,
    loading,
    error,
    calculatorState,
    setSelectedTab,
    calculatorActions,
    calcularTotalGeneral,
    agregarExtra,
  } = useTotalCalculator({
    clienteId,
    extrasIniciales,
    onTotalChange,
  });

  // Calcular total cuando cambian los items o tarifa base
  useEffect(() => {
    calcularTotalGeneral(tarifaBase);
  }, [tarifaBase, calculatorState.items, calcularTotalGeneral]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (variant === 'simple') {
    return <SimpleTotalView total={calcularTotalGeneral(tarifaBase)} />;
  }

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalculator size={20} />
          <Title order={4}>Calculadora de Totales</Title>
        </Group>
        <Badge color="blue" variant="light">
          {formatCurrency(calcularTotalGeneral(tarifaBase))}
        </Badge>
      </Group>

      <TotalCalculatorTabs
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        showExtras={showExtras}
        readonly={readonly}
        calculatorState={calculatorState}
        tarifaBase={tarifaBase}
        extrasDisponibles={extrasDisponibles}
        loading={loading}
        error={error}
        calculatorActions={calculatorActions}
        onAddExtra={agregarExtra}
        formatCurrency={formatCurrency}
        calcularTotalGeneral={calcularTotalGeneral}
        showTarifaBase={showTarifaBase}
      />
    </Paper>
  );
};

export default TotalCalculator;
