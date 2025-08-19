import React from 'react';
import { Table, Text, Group } from '@mantine/core';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { TarifaHistorica } from './helpers/tarifaHistorialHelpers';

interface TarifaHistorialTableHeaderProps {
  readonly: boolean;
  sortField: keyof TarifaHistorica;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof TarifaHistorica) => void;
}

const TarifaHistorialTableHeader: React.FC<TarifaHistorialTableHeaderProps> = ({
  readonly,
  sortField,
  sortDirection,
  onSort,
}) => {
  const getSortIcon = (field: keyof TarifaHistorica) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <IconSortAscending size={14} />
    ) : (
      <IconSortDescending size={14} />
    );
  };

  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th>
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => onSort('tipo')}>
            <Text size="sm" fw={500}>
              Tipo
            </Text>
            {getSortIcon('tipo')}
          </Group>
        </Table.Th>
        <Table.Th>
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => onSort('metodoCalculo')}>
            <Text size="sm" fw={500}>
              Método
            </Text>
            {getSortIcon('metodoCalculo')}
          </Group>
        </Table.Th>
        <Table.Th>
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => onSort('valor')}>
            <Text size="sm" fw={500}>
              Valor
            </Text>
            {getSortIcon('valor')}
          </Group>
        </Table.Th>
        <Table.Th>
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => onSort('valorPeaje')}>
            <Text size="sm" fw={500}>
              Peaje
            </Text>
            {getSortIcon('valorPeaje')}
          </Group>
        </Table.Th>
        <Table.Th>
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => onSort('vigenciaDesde')}>
            <Text size="sm" fw={500}>
              Vigencia
            </Text>
            {getSortIcon('vigenciaDesde')}
          </Group>
        </Table.Th>
        <Table.Th>Estado</Table.Th>
        {!readonly && <Table.Th>Acciones</Table.Th>}
      </Table.Tr>
    </Table.Thead>
  );
};

export default TarifaHistorialTableHeader;
