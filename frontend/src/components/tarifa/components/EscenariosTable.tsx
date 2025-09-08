import React from 'react';
import { Card, Table, Button, Group, ActionIcon, Badge, Text, Stack, Alert } from '@mantine/core';
import { IconPlay, IconEdit, IconTrash, IconCopy, IconInfoCircle } from '@tabler/icons-react';
import type { IEscenarioSimulacion } from '../../../types/tarifa';

interface EscenariosTableProps {
  escenarios: IEscenarioSimulacion[];
  onEdit: (escenario: IEscenarioSimulacion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (escenario: IEscenarioSimulacion) => void;
  onExecute: (escenarios: IEscenarioSimulacion[]) => void;
  simulando: boolean;
}

const calculateTotal = (valores: { tarifa?: number; peaje?: number; extras?: number }): number =>
  (valores.tarifa || 0) + (valores.peaje || 0) + (valores.extras || 0);

const formatTotal = (valores: { tarifa?: number; peaje?: number; extras?: number }): string =>
  `$${calculateTotal(valores).toLocaleString()}`;

interface EscenarioRowProps {
  escenario: IEscenarioSimulacion;
  index: number;
  onEdit: (escenario: IEscenarioSimulacion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (escenario: IEscenarioSimulacion) => void;
}

const EscenarioRow: React.FC<EscenarioRowProps> = ({
  escenario,
  index,
  onEdit,
  onDelete,
  onDuplicate,
}) => (
  <Table.Tr key={index}>
    <Table.Td>
      <Text fw={500}>{escenario.nombre}</Text>
    </Table.Td>
    <Table.Td>
      <Text size="sm">{String(escenario.contexto.clienteNombre || 'No especificado')}</Text>
    </Table.Td>
    <Table.Td>
      <Text size="sm">{String(escenario.contexto.tramoNombre || 'No especificado')}</Text>
    </Table.Td>
    <Table.Td>
      <Badge variant="outline">{escenario.contexto.palets || 0}</Badge>
    </Table.Td>
    <Table.Td style={{ textAlign: 'right' }}>
      <Text fw={500}>{formatTotal(escenario.valoresBase)}</Text>
    </Table.Td>
    <Table.Td>
      <Group gap="xs" justify="center">
        <ActionIcon variant="light" color="blue" onClick={() => onEdit(escenario)} title="Editar">
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
          onClick={() => {
            const id = (escenario as { id?: string }).id;
            if (id) onDelete(id);
          }}
          title="Eliminar"
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Table.Td>
  </Table.Tr>
);

const EmptyState: React.FC = () => (
  <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
    <Text>
      No hay escenarios creados aún. Crea tu primer escenario para comenzar la simulación.
    </Text>
  </Alert>
);

const EscenariosTable: React.FC<EscenariosTableProps> = ({
  escenarios,
  onEdit,
  onDelete,
  onDuplicate,
  onExecute,
  simulando,
}) => {
  if (escenarios.length === 0) {
    return <EmptyState />;
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
              <EscenarioRow
                key={index}
                escenario={escenario}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
};

export default EscenariosTable;
