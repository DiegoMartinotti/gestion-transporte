import React, { useState, useEffect } from 'react';
import { 
  Paper, Title, Grid, Card, Text, Badge, Group, Select, Button, 
  Stack, Tabs, Table, ScrollArea, Alert, Progress, ActionIcon,
  Modal, TextInput, NumberInput
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconFileReport, IconDownload, IconFilter, IconEye, 
  IconCalendar, IconCurrency, IconTrendingUp, IconAlertTriangle,
  IconFileExport, IconPrinter, IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { EstadoPartida } from '../../types/ordenCompra';

interface PartidaReportData {
  numero: string;
  ordenCompra: string;
  cliente: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaCreacion: Date;
  fechaVencimiento?: Date;
  fechaPago?: Date;
  diasVencimiento?: number;
}

interface FiltrosReporte {
  estadoPartida?: EstadoPartida | '';
  cliente?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  montoMinimo?: number;
  montoMaximo?: number;
  soloVencidas?: boolean;
}

interface ResumenFinanciero {
  totalPartidas: number;
  montoTotalOriginal: number;
  montoTotalPagado: number;
  montoTotalPendiente: number;
  porcentajePagado: number;
  partidasAbiertas: number;
  partidasPagadas: number;
  partidasVencidas: number;
  promedioTiempoPago: number;
}

export const PartidaReport: React.FC = () => {
  const [partidas, setPartidas] = useState<PartidaReportData[]>([]);
  const [partidasFiltradas, setPartidasFiltradas] = useState<PartidaReportData[]>([]);
  const [filtros, setFiltros] = useState<FiltrosReporte>({});
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [partidaSeleccionada, setPartidaSeleccionada] = useState<PartidaReportData | null>(null);

  // Datos de ejemplo
  useEffect(() => {
    const partidasEjemplo: PartidaReportData[] = [
      {
        numero: 'P-001',
        ordenCompra: 'OC-2024-001',
        cliente: 'TECPETROL S.A.',
        descripcion: 'Transporte de equipos - Enero',
        montoOriginal: 850000,
        importePagado: 850000,
        importePendiente: 0,
        estado: 'pagada',
        fechaCreacion: new Date('2024-01-15'),
        fechaVencimiento: new Date('2024-02-15'),
        fechaPago: new Date('2024-02-10')
      },
      {
        numero: 'P-002',
        ordenCompra: 'OC-2024-002',
        cliente: 'YPF S.A.',
        descripcion: 'Servicios de transporte - Febrero',
        montoOriginal: 1200000,
        importePagado: 600000,
        importePendiente: 600000,
        estado: 'abierta',
        fechaCreacion: new Date('2024-02-01'),
        fechaVencimiento: new Date('2024-03-15')
      },
      {
        numero: 'P-003',
        ordenCompra: 'OC-2024-003',
        cliente: 'SHELL ARGENTINA S.A.',
        descripcion: 'Transporte especializado',
        montoOriginal: 750000,
        importePagado: 0,
        importePendiente: 750000,
        estado: 'vencida',
        fechaCreacion: new Date('2024-01-20'),
        fechaVencimiento: new Date('2024-02-20'),
        diasVencimiento: 15
      }
    ];
    
    setPartidas(partidasEjemplo);
    setPartidasFiltradas(partidasEjemplo);
  }, []);

  const calcularResumen = (partidas: PartidaReportData[]): ResumenFinanciero => {
    const totalPartidas = partidas.length;
    const montoTotalOriginal = partidas.reduce((sum, p) => sum + p.montoOriginal, 0);
    const montoTotalPagado = partidas.reduce((sum, p) => sum + p.importePagado, 0);
    const montoTotalPendiente = partidas.reduce((sum, p) => sum + p.importePendiente, 0);
    const porcentajePagado = montoTotalOriginal > 0 ? (montoTotalPagado / montoTotalOriginal) * 100 : 0;
    
    const partidasAbiertas = partidas.filter(p => p.estado === 'abierta').length;
    const partidasPagadas = partidas.filter(p => p.estado === 'pagada').length;
    const partidasVencidas = partidas.filter(p => p.estado === 'vencida').length;
    
    const partidasConPago = partidas.filter(p => p.fechaPago);
    const promedioTiempoPago = partidasConPago.length > 0 
      ? partidasConPago.reduce((sum, p) => {
          if (p.fechaPago && p.fechaCreacion) {
            return sum + (p.fechaPago.getTime() - p.fechaCreacion.getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0) / partidasConPago.length
      : 0;

    return {
      totalPartidas,
      montoTotalOriginal,
      montoTotalPagado,
      montoTotalPendiente,
      porcentajePagado,
      partidasAbiertas,
      partidasPagadas,
      partidasVencidas,
      promedioTiempoPago
    };
  };

  const aplicarFiltros = () => {
    let resultado = [...partidas];
    
    if (filtros.estadoPartida) {
      resultado = resultado.filter(p => p.estado === filtros.estadoPartida);
    }
    
    if (filtros.cliente) {
      resultado = resultado.filter(p => 
        p.cliente.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }
    
    if (filtros.fechaDesde) {
      resultado = resultado.filter(p => p.fechaCreacion >= filtros.fechaDesde!);
    }
    
    if (filtros.fechaHasta) {
      resultado = resultado.filter(p => p.fechaCreacion <= filtros.fechaHasta!);
    }
    
    if (filtros.montoMinimo !== undefined) {
      resultado = resultado.filter(p => p.montoOriginal >= filtros.montoMinimo!);
    }
    
    if (filtros.montoMaximo !== undefined) {
      resultado = resultado.filter(p => p.montoOriginal <= filtros.montoMaximo!);
    }
    
    if (filtros.soloVencidas) {
      resultado = resultado.filter(p => p.estado === 'vencida');
    }
    
    setPartidasFiltradas(resultado);
    setResumen(calcularResumen(resultado));
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, partidas]);

  const exportarReporte = (formato: 'excel' | 'pdf') => {
    setLoading(true);
    setTimeout(() => {
      notifications.show({
        title: 'Exportación Exitosa',
        message: `Reporte exportado en formato ${formato.toUpperCase()}`,
        color: 'green'
      });
      setLoading(false);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getEstadoColor = (estado: EstadoPartida) => {
    switch (estado) {
      case 'abierta': return 'blue';
      case 'pagada': return 'green';
      case 'vencida': return 'red';
      default: return 'gray';
    }
  };

  const verDetalle = (partida: PartidaReportData) => {
    setPartidaSeleccionada(partida);
    openModal();
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconFileReport size={20} />
          <Title order={4}>Reporte de Partidas</Title>
        </Group>
        <Group gap="xs">
          <Button 
            variant="light" 
            leftSection={<IconRefresh size={16} />}
            onClick={() => aplicarFiltros()}
            loading={loading}
          >
            Actualizar
          </Button>
          <Button 
            variant="light" 
            leftSection={<IconFileExport size={16} />}
            onClick={() => exportarReporte('excel')}
          >
            Excel
          </Button>
          <Button 
            variant="light" 
            leftSection={<IconPrinter size={16} />}
            onClick={() => exportarReporte('pdf')}
          >
            PDF
          </Button>
        </Group>
      </Group>

      {/* Filtros */}
      <Card withBorder mb="md">
        <Title order={6} mb="sm">Filtros</Title>
        <Grid>
          <Grid.Col span={3}>
            <Select
              label="Estado"
              placeholder="Todos los estados"
              data={[
                { value: 'abierta', label: 'Abierta' },
                { value: 'pagada', label: 'Pagada' },
                { value: 'vencida', label: 'Vencida' }
              ]}
              value={filtros.estadoPartida || ''}
              onChange={(value) => setFiltros({...filtros, estadoPartida: (value as EstadoPartida) || undefined})}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Cliente"
              placeholder="Buscar por cliente..."
              value={filtros.cliente || ''}
              onChange={(e) => setFiltros({...filtros, cliente: e.target.value})}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <DatePickerInput
              label="Fecha Desde"
              placeholder="Seleccionar fecha"
              value={filtros.fechaDesde || null}
              onChange={(date: any) => setFiltros({...filtros, fechaDesde: date || undefined})}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <DatePickerInput
              label="Fecha Hasta"
              placeholder="Seleccionar fecha"
              value={filtros.fechaHasta || null}
              onChange={(date: any) => setFiltros({...filtros, fechaHasta: date || undefined})}
              clearable
            />
          </Grid.Col>
        </Grid>
      </Card>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'resumen')}>
        <Tabs.List>
          <Tabs.Tab value="resumen" leftSection={<IconTrendingUp size={16} />}>
            Resumen Ejecutivo
          </Tabs.Tab>
          <Tabs.Tab value="detalle" leftSection={<IconFileReport size={16} />}>
            Detalle de Partidas
          </Tabs.Tab>
          <Tabs.Tab value="vencimientos" leftSection={<IconAlertTriangle size={16} />}>
            Vencimientos
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          {resumen && (
            <>
              {/* Resumen Financiero */}
              <Grid mb="md">
                <Grid.Col span={3}>
                  <Card withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Total Partidas
                    </Text>
                    <Text size="xl" fw={700}>
                      {resumen.totalPartidas}
                    </Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Card withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Monto Original
                    </Text>
                    <Text size="xl" fw={700} c="blue">
                      {formatCurrency(resumen.montoTotalOriginal)}
                    </Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Card withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Monto Pagado
                    </Text>
                    <Text size="xl" fw={700} c="green">
                      {formatCurrency(resumen.montoTotalPagado)}
                    </Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={3}>
                  <Card withBorder>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      Monto Pendiente
                    </Text>
                    <Text size="xl" fw={700} c="orange">
                      {formatCurrency(resumen.montoTotalPendiente)}
                    </Text>
                  </Card>
                </Grid.Col>
              </Grid>

              {/* Progreso de Cobranza */}
              <Card withBorder mb="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>Progreso de Cobranza</Text>
                  <Text size="sm" c="dimmed">
                    {resumen.porcentajePagado.toFixed(1)}%
                  </Text>
                </Group>
                <Progress 
                  value={resumen.porcentajePagado} 
                  size="lg"
                  color={resumen.porcentajePagado === 100 ? 'green' : 'blue'}
                />
              </Card>

              {/* Estados de Partidas */}
              <Grid mb="md">
                <Grid.Col span={4}>
                  <Card withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Abiertas
                        </Text>
                        <Text size="lg" fw={700} c="blue">
                          {resumen.partidasAbiertas}
                        </Text>
                      </div>
                      <Badge color="blue" size="lg">
                        {((resumen.partidasAbiertas / resumen.totalPartidas) * 100).toFixed(0)}%
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Pagadas
                        </Text>
                        <Text size="lg" fw={700} c="green">
                          {resumen.partidasPagadas}
                        </Text>
                      </div>
                      <Badge color="green" size="lg">
                        {((resumen.partidasPagadas / resumen.totalPartidas) * 100).toFixed(0)}%
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Card withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Vencidas
                        </Text>
                        <Text size="lg" fw={700} c="red">
                          {resumen.partidasVencidas}
                        </Text>
                      </div>
                      <Badge color="red" size="lg">
                        {((resumen.partidasVencidas / resumen.totalPartidas) * 100).toFixed(0)}%
                      </Badge>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>

              {/* Indicadores Adicionales */}
              <Card withBorder>
                <Text fw={500} mb="md">Indicadores de Gestión</Text>
                <Grid>
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text>Tiempo promedio de pago:</Text>
                      <Text fw={500}>{resumen.promedioTiempoPago.toFixed(0)} días</Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text>Eficiencia de cobranza:</Text>
                      <Text fw={500} c={resumen.porcentajePagado > 80 ? 'green' : 'orange'}>
                        {resumen.porcentajePagado > 80 ? 'Buena' : 'Regular'}
                      </Text>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Card>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="detalle" pt="md">
          <ScrollArea>
            <Table striped highlightOnHover>
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
              <Table.Tbody>
                {partidasFiltradas.map((partida) => (
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
                      <ActionIcon 
                        variant="light" 
                        onClick={() => verDetalle(partida)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tabs.Panel>

        <Tabs.Panel value="vencimientos" pt="md">
          {partidasFiltradas.filter(p => p.estado === 'vencida').length > 0 ? (
            <Stack gap="sm">
              <Alert 
                icon={<IconAlertTriangle size={16} />} 
                title="Partidas Vencidas"
                color="red"
              >
                Hay {partidasFiltradas.filter(p => p.estado === 'vencida').length} partida(s) vencida(s) 
                que requieren atención inmediata.
              </Alert>
              
              {partidasFiltradas
                .filter(p => p.estado === 'vencida')
                .map((partida) => (
                  <Card key={partida.numero} withBorder>
                    <Group justify="space-between">
                      <div>
                        <Group gap="xs" mb="xs">
                          <Text fw={500}>{partida.numero}</Text>
                          <Badge color="red" size="sm">VENCIDA</Badge>
                          {partida.diasVencimiento && (
                            <Badge color="dark" size="sm">
                              {partida.diasVencimiento} días
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed">{partida.cliente}</Text>
                        <Text size="sm">{partida.descripcion}</Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text size="lg" fw={700} c="red">
                          {formatCurrency(partida.importePendiente)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Vencía: {partida.fechaVencimiento?.toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                ))}
            </Stack>
          ) : (
            <Alert color="green" title="Sin Vencimientos">
              No hay partidas vencidas en el período seleccionado.
            </Alert>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Modal de Detalle */}
      <Modal 
        opened={modalOpened} 
        onClose={closeModal}
        title="Detalle de Partida"
        size="md"
      >
        {partidaSeleccionada && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500} size="lg">{partidaSeleccionada.numero}</Text>
              <Badge color={getEstadoColor(partidaSeleccionada.estado)}>
                {partidaSeleccionada.estado.toUpperCase()}
              </Badge>
            </Group>
            
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Orden de Compra</Text>
                <Text fw={500}>{partidaSeleccionada.ordenCompra}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Cliente</Text>
                <Text fw={500}>{partidaSeleccionada.cliente}</Text>
              </Grid.Col>
            </Grid>
            
            <div>
              <Text size="sm" c="dimmed">Descripción</Text>
              <Text>{partidaSeleccionada.descripcion}</Text>
            </div>
            
            <Grid>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Monto Original</Text>
                <Text fw={500} c="blue">
                  {formatCurrency(partidaSeleccionada.montoOriginal)}
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Importe Pagado</Text>
                <Text fw={500} c="green">
                  {formatCurrency(partidaSeleccionada.importePagado)}
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Importe Pendiente</Text>
                <Text fw={500} c="orange">
                  {formatCurrency(partidaSeleccionada.importePendiente)}
                </Text>
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Fecha Creación</Text>
                <Text>{partidaSeleccionada.fechaCreacion.toLocaleDateString()}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Fecha Vencimiento</Text>
                <Text>
                  {partidaSeleccionada.fechaVencimiento?.toLocaleDateString() || 'No definida'}
                </Text>
              </Grid.Col>
            </Grid>
            
            {partidaSeleccionada.fechaPago && (
              <div>
                <Text size="sm" c="dimmed">Fecha de Pago</Text>
                <Text c="green">{partidaSeleccionada.fechaPago.toLocaleDateString()}</Text>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </Paper>
  );
};