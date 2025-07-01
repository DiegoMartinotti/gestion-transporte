import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Title,
  Group,
  Select,
  Paper,
  Grid,
  Card,
  Text,
  Badge,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconCalculator,
  IconRoute,
  IconHistory,
  IconSettings,
  IconRefresh
} from '@tabler/icons-react';
import { TarifaCalculator } from '../../components/calculators/TarifaCalculator';
import { TarifaVersioning } from '../../components/versioning/TarifaVersioning';
import { TarifaConflictDetector } from '../../components/detectors/TarifaConflictDetector';
import { TipoCalculoSelector } from '../../components/selectors/TipoCalculoSelector';
import { TarifaPreview } from '../../components/preview/TarifaPreview';
import { TramosSelector } from '../../components/selectors/TramosSelector';
import { Tramo } from '../../types/tramo';


const CalculadoraPage: React.FC = () => {
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);
  const [activeView, setActiveView] = useState<'calculadora' | 'versiones' | 'configuracion'>('calculadora');

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconCalculator size={32} color="blue" />
            <Title order={2}>Calculadora de Tarifas</Title>
          </Group>
          
          <Group gap="xs">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => setActiveView('calculadora')}
              size="lg"
              style={{ 
                backgroundColor: activeView === 'calculadora' ? 'var(--mantine-color-blue-1)' : undefined 
              }}
            >
              <Tooltip label="Calculadora">
                <IconCalculator size={18} />
              </Tooltip>
            </ActionIcon>
            
            <ActionIcon
              variant="light"
              color="orange"
              onClick={() => setActiveView('versiones')}
              size="lg"
              style={{ 
                backgroundColor: activeView === 'versiones' ? 'var(--mantine-color-orange-1)' : undefined 
              }}
            >
              <Tooltip label="Versiones">
                <IconHistory size={18} />
              </Tooltip>
            </ActionIcon>
            
            <ActionIcon
              variant="light"
              color="gray"
              onClick={() => setActiveView('configuracion')}
              size="lg"
              style={{ 
                backgroundColor: activeView === 'configuracion' ? 'var(--mantine-color-gray-1)' : undefined 
              }}
            >
              <Tooltip label="Configuración">
                <IconSettings size={18} />
              </Tooltip>
            </ActionIcon>
            
            <ActionIcon
              variant="light"
              onClick={() => window.location.reload()}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Selector de Tramo */}
        <TramosSelector
          onTramoSelect={(tramo) => setSelectedTramo(tramo)}
          selectedTramo={selectedTramo}
        />

        {/* Contenido Principal */}
        {selectedTramo ? (
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
                        bitrén: 250
                      }
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
        ) : (
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <IconRoute size={48} color="gray" />
              <Title order={4} c="dimmed">Seleccione un tramo</Title>
              <Text c="dimmed" ta="center">
                Elija un tramo del selector superior para comenzar a calcular tarifas
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default CalculadoraPage;