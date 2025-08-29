import React from 'react';
import {
  Card,
  Table,
  ActionIcon,
  Badge,
  Text,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { IResultadoSimulacion } from '../../../types/tarifa';

interface ResultadosTableProps {
  resultados: IResultadoSimulacion[];
  onViewDetails: (resultado: IResultadoSimulacion) => void;
}

const ResultadosTable: React.FC<ResultadosTableProps> = ({
  resultados,
  onViewDetails,
}) => {
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
          {resultados.map((resultado, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Text fw={500}>{resultado.escenarioNombre}</Text>
                <Text size="xs" c="dimmed">
                  {new Date(resultado.fechaEjecucion).toLocaleDateString()}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text fw={500}>${resultado.totalCalculado.toLocaleString()}</Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text
                  c={resultado.diferencia > 0 ? 'red' : resultado.diferencia < 0 ? 'green' : undefined}
                  fw={500}
                >
                  {resultado.diferencia > 0 ? '+' : ''}${resultado.diferencia.toLocaleString()}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Badge
                  color={resultado.estado === 'exitoso' ? 'green' : 'red'}
                  variant="light"
                >
                  {resultado.estado}
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
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
};

export default ResultadosTable;