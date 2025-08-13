import React from 'react';
import { Table, Badge, Text, Group, ActionIcon, Menu, Stack } from '@mantine/core';
import { IconEdit, IconTrash, IconDots, IconHistory, IconCash } from '@tabler/icons-react';
import {
  TarifaHistorica,
  getTarifaStatus,
  getTipoBadgeColor,
  formatCurrency,
  formatDate,
} from './helpers/tarifaHistorialHelpers';

interface TarifaHistorialRowProps {
  tarifa: TarifaHistorica;
  readonly: boolean;
  onEdit?: (tarifa: TarifaHistorica) => void;
  onDelete?: (tarifa: TarifaHistorica) => void;
  onDuplicate?: (tarifa: TarifaHistorica) => void;
}

const TarifaHistorialRow: React.FC<TarifaHistorialRowProps> = ({
  tarifa,
  readonly,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const status = getTarifaStatus(tarifa);
  const StatusIcon = status.icon;

  return (
    <Table.Tr key={tarifa._id}>
      <Table.Td>
        <Badge color={getTipoBadgeColor(tarifa.tipo)} size="sm">
          {tarifa.tipo}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{tarifa.metodoCalculo}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconCash size={14} />
          <Text size="sm" fw={500}>
            {formatCurrency(tarifa.valor)}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatCurrency(tarifa.valorPeaje)}</Text>
      </Table.Td>
      <Table.Td>
        <Stack gap={0}>
          <Text size="xs">{formatDate(tarifa.vigenciaDesde)}</Text>
          <Text size="xs" c="dimmed">
            {formatDate(tarifa.vigenciaHasta)}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <StatusIcon size={14} color={status.color} />
          <Badge color={status.color} size="sm">
            {status.label}
          </Badge>
        </Group>
      </Table.Td>
      {!readonly && (
        <Table.Td>
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {onEdit && (
                <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(tarifa)}>
                  Editar
                </Menu.Item>
              )}
              {onDuplicate && (
                <Menu.Item
                  leftSection={<IconHistory size={14} />}
                  onClick={() => onDuplicate(tarifa)}
                >
                  Duplicar
                </Menu.Item>
              )}
              {onDelete && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    onClick={() => onDelete(tarifa)}
                  >
                    Eliminar
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      )}
    </Table.Tr>
  );
};

export default TarifaHistorialRow;
