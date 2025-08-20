import React from 'react';
import { Grid, Card, Badge, Text, Menu, Group, ActionIcon } from '@mantine/core';
import {
  IconHistory,
  IconEdit,
  IconTrash,
  IconMapPin,
  IconRoad,
  IconMap,
  IconDots,
} from '@tabler/icons-react';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { getTarifaStatus } from '../utils/tarifaUtils';

interface TramosCardsViewProps {
  tramos: Tramo[];
  detailModal: ModalReturn<Tramo>;
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
}

export const TramosCardsView: React.FC<TramosCardsViewProps> = ({
  tramos,
  detailModal,
  formModal,
  deleteModal,
}) => {
  return (
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
};
