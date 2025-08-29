import React from 'react';
import {
  Stack,
  Group,
  Button,
  Paper,
  Text,
  Alert,
  Card,
  Grid,
  ActionIcon,
  Badge,
  Divider,
} from '@mantine/core';
import { IconPlus, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { IEscenarioSimulacion } from '../../../types/tarifa';
import { Cliente } from '../../../types';

interface EscenariosListProps {
  escenarios: IEscenarioSimulacion[];
  clientes: Cliente[];
  onAddEscenario: () => void;
  onRemoveEscenario: (index: number) => void;
}

const EscenariosList: React.FC<EscenariosListProps> = ({
  escenarios,
  clientes,
  onAddEscenario,
  onRemoveEscenario,
}) => {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text fw={600}>Escenarios de Simulación</Text>
        <Button leftSection={<IconPlus size={16} />} size="sm" onClick={onAddEscenario}>
          Nuevo Escenario
        </Button>
      </Group>

      {escenarios.length === 0 ? (
        <Alert variant="light" color="gray" icon={<IconAlertCircle size={16} />}>
          <Text>
            No hay escenarios definidos. Agrega al menos uno para ejecutar la simulación.
          </Text>
        </Alert>
      ) : (
        <Grid>
          {escenarios.map((escenario, index) => (
            <Grid.Col key={index} span={6}>
              <Card withBorder>
                <Group justify="space-between" mb="sm">
                  <Text fw={600} size="sm">
                    {escenario.nombre}
                  </Text>
                  <ActionIcon
                    color="red"
                    variant="light"
                    size="sm"
                    onClick={() => onRemoveEscenario(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                <Stack gap="xs">
                  <Group>
                    <Text size="xs" c="dimmed">
                      Cliente:
                    </Text>
                    <Text size="xs">
                      {clientes.find((c) => c._id === escenario.contexto.cliente)?.nombre ||
                        'No especificado'}
                    </Text>
                  </Group>

                  <Group>
                    <Text size="xs" c="dimmed">
                      Distancia:
                    </Text>
                    <Text size="xs">{escenario.contexto.distancia} km</Text>
                  </Group>

                  <Group>
                    <Text size="xs" c="dimmed">
                      Palets:
                    </Text>
                    <Text size="xs">{escenario.contexto.palets}</Text>
                  </Group>

                  <Divider my="xs" />

                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Total Base:
                    </Text>
                    <Badge variant="light">
                      $
                      {(
                        escenario.valoresBase.tarifa +
                        escenario.valoresBase.peaje +
                        escenario.valoresBase.extras
                      ).toLocaleString()}
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default EscenariosList;