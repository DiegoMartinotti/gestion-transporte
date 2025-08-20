import React from 'react';
import {
  Paper,
  LoadingOverlay,
  Group,
  ActionIcon,
  Grid,
  Card,
  Badge,
  Text,
  Menu,
} from '@mantine/core';
import {
  IconHistory,
  IconEdit,
  IconTrash,
  IconMapPin,
  IconRoad,
  IconMap,
  IconDots,
} from '@tabler/icons-react';
import DataTable from '../../../components/base/DataTable';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { getTarifaStatus } from '../utils/tarifaUtils';

interface TramosDataViewProps {
  tramos: Tramo[];
  viewMode: 'list' | 'cards';
  loading: boolean;
  detailModal: ModalReturn<Tramo>;
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
}

export const TramosDataView: React.FC<TramosDataViewProps> = ({
  tramos,
  viewMode,
  loading,
  detailModal,
  formModal,
  deleteModal,
}) => {
  const renderListView = () => (
    <DataTable
      data={tramos}
      columns={[
        { key: 'cliente.nombre', header: 'Cliente', sortable: true },
        { key: 'origen.nombre', header: 'Origen', sortable: true },
        { key: 'destino.nombre', header: 'Destino', sortable: true },
        { key: 'distancia', header: 'Distancia (km)', sortable: true },
        {
          key: 'tarifa',
          header: 'Tarifa',
          render: getTarifaStatus,
        },
        {
          key: 'actions',
          header: 'Acciones',
          render: (tramo: Tramo) => (
            <Group gap="xs">
              <ActionIcon size="sm" variant="light" onClick={() => detailModal.openView(tramo)}>
                <IconHistory size={14} />
              </ActionIcon>
              <ActionIcon size="sm" variant="light" onClick={() => formModal.openEdit(tramo)}>
                <IconEdit size={14} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="light"
                color="red"
                onClick={() => deleteModal.openDelete(tramo)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ),
        },
      ]}
    />
  );

  const renderCardsView = () => (
    <Grid>
      {tramos.map((tramo) => (
        <Grid.Col key={tramo._id} span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder h="100%">
            <Group justify="space-between" mb="xs">
              <Badge color="blue" size="sm">
                {tramo.cliente.nombre}
              </Badge>
              <Menu>
                <Menu.Target>
                  <ActionIcon size="sm" variant="light">
                    <IconDots size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconHistory size={14} />}
                    onClick={() => detailModal.openView(tramo)}
                  >
                    Ver detalle
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => formModal.openEdit(tramo)}
                  >
                    Editar
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    onClick={() => deleteModal.openDelete(tramo)}
                  >
                    Eliminar
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Group mb="xs">
              <IconMapPin size={16} />
              <Text size="sm" fw={500}>
                {tramo.origen.nombre}
              </Text>
            </Group>

            <Group mb="xs">
              <IconRoad size={16} />
              <Text size="sm" fw={500}>
                {tramo.destino.nombre}
              </Text>
            </Group>

            <Group mb="md">
              <IconMap size={16} />
              <Text size="sm" c="dimmed">
                {tramo.distancia} km
              </Text>
            </Group>

            {getTarifaStatus(tramo)}
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={loading} />
      {viewMode === 'list' ? renderListView() : renderCardsView()}
    </Paper>
  );
};
