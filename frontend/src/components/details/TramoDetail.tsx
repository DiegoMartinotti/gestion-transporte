import React from 'react';
import { Stack, Grid, Paper, Tabs } from '@mantine/core';
import { TramoDetailProps } from './TramoDetail.types';
import { useTramoCalculator } from './hooks/useTramoCalculator';
import { useTarifasFilter } from './hooks/useTarifasFilter';
import TramoHeader from './components/TramoHeader';
import TramoInfoCard from './components/TramoInfoCard';
import TramoStatsCards from './components/TramoStatsCards';
import TramoCostCalculatorModal from './components/TramoCostCalculatorModal';
import TramoTarifasTab from './components/TramoTarifasTab';
import TramoHistorialTab from './components/TramoHistorialTab';
import TramoEstadisticasTab from './components/TramoEstadisticasTab';

const TramoDetail: React.FC<TramoDetailProps> = ({ tramo, onEdit }) => {
  const {
    calculatorOpened,
    openCalculator,
    closeCalculator,
    calculating,
    calculationResult,
    calculationParams,
    setCalculationParams,
    calculateCost,
    recalculateDistance,
  } = useTramoCalculator();

  const { tarifasVigentes, tarifasPasadas, tarifasFuturas, getTarifaStatus } = useTarifasFilter(
    tramo.tarifasHistoricas
  );

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <TramoHeader onOpenCalculator={openCalculator} onEdit={onEdit} />

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <TramoInfoCard
              tramo={tramo}
              onRecalculateDistance={() => recalculateDistance(tramo._id)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <TramoStatsCards
              tarifasVigentes={tarifasVigentes}
              createdAt={tramo.createdAt}
              updatedAt={tramo.updatedAt}
              totalTarifas={tramo.tarifasHistoricas.length}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      <Tabs defaultValue="tarifas">
        <Tabs.List>
          <Tabs.Tab value="tarifas">Tarifas ({tramo.tarifasHistoricas.length})</Tabs.Tab>
          <Tabs.Tab value="historial">Historial</Tabs.Tab>
          <Tabs.Tab value="estadisticas">Estadísticas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="tarifas">
          <TramoTarifasTab
            tarifasVigentes={tarifasVigentes}
            tarifasFuturas={tarifasFuturas}
            tarifasPasadas={tarifasPasadas}
            totalTarifas={tramo.tarifasHistoricas.length}
          />
        </Tabs.Panel>

        <Tabs.Panel value="historial">
          <TramoHistorialTab
            tarifasHistoricas={tramo.tarifasHistoricas}
            getTarifaStatus={getTarifaStatus}
          />
        </Tabs.Panel>

        <Tabs.Panel value="estadisticas">
          <TramoEstadisticasTab
            tarifasHistoricas={tramo.tarifasHistoricas}
            tarifasVigentes={tarifasVigentes}
            tarifasFuturas={tarifasFuturas}
            tarifasPasadas={tarifasPasadas}
            createdAt={tramo.createdAt}
          />
        </Tabs.Panel>
      </Tabs>

      <TramoCostCalculatorModal
        opened={calculatorOpened}
        onClose={closeCalculator}
        calculating={calculating}
        calculationParams={calculationParams}
        setCalculationParams={setCalculationParams}
        calculationResult={calculationResult}
        onCalculate={() => calculateCost(tramo._id)}
      />
    </Stack>
  );
};

export default TramoDetail;
