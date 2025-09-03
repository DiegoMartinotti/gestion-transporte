import React from 'react';
import {
  Stack,
  Group,
  Button,
  Paper,
  Text,
  Table,
  Badge,
  ActionIcon,
  ScrollArea,
  Grid,
} from '@mantine/core';
import {
  IconDownload,
  IconEye,
  IconLayoutGrid,
  IconMath,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
} from '@tabler/icons-react';
import { IResultadoSimulacion } from '../../../types/tarifa';

interface EstadisticasData {
  totalEscenarios: number;
  totalOriginal: number;
  totalFinal: number;
  diferenciaTotalPct: number;
  promedioVariacion: number;
}

interface ResultadosViewProps {
  resultados: IResultadoSimulacion[];
  estadisticas: EstadisticasData | null;
  onExportar: (formato: 'excel' | 'pdf') => void;
  onViewDetalle: (resultado: IResultadoSimulacion) => void;
}

const EstadisticasCards: React.FC<{ estadisticas: EstadisticasData }> = ({ estadisticas }) => (
  <Grid>
    <Grid.Col span={3}>
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">
              Total Escenarios
            </Text>
            <Text fw={600} size="lg">
              {estadisticas.totalEscenarios}
            </Text>
          </div>
          <IconLayoutGrid size={32} color="gray" />
        </Group>
      </Paper>
    </Grid.Col>
    <Grid.Col span={3}>
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">
              Total Original
            </Text>
            <Text fw={600} size="lg">
              ${estadisticas.totalOriginal.toLocaleString()}
            </Text>
          </div>
          <IconMath size={32} color="gray" />
        </Group>
      </Paper>
    </Grid.Col>
    <Grid.Col span={3}>
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">
              Total Final
            </Text>
            <Text fw={600} size="lg">
              ${estadisticas.totalFinal.toLocaleString()}
            </Text>
          </div>
          {estadisticas.diferenciaTotalPct > 0 ? (
            <IconTrendingUp size={32} color="green" />
          ) : estadisticas.diferenciaTotalPct < 0 ? (
            <IconTrendingDown size={32} color="red" />
          ) : (
            <IconMath size={32} color="gray" />
          )}
        </Group>
      </Paper>
    </Grid.Col>
    <Grid.Col span={3}>
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">
              Variación Promedio
            </Text>
            <Text
              fw={600}
              size="lg"
              c={
                estadisticas.promedioVariacion > 0
                  ? 'green'
                  : estadisticas.promedioVariacion < 0
                    ? 'red'
                    : undefined
              }
            >
              {estadisticas.promedioVariacion.toFixed(2)}%
            </Text>
          </div>
          <IconChartBar size={32} color="blue" />
        </Group>
      </Paper>
    </Grid.Col>
  </Grid>
);

const TablaResultados: React.FC<{
  resultados: IResultadoSimulacion[];
  onExportar: (formato: 'excel' | 'pdf') => void;
  onViewDetalle: (resultado: IResultadoSimulacion) => void;
}> = ({ resultados, onExportar, onViewDetalle }) => (
  <Paper withBorder>
    <Group justify="space-between" p="md" pb={0}>
      <Text fw={600}>Resultados Detallados</Text>
      <Group>
        <Button
          size="sm"
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={() => onExportar('excel')}
        >
          Excel
        </Button>
        <Button
          size="sm"
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={() => onExportar('pdf')}
        >
          PDF
        </Button>
      </Group>
    </Group>
    <ScrollArea h={400}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Escenario</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Total Original</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Total Final</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Diferencia</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Variación %</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Reglas Aplicadas</Table.Th>
            <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {resultados.map((resultado, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <Text fw={600} size="sm">
                  {resultado.escenario}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                ${resultado.valoresOriginales.total.toLocaleString()}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                ${resultado.valoresFinales.total.toLocaleString()}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text
                  c={
                    resultado.diferencia.total > 0
                      ? 'red'
                      : resultado.diferencia.total < 0
                        ? 'green'
                        : undefined
                  }
                >
                  {resultado.diferencia.total > 0 ? '+' : ''}$
                  {resultado.diferencia.total.toLocaleString()}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Badge
                  color={
                    resultado.diferencia.porcentaje > 0
                      ? 'red'
                      : resultado.diferencia.porcentaje < 0
                        ? 'green'
                        : 'gray'
                  }
                  variant="light"
                >
                  {resultado.diferencia.porcentaje > 0 ? '+' : ''}
                  {resultado.diferencia.porcentaje.toFixed(2)}%
                </Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <Badge variant="light">{resultado.reglasAplicadas.length}</Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: 'center' }}>
                <ActionIcon variant="light" size="sm" onClick={() => onViewDetalle(resultado)}>
                  <IconEye size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Paper>
);

const ResultadosView: React.FC<ResultadosViewProps> = ({
  resultados,
  estadisticas,
  onExportar,
  onViewDetalle,
}) => (
  <Stack gap="md" mt="md">
    {estadisticas && <EstadisticasCards estadisticas={estadisticas} />}
    <TablaResultados
      resultados={resultados}
      onExportar={onExportar}
      onViewDetalle={onViewDetalle}
    />
  </Stack>
);

export default ResultadosView;
