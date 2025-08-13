import React, { useState } from 'react';
import { Container, Tabs, Stack, Title, Text, Paper, Alert, Button, Group } from '@mantine/core';
import {
  IconSettings,
  IconChartBar,
  IconHistory,
  IconPlayerPlay,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  TarifaMetodoManager,
  ReglaTarifaBuilder,
  TarifaSimulator,
  AuditoriaViewer,
  ITarifaMetodo,
  IReglaTarifa,
} from '../components/tarifa';

/**
 * Página principal del sistema de tarifas flexibles
 * Integra todos los componentes del sistema de tarifación avanzada
 */
const TarifasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>('metodos');
  const [metodosDisponibles, setMetodosDisponibles] = useState<ITarifaMetodo[]>([]);
  const [reglasDisponibles, setReglasDisponibles] = useState<IReglaTarifa[]>([]);

  const _handleMetodosChange = (metodos: ITarifaMetodo[]) => {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    setMetodosDisponibles(metodos);
  };

  const handleReglasChange = (reglas: IReglaTarifa[]) => {
    setReglasDisponibles(reglas);
  };

  const handleQuickStart = () => {
    // Ejemplo de configuración rápida
    setActiveTab('metodos');
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1}>Sistema de Tarifas Flexibles</Title>
          <Text size="lg" c="dimmed" mt="sm">
            Gestiona métodos de cálculo, reglas de negocio, simulaciones y auditoría del sistema de
            tarifas
          </Text>
        </div>

        {/* Quick info */}
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Sistema de Tarifación Avanzada"
          color="blue"
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              Este sistema permite configurar tarifas dinámicas basadas en fórmulas personalizadas y
              reglas de negocio. Incluye simulación de escenarios y auditoría completa de todos los
              cálculos.
            </Text>
            <Group gap="xs">
              <Button size="xs" variant="light" onClick={handleQuickStart}>
                Inicio Rápido
              </Button>
              <Text size="xs" c="dimmed">
                • Define métodos de cálculo • Crea reglas de negocio • Simula escenarios • Revisa la
                auditoría
              </Text>
            </Group>
          </Stack>
        </Alert>

        {/* Main content with tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="metodos" leftSection={<IconSettings size={20} />}>
              Métodos de Cálculo
            </Tabs.Tab>
            <Tabs.Tab value="reglas" leftSection={<IconSettings size={20} />}>
              Reglas de Negocio
            </Tabs.Tab>
            <Tabs.Tab value="simulador" leftSection={<IconChartBar size={20} />}>
              Simulador
            </Tabs.Tab>
            <Tabs.Tab value="auditoria" leftSection={<IconHistory size={20} />}>
              Auditoría
            </Tabs.Tab>
          </Tabs.List>

          {/* Métodos de Cálculo */}
          <Tabs.Panel value="metodos" pt="xl">
            <Paper p="md" mb="md" withBorder bg="blue.0">
              <Group align="center" gap="sm">
                <IconSettings size={24} color="blue" />
                <div>
                  <Text fw={600} size="lg">
                    Métodos de Cálculo de Tarifas
                  </Text>
                  <Text size="sm" c="dimmed">
                    Define los métodos base para el cálculo de tarifas. Configura fórmulas,
                    variables y parámetros.
                  </Text>
                </div>
              </Group>
            </Paper>

            <TarifaMetodoManager />
          </Tabs.Panel>

          {/* Reglas de Negocio */}
          <Tabs.Panel value="reglas" pt="xl">
            <Paper p="md" mb="md" withBorder bg="green.0">
              <Group align="center" gap="sm">
                <IconSettings size={24} color="green" />
                <div>
                  <Text fw={600} size="lg">
                    Constructor de Reglas de Negocio
                  </Text>
                  <Text size="sm" c="dimmed">
                    Crea reglas que modifican automáticamente las tarifas según condiciones
                    específicas. Define descuentos, recargos y modificaciones personalizadas.
                  </Text>
                </div>
              </Group>
            </Paper>

            <ReglaTarifaBuilder onRuleChange={handleReglasChange} />
          </Tabs.Panel>

          {/* Simulador */}
          <Tabs.Panel value="simulador" pt="xl">
            <Paper p="md" mb="md" withBorder bg="orange.0">
              <Group align="center" gap="sm">
                <IconPlayerPlay size={24} color="orange" />
                <div>
                  <Text fw={600} size="lg">
                    Simulador de Escenarios
                  </Text>
                  <Text size="sm" c="dimmed">
                    Prueba diferentes escenarios de cálculo. Compara resultados y analiza el impacto
                    de las reglas en distintas situaciones.
                  </Text>
                </div>
              </Group>
            </Paper>

            <TarifaSimulator
              metodosDisponibles={metodosDisponibles}
              reglasDisponibles={reglasDisponibles}
            />
          </Tabs.Panel>

          {/* Auditoría */}
          <Tabs.Panel value="auditoria" pt="xl">
            <Paper p="md" mb="md" withBorder bg="purple.0">
              <Group align="center" gap="sm">
                <IconHistory size={24} color="purple" />
                <div>
                  <Text fw={600} size="lg">
                    Auditoría y Monitoreo
                  </Text>
                  <Text size="sm" c="dimmed">
                    Revisa el historial completo de cálculos. Analiza performance, errores y
                    tendencias del sistema de tarifación.
                  </Text>
                </div>
              </Group>
            </Paper>

            <AuditoriaViewer showMetrics={true} showFilters={true} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default TarifasPage;
