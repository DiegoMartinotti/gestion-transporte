import React from 'react';
import {
  Paper,
  LoadingOverlay,
  Grid,
  Card,
  Group,
  Text,
  Button,
  ActionIcon,
  Stack,
  Menu,
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconRoad,
  IconDots,
  IconEdit,
  IconHistory,
  IconMap,
  IconTrash,
} from '@tabler/icons-react';
import DataTable from '../../components/base/DataTable';
import TarifaStatus from './TarifaStatus';
import { Tramo } from '../../types';

// Helper functions para renderizado
const renderRutaColumn = (tramo: Tramo) => {
  if (!tramo || !tramo.origen || !tramo.destino) {
    return (
      <Text size="sm" c="dimmed">
        Datos incompletos
      </Text>
    );
  }
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <IconMapPin size={16} color="green" />
        <Text size="sm" fw={500}>
          {tramo.origen.nombre}
        </Text>
      </Group>
      <Group gap="xs" ml="md">
        <IconRoad size={16} color="gray" />
        <Text size="xs" c="dimmed">
          {tramo.distancia} km
        </Text>
      </Group>
      <Group gap="xs">
        <IconMapPin size={16} color="red" />
        <Text size="sm" fw={500}>
          {tramo.destino.nombre}
        </Text>
      </Group>
    </Stack>
  );
};

const renderClienteColumn = (tramo: Tramo) => {
  if (!tramo || !tramo.cliente) {
    return (
      <Text size="sm" c="dimmed">
        Sin cliente
      </Text>
    );
  }
  return (
    <Text size="sm" fw={500}>
      {tramo.cliente.nombre}
    </Text>
  );
};

const renderAccionesColumn = (
  tramo: Tramo,
  onEdit: (tramo: Tramo) => void,
  onView: (tramo: Tramo) => void,
  onDelete: (tramo: Tramo) => void
) => (
  <Menu withinPortal>
    <Menu.Target>
      <ActionIcon variant="subtle">
        <IconDots size={16} />
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(tramo)}>
        Editar
      </Menu.Item>
      <Menu.Item leftSection={<IconHistory size={16} />} onClick={() => onView(tramo)}>
        Ver detalle
      </Menu.Item>
      <Menu.Item
        leftSection={<IconMap size={16} />}
        onClick={() => {
          /* TODO: Ver en mapa */
        }}
      >
        Ver en mapa
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => onDelete(tramo)}>
        Eliminar
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
);

interface TramosListProps {
  tramos: Tramo[];
  viewMode: 'list' | 'cards';
  loading: boolean;
  onEdit: (tramo: Tramo) => void;
  onView: (tramo: Tramo) => void;
  onDelete: (tramo: Tramo) => void;
}

const TramosList: React.FC<TramosListProps> = ({
  tramos,
  viewMode,
  loading,
  onEdit,
  onView,
  onDelete,
}) => {
  const columns = [
    {
      key: 'ruta',
      label: 'Ruta',
      render: renderRutaColumn,
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: renderClienteColumn,
    },
    {
      key: 'tarifa',
      label: 'Tarifa Vigente',
      render: (tramo: Tramo) => <TarifaStatus tramo={tramo} />,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (tramo: Tramo) => renderAccionesColumn(tramo, onEdit, onView, onDelete),
    },
  ];

  const renderTramoCard = (tramo: Tramo) => (
    <Card key={tramo._id} shadow="sm" padding="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconRoute size={20} />
          <Text fw={500}>{tramo.cliente.nombre}</Text>
        </Group>
        <TarifaStatus tramo={tramo} />
      </Group>

      <Stack gap="xs" mb="md">
        <Group gap="xs">
          <IconMapPin size={16} color="green" />
          <Text size="sm">{tramo.origen.nombre}</Text>
        </Group>
        <Group gap="xs" justify="center">
          <IconRoad size={16} />
          <Text size="xs" c="dimmed">
            {tramo.distancia} km
          </Text>
        </Group>
        <Group gap="xs">
          <IconMapPin size={16} color="red" />
          <Text size="sm">{tramo.destino.nombre}</Text>
        </Group>
      </Stack>

      <Group justify="space-between">
        <Button variant="light" size="xs" onClick={() => onView(tramo)}>
          Ver detalle
        </Button>
        <Group gap="xs">
          <ActionIcon variant="light" onClick={() => onEdit(tramo)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="red" onClick={() => onDelete(tramo)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={loading} />

      {viewMode === 'list' ? (
        <DataTable
          data={tramos}
          columns={columns}
          loading={loading}
          emptyMessage="No se encontraron tramos"
        />
      ) : (
        <Grid>
          {tramos.map((tramo) => (
            <Grid.Col key={tramo._id} span={{ base: 12, sm: 6, md: 4 }}>
              {renderTramoCard(tramo)}
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default TramosList;
