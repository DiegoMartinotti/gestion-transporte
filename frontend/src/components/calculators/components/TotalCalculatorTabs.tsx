import React from 'react';
import { Tabs, Box, Stack, Card, Group, Text, Divider } from '@mantine/core';
import { IconReceipt, IconList, IconTruck } from '@tabler/icons-react';
import { TotalSummary } from './TotalSummary';
import { ExtrasSelector } from './ExtrasSelector';
import type { Extra } from '../../../services/extraService';
import type { CalculationItem } from '../../../hooks/useCalculatorBase';

interface CalculatorState {
  items: CalculationItem[];
  total: number;
}

interface TotalCalculatorTabsProps {
  selectedTab: string;
  setSelectedTab: ((value: string | null) => void) | null;
  showExtras: boolean;
  readonly: boolean;
  calculatorState: CalculatorState;
  tarifaBase: number;
  extrasDisponibles: Extra[];
  loading: boolean;
  error: string;
  onAddExtra: (extraId: string) => void;
  formatCurrency: (amount: number) => string;
  calcularTotalGeneral: (tarifaBase: number) => number;
  showTarifaBase: boolean;
}

const DetallesPanel: React.FC<{
  showTarifaBase: boolean;
  tarifaBase: number;
  calculatorState: CalculatorState;
  formatCurrency: (amount: number) => string;
  calcularTotalGeneral: (tarifaBase: number) => number;
}> = ({ showTarifaBase, tarifaBase, calculatorState, formatCurrency, calcularTotalGeneral }) => (
  <Stack gap="md" mt="md">
    {showTarifaBase && (
      <Card withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            <IconTruck size={16} />
            <Text fw={500}>Tarifa Base</Text>
          </Group>
          <Text fw={500}>{formatCurrency(tarifaBase)}</Text>
        </Group>
      </Card>
    )}

    {calculatorState.items.length > 0 && (
      <Card withBorder>
        <Text fw={500} mb="md">
          Extras Detallados
        </Text>
        <Stack gap="xs">
          {calculatorState.items.map((item, index) => (
            <Group key={index} justify="space-between">
              <Text size="sm">
                {item.concepto} x {item.cantidad}
              </Text>
              <Text size="sm" fw={500}>
                {formatCurrency((item.valor || 0) * (item.cantidad || 1))}
              </Text>
            </Group>
          ))}
        </Stack>
      </Card>
    )}

    <Divider />

    <Group
      justify="space-between"
      p="md"
      style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}
    >
      <Text size="lg" fw={700}>
        Total Final
      </Text>
      <Text size="lg" fw={700} c="blue">
        {formatCurrency(calcularTotalGeneral(tarifaBase))}
      </Text>
    </Group>
  </Stack>
);

export const TotalCalculatorTabs: React.FC<TotalCalculatorTabsProps> = ({
  selectedTab,
  setSelectedTab,
  showExtras,
  readonly,
  calculatorState,
  tarifaBase,
  extrasDisponibles,
  loading,
  error,
  onAddExtra,
  formatCurrency,
  calcularTotalGeneral,
  showTarifaBase,
}) => {
  return (
    <Tabs value={selectedTab} onChange={setSelectedTab || undefined}>
      <Tabs.List>
        <Tabs.Tab value="resumen" leftSection={<IconReceipt size={16} />}>
          Resumen
        </Tabs.Tab>
        {showExtras && !readonly && (
          <Tabs.Tab value="extras" leftSection={<IconList size={16} />}>
            Extras ({calculatorState.items.length})
          </Tabs.Tab>
        )}
        <Tabs.Tab value="detalles" leftSection={<IconTruck size={16} />}>
          Detalles
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="resumen">
        <Box mt="md">
          <TotalSummary tarifaBase={tarifaBase} items={calculatorState.items} />
        </Box>
      </Tabs.Panel>

      {showExtras && !readonly && (
        <Tabs.Panel value="extras">
          <Stack gap="md" mt="md">
            <ExtrasSelector
              extrasDisponibles={extrasDisponibles}
              loading={loading}
              error={error}
              readonly={readonly}
              onAddExtra={onAddExtra}
            />

            {calculatorState.items.length > 0 && (
              <div>Extras aplicados: {calculatorState.items.length}</div>
            )}
          </Stack>
        </Tabs.Panel>
      )}

      <Tabs.Panel value="detalles">
        <DetallesPanel
          showTarifaBase={showTarifaBase}
          tarifaBase={tarifaBase}
          calculatorState={calculatorState}
          formatCurrency={formatCurrency}
          calcularTotalGeneral={calcularTotalGeneral}
        />
      </Tabs.Panel>
    </Tabs>
  );
};
