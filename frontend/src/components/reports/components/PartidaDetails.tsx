import React from 'react';
import { Table, ScrollArea, Text, Badge, ActionIcon } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { formatCurrency, getEstadoColor } from '../utils/formatters';
import { PartidaReportData } from '../types';

interface PartidaDetailsProps {
  partidas: PartidaReportData[];
  onVerDetalle: (partida: PartidaReportData) => void;
}

const TableRow: React.FC<{
  partida: PartidaReportData;
  onVerDetalle: (partida: PartidaReportData) => void;
}> = ({ partida, onVerDetalle }) => (
  <Table.Tr key={partida.numero}>
    <Table.Td>
      <Text fw={500}>{partida.numero}</Text>
    </Table.Td>
    <Table.Td>{partida.ordenCompra}</Table.Td>
    <Table.Td>{partida.cliente}</Table.Td>
    <Table.Td>
      <Text truncate w={200}>
        {partida.descripcion}
      </Text>
    </Table.Td>
    <Table.Td>
      <Badge color={getEstadoColor(partida.estado)} size="sm">
        {partida.estado.toUpperCase()}
      </Badge>
    </Table.Td>
    <Table.Td>{formatCurrency(partida.montoOriginal)}</Table.Td>
    <Table.Td>{formatCurrency(partida.importePagado)}</Table.Td>
    <Table.Td>
      <Text c={partida.importePendiente > 0 ? 'orange' : 'green'}>
        {formatCurrency(partida.importePendiente)}
      </Text>
    </Table.Td>
    <Table.Td>
      <ActionIcon variant="light" onClick={() => onVerDetalle(partida)} aria-label="Ver detalle">
        <IconEye size={16} />
      </ActionIcon>
    </Table.Td>
  </Table.Tr>
);

const TableHeader: React.FC = () => (
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Partida</Table.Th>
      <Table.Th>OC</Table.Th>
      <Table.Th>Cliente</Table.Th>
      <Table.Th>Descripción</Table.Th>
      <Table.Th>Estado</Table.Th>
      <Table.Th>Monto Original</Table.Th>
      <Table.Th>Pagado</Table.Th>
      <Table.Th>Pendiente</Table.Th>
      <Table.Th>Acciones</Table.Th>
    </Table.Tr>
  </Table.Thead>
);

export const PartidaDetails: React.FC<PartidaDetailsProps> = ({ partidas, onVerDetalle }) => {
  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <TableHeader />
        <Table.Tbody>
          {partidas.map((partida) => (
            <TableRow key={partida.numero} partida={partida} onVerDetalle={onVerDetalle} />
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};
