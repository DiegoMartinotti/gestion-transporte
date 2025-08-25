import React from 'react';
import { Table, Badge, Text, ActionIcon, Group } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { TarifaHistorica } from '../../../types';

interface TramoTarifasTableProps {
  tarifas: TarifaHistorica[];
  onEdit: (tarifa: TarifaHistorica, index: number) => void;
  onDelete: (index: number) => void;
}

const TramoTarifasTable: React.FC<TramoTarifasTableProps> = ({ tarifas, onEdit, onDelete }) => (
  <Table striped highlightOnHover>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Tipo</Table.Th>
        <Table.Th>Método</Table.Th>
        <Table.Th>Valor</Table.Th>
        <Table.Th>Peaje</Table.Th>
        <Table.Th>Vigencia</Table.Th>
        <Table.Th>Estado</Table.Th>
        <Table.Th>Acciones</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {tarifas.map((tarifa: TarifaHistorica, index: number) => {
        const now = new Date();
        const desde = new Date(tarifa.vigenciaDesde);
        const hasta = new Date(tarifa.vigenciaHasta);
        const vigente = desde <= now && hasta >= now;

        return (
          <Table.Tr key={index}>
            <Table.Td>
              <Badge color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'}>{tarifa.tipo}</Badge>
            </Table.Td>
            <Table.Td>{tarifa.metodoCalculo}</Table.Td>
            <Table.Td>${tarifa.valor}</Table.Td>
            <Table.Td>${tarifa.valorPeaje}</Table.Td>
            <Table.Td>
              <Text size="xs">
                {new Date(tarifa.vigenciaDesde).toLocaleDateString()} -{' '}
                {new Date(tarifa.vigenciaHasta).toLocaleDateString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Badge color={vigente ? 'green' : 'gray'} size="sm">
                {vigente ? 'Vigente' : 'No vigente'}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <ActionIcon size="sm" variant="light" onClick={() => onEdit(tarifa, index)}>
                  <IconEdit size={14} />
                </ActionIcon>
                <ActionIcon size="sm" variant="light" color="red" onClick={() => onDelete(index)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        );
      })}
    </Table.Tbody>
  </Table>
);

export default TramoTarifasTable;
