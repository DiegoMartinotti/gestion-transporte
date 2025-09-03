import React from 'react';
import { Grid, Paper, Stack, Title, Text } from '@mantine/core';
import { IconRoute } from '@tabler/icons-react';
import TarifaCalculator from './TarifaCalculator';
import { TarifaVersioning } from '../versioning/TarifaVersioning';
import { TarifaConflictDetector } from '../detectors/TarifaConflictDetector';
import { TipoCalculoSelector } from '../selectors/TipoCalculoSelector';
import { TarifaPreview } from '../preview/TarifaPreview';
import { Tramo } from '../../types';

type ActiveView = 'calculadora' | 'versiones' | 'configuracion';

interface CalculadoraContentProps {
  activeView: ActiveView;
  selectedTramo: Tramo | null;
}

export const CalculadoraContent: React.FC<CalculadoraContentProps> = ({
  activeView,
  selectedTramo,
}) => {
  if (!selectedTramo) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <IconRoute size={48} color="gray" />
          <Title order={4} c="dimmed">
            Seleccione un tramo
          </Title>
          <Text c="dimmed" ta="center">
            Elija un tramo del selector superior para comenzar a calcular tarifas
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Grid>
      {activeView === 'calculadora' && (
        <>
          <Grid.Col span={12}>
            <TarifaCalculator
              tramoId={selectedTramo._id}
              tramo={selectedTramo}
              onCalculationChange={(result) => {
                console.log('Resultado cálculo:', result);
              }}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <TarifaPreview
              tramoId={selectedTramo._id}
              version={{
                tipoCalculo: 'peso',
                tarifasPorTipo: {
                  chico: 100,
                  semi: 150,
                  acoplado: 200,
                  bitrén: 250,
                },
              }}
            />
          </Grid.Col>
        </>
      )}

      {activeView === 'versiones' && (
        <Grid.Col span={12}>
          <TarifaVersioning
            tramoId={selectedTramo._id}
            onVersionSelect={(version) => {
              console.log('Versión seleccionada:', version);
            }}
          />
        </Grid.Col>
      )}

      {activeView === 'configuracion' && (
        <>
          <Grid.Col span={6}>
            <TipoCalculoSelector
              value="peso"
              onChange={(tipo, config) => {
                console.log('Configuración cambiada:', tipo, config);
              }}
              showPreview={true}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <TarifaConflictDetector
              tramoId={selectedTramo._id}
              versions={[]}
              onConflictResolved={(resolution) => {
                console.log('Conflicto resuelto:', resolution);
              }}
            />
          </Grid.Col>
        </>
      )}
    </Grid>
  );
};
