import React from 'react';
import { Card, Table, ActionIcon, Badge, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { IResultadoSimulacion } from '../../../types/tarifa';

interface ResultadosTableProps {
  resultados: IResultadoSimulacion[];
  onViewDetails: (resultado: IResultadoSimulacion) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const formatDifference = (value: number) => {
  if (value === 0) {
    return formatCurrency(0);
  }
  const absolute = Math.abs(value);
  const sign = value > 0 ? '+' : '-';
  return `${sign}${formatCurrency(absolute)}`;
};

const getEstado = (difference: number) => {
  if (difference === 0) {
    return { label: 'Sin cambios', color: 'gray' as const };
  }
  if (difference > 0) {
    return { label: 'Incremento', color: 'red' as const };
  }
  return { label: 'Reducción', color: 'green' as const };
};

const getDifferenceColor = (difference: number) => {
  if (difference > 0) {
    return 'red';
  }
  if (difference < 0) {
    return 'green';
  }
  return undefined;
};

const ResultadosTable: React.FC<ResultadosTableProps> = ({ resultados, onViewDetails }) => {
  if (resultados.length === 0) {
    return (
      <Alert variant="light" color="yellow" icon={<IconInfoCircle size={16} />}>
        <Text>No hay resultados de simulación disponibles.</Text>
      </Alert>
    );
  }

  return (
    <Card withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Escenario</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Total Calculado</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Diferencia</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Estado</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {resultados.map((resultado, index) => {
            const rowKey = `${resultado.escenario}-${index}`;
            const totalCalculado = resultado.valoresFinales.total;
            const diferenciaTotal = resultado.diferencia.total;
            const differenceLabel = formatDifference(diferenciaTotal);
            const differenceColor = getDifferenceColor(diferenciaTotal);
            const porcentaje = resultado.diferencia.porcentaje;
            const { label: estadoLabel, color: estadoColor } = getEstado(diferenciaTotal);

            return (
              <Table.Tr key={rowKey}>
                {/*
                 * indice + escenario se usa para mantener la fila estable incluso si llegan
                 * resultados con el mismo escenario en diferentes consultas
                 */}
                <Table.Td>
                  <Text fw={500}>{resultado.escenario}</Text>
                  <Text size="xs" c="dimmed">
                    Total base: {formatCurrency(resultado.valoresOriginales.total)}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={500}>{formatCurrency(totalCalculado)}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text c={differenceColor} fw={500}>
                    {differenceLabel}
                    {porcentaje !== undefined && (
                      <Text component="span" size="xs" c="dimmed" fw={400} ml="xs">
                        ({porcentaje}%)
                      </Text>
                    )}
                  </Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <Badge color={estadoColor} variant="light">
                    {estadoLabel}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'center' }}>
                  <ActionIcon
                    variant="light"
                    onClick={() => onViewDetails(resultado)}
                    title="Ver detalles"
                  >
                    <IconInfoCircle size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Card>
  );
};

export default ResultadosTable;
