import React from 'react';
import {
  Card,
  Table,
  Button,
  Group,
  ActionIcon,
  Badge,
  Text,
  Stack,
  Alert,
} from '@mantine/core';
import {
  IconPlay,
  IconEdit,
  IconTrash,
  IconCopy,
  IconInfoCircle,
} from '@tabler/icons-react';
import type { IEscenarioSimulacion } from '../../../types/tarifa';

interface EscenariosTableProps {
  escenarios: IEscenarioSimulacion[];
  onEdit: (escenario: IEscenarioSimulacion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (escenario: IEscenarioSimulacion) => void;
  onExecute: (escenarios: IEscenarioSimulacion[]) => void;
  simulando: boolean;
}

const EscenariosTable: React.FC<EscenariosTableProps> = ({
  escenarios,
  onEdit,
  onDelete,
  onDuplicate,
  onExecute,
  simulando,
}) => {
  if (escenarios.length === 0) {
    return (
      <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
        <Text>
          No hay escenarios creados aún. Crea tu primer escenario para comenzar la simulación.
        </Text>
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Escenarios de Simulación ({escenarios.length})</Text>
        <Button
          leftSection={<IconPlay size={16} />}
          onClick={() => onExecute(escenarios)}
          loading={simulando}
          disabled={simulando}
        >
          Ejecutar Simulación
        </Button>
      </Group>

      <Card withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Tramo</Table.Th>
              <Table.Th>Palets</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Base</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {escenarios.map((escenario, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Text fw={500}>{escenario.nombre}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{escenario.contexto.clienteNombre || 'No especificado'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{escenario.contexto.tramoNombre || 'No especificado'}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline">{escenario.contexto.palets || 0}</Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={500}>
                    ${(
                      (escenario.valoresBase.tarifa || 0) +
                      (escenario.valoresBase.peaje || 0) +
                      (escenario.valoresBase.extras || 0)
                    ).toLocaleString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="center">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onEdit(escenario)}
                      title="Editar"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => onDuplicate(escenario)}
                      title="Duplicar"
                    >
                      <IconCopy size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => escenario.id && onDelete(escenario.id)}
                      title="Eliminar"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
};

export default EscenariosTable;