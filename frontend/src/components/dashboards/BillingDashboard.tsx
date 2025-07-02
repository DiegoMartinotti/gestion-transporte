import React, { useState, useEffect } from 'react';
import { 
  Paper, Title, Grid, Card, Text, Badge, Group, Progress, 
  Select, Button, Stack, Alert, ActionIcon, RingProgress,
  Table, ScrollArea, Tooltip, Center
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconDashboard, IconTrendingUp, IconTrendingDown, IconCurrency, 
  IconCalendar, IconAlertTriangle, IconEye, IconFileReport,
  IconTarget, IconClock, IconUserCheck, IconGraph,
  IconArrowUp, IconArrowDown, IconMinus
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EstadoPartida } from '../../types/ordenCompra';

interface MetricaFinanciera {
  periodo: string;
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  porcentajeCobranza: number;
  cantidadPartidas: number;
  partidasVencidas: number;
  promedioTiempoCobro: number;
  clientesConDeuda: number;
}

interface TopCliente {
  nombre: string;
  totalFacturado: number;
  totalPendiente: number;
  porcentajePendiente: number;
  diasPromedioAtraso: number;
  ultimoPago?: Date;
}

interface TendenciaCobranza {
  mes: string;
  facturado: number;
  cobrado: number;
  eficiencia: number;
}

interface AlertaCobranza {
  tipo: 'vencimiento' | 'cliente_riesgo' | 'meta_no_cumplida' | 'flujo_bajo';
  titulo: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  fecha: Date;
  accionSugerida?: string;
}

interface ConfiguracionDashboard {
  periodoAnalisis: 'mes' | 'trimestre' | 'semestre' | 'anio';
  fechaDesde?: Date;
  fechaHasta?: Date;
  clientesSeleccionados?: string[];
  metaCobranzaMensual?: number;
}

export const BillingDashboard: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricaFinanciera | null>(null);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaCobranza[]>([]);
  const [alertas, setAlertas] = useState<AlertaCobranza[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionDashboard>({
    periodoAnalisis: 'mes',
    metaCobranzaMensual: 5000000
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos de ejemplo
  useEffect(() => {
    cargarDatosDashboard();
  }, [configuracion]);

  const cargarDatosDashboard = () => {
    setLoading(true);
    
    // Simular carga de datos
    setTimeout(() => {
      // Métricas principales
      const metricasEjemplo: MetricaFinanciera = {
        periodo: 'Febrero 2024',
        totalFacturado: 8500000,
        totalCobrado: 6800000,
        totalPendiente: 1700000,
        porcentajeCobranza: 80,
        cantidadPartidas: 45,
        partidasVencidas: 8,
        promedioTiempoCobro: 28,
        clientesConDeuda: 12
      };

      // Top clientes con deuda
      const clientesEjemplo: TopCliente[] = [
        {
          nombre: 'TECPETROL S.A.',
          totalFacturado: 2500000,
          totalPendiente: 450000,
          porcentajePendiente: 18,
          diasPromedioAtraso: 5,
          ultimoPago: new Date('2024-02-10')
        },
        {
          nombre: 'YPF S.A.',
          totalFacturado: 3200000,
          totalPendiente: 800000,
          porcentajePendiente: 25,
          diasPromedioAtraso: 15,
          ultimoPago: new Date('2024-01-28')
        },
        {
          nombre: 'SHELL ARGENTINA S.A.',
          totalFacturado: 1800000,
          totalPendiente: 350000,
          porcentajePendiente: 19,
          diasPromedioAtraso: 8,
          ultimoPago: new Date('2024-02-05')
        }
      ];

      // Tendencias mensuales
      const tendenciasEjemplo: TendenciaCobranza[] = [
        { mes: 'Oct 2023', facturado: 7200000, cobrado: 6800000, eficiencia: 94 },
        { mes: 'Nov 2023', facturado: 8100000, cobrado: 7400000, eficiencia: 91 },
        { mes: 'Dic 2023', facturado: 9500000, cobrado: 8200000, eficiencia: 86 },
        { mes: 'Ene 2024', facturado: 7800000, cobrado: 7100000, eficiencia: 91 },
        { mes: 'Feb 2024', facturado: 8500000, cobrado: 6800000, eficiencia: 80 }
      ];

      // Alertas y notificaciones
      const alertasEjemplo: AlertaCobranza[] = [
        {
          tipo: 'vencimiento',
          titulo: 'Partidas Vencidas',
          descripcion: '8 partidas vencidas por un total de $1.200.000',
          prioridad: 'alta',
          fecha: new Date(),
          accionSugerida: 'Contactar clientes inmediatamente'
        },
        {
          tipo: 'meta_no_cumplida',
          titulo: 'Meta de Cobranza',
          descripcion: 'Meta mensual al 80% - Faltan $1.200.000',
          prioridad: 'media',
          fecha: new Date(),
          accionSugerida: 'Intensificar gestión de cobranza'
        },
        {
          tipo: 'cliente_riesgo',
          titulo: 'Cliente en Riesgo',
          descripcion: 'YPF S.A. - 15 días promedio de atraso',
          prioridad: 'media',
          fecha: new Date(),
          accionSugerida: 'Reunión de revisión de cuenta'
        }
      ];

      setMetricas(metricasEjemplo);
      setTopClientes(clientesEjemplo);
      setTendencias(tendenciasEjemplo);
      setAlertas(alertasEjemplo);
      setLoading(false);
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'red';
      case 'media': return 'yellow';
      case 'baja': return 'green';
      default: return 'gray';
    }
  };

  const getTipoAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'vencimiento': return <IconAlertTriangle size={16} />;
      case 'cliente_riesgo': return <IconUserCheck size={16} />;
      case 'meta_no_cumplida': return <IconTarget size={16} />;
      case 'flujo_bajo': return <IconTrendingDown size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  const calcularEficienciaMeta = () => {
    if (!metricas || !configuracion.metaCobranzaMensual) return 0;
    return (metricas.totalCobrado / configuracion.metaCobranzaMensual) * 100;
  };

  const getTendenciaIcon = (actual: number, anterior: number) => {
    if (actual > anterior) return <IconArrowUp size={16} color="var(--mantine-color-green-6)" />;
    if (actual < anterior) return <IconArrowDown size={16} color="var(--mantine-color-red-6)" />;
    return <IconMinus size={16} color="var(--mantine-color-gray-6)" />;
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconDashboard size={20} />
          <Title order={4}>Dashboard de Facturación</Title>
        </Group>
        <Group gap="xs">
          <Select
            value={configuracion.periodoAnalisis}
            onChange={(value) => setConfiguracion({...configuracion, periodoAnalisis: value as any})}
            data={[
              { value: 'mes', label: 'Último Mes' },
              { value: 'trimestre', label: 'Último Trimestre' },
              { value: 'semestre', label: 'Último Semestre' },
              { value: 'anio', label: 'Último Año' }
            ]}
            size="sm"
          />
          <Button 
            variant="light" 
            size="sm"
            onClick={cargarDatosDashboard}
            loading={loading}
          >
            Actualizar
          </Button>
        </Group>
      </Group>

      {/* Métricas Principales */}
      {metricas && (
        <>
          <Grid mb="md">
            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total Facturado
                  </Text>
                  <IconCurrency size={20} color="var(--mantine-color-blue-6)" />
                </Group>
                <Text size="xl" fw={700} c="blue">
                  {formatCurrency(metricas.totalFacturado)}
                </Text>
                <Text size="xs" c="dimmed">
                  {metricas.cantidadPartidas} partidas
                </Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total Cobrado
                  </Text>
                  <IconTrendingUp size={20} color="var(--mantine-color-green-6)" />
                </Group>
                <Text size="xl" fw={700} c="green">
                  {formatCurrency(metricas.totalCobrado)}
                </Text>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    {metricas.porcentajeCobranza}% eficiencia
                  </Text>
                  {tendencias.length > 1 && getTendenciaIcon(
                    metricas.porcentajeCobranza, 
                    tendencias[tendencias.length - 2].eficiencia
                  )}
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Por Cobrar
                  </Text>
                  <IconClock size={20} color="var(--mantine-color-orange-6)" />
                </Group>
                <Text size="xl" fw={700} c="orange">
                  {formatCurrency(metricas.totalPendiente)}
                </Text>
                <Text size="xs" c="dimmed">
                  {metricas.clientesConDeuda} clientes
                </Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Partidas Vencidas
                  </Text>
                  <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
                </Group>
                <Text size="xl" fw={700} c="red">
                  {metricas.partidasVencidas}
                </Text>
                <Text size="xs" c="dimmed">
                  {metricas.promedioTiempoCobro} días promedio
                </Text>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Progreso hacia Meta */}
          {configuracion.metaCobranzaMensual && (
            <Card withBorder mb="md">
              <Group justify="space-between" mb="xs">
                <Text fw={500}>Meta de Cobranza Mensual</Text>
                <Text size="sm" c="dimmed">
                  {calcularEficienciaMeta().toFixed(1)}%
                </Text>
              </Group>
              <Progress 
                value={calcularEficienciaMeta()} 
                size="lg"
                color={calcularEficienciaMeta() >= 100 ? 'green' : calcularEficienciaMeta() >= 80 ? 'yellow' : 'red'}
                mb="xs"
              />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Cobrado: {formatCurrency(metricas.totalCobrado)}
                </Text>
                <Text size="sm" c="dimmed">
                  Meta: {formatCurrency(configuracion.metaCobranzaMensual)}
                </Text>
              </Group>
            </Card>
          )}
        </>
      )}

      <Grid>
        {/* Alertas y Notificaciones */}
        <Grid.Col span={6}>
          <Card withBorder h="400px">
            <Group justify="space-between" mb="md">
              <Text fw={500}>Alertas de Cobranza</Text>
              <Badge color="red" size="sm">{alertas.length}</Badge>
            </Group>
            
            <ScrollArea h="300px">
              <Stack gap="sm">
                {alertas.map((alerta, index) => (
                  <Alert 
                    key={index}
                    icon={getTipoAlertaIcon(alerta.tipo)}
                    title={alerta.titulo}
                    color={getPrioridadColor(alerta.prioridad)}
                    variant="light"
                  >
                    <Text size="sm" mb="xs">{alerta.descripcion}</Text>
                    {alerta.accionSugerida && (
                      <Text size="xs" c="dimmed" fs="italic">
                        💡 {alerta.accionSugerida}
                      </Text>
                    )}
                  </Alert>
                ))}
                
                {alertas.length === 0 && (
                  <Alert color="green" title="Sin alertas">
                    No hay alertas de cobranza pendientes.
                  </Alert>
                )}
              </Stack>
            </ScrollArea>
          </Card>
        </Grid.Col>

        {/* Eficiencia de Cobranza */}
        <Grid.Col span={6}>
          <Card withBorder h="400px">
            <Group justify="space-between" mb="md">
              <Text fw={500}>Eficiencia de Cobranza</Text>
              <Text size="sm" c="dimmed">Últimos 5 meses</Text>
            </Group>
            
            <Center h="300px">
              {metricas && (
                <div style={{ textAlign: 'center' }}>
                  <RingProgress
                    size={200}
                    thickness={20}
                    sections={[
                      { 
                        value: metricas.porcentajeCobranza, 
                        color: metricas.porcentajeCobranza >= 85 ? 'green' : 
                               metricas.porcentajeCobranza >= 70 ? 'yellow' : 'red' 
                      }
                    ]}
                    label={
                      <Center>
                        <div style={{ textAlign: 'center' }}>
                          <Text size="xl" fw={700}>
                            {metricas.porcentajeCobranza}%
                          </Text>
                          <Text size="xs" c="dimmed">
                            Eficiencia
                          </Text>
                        </div>
                      </Center>
                    }
                  />
                  
                  <Grid mt="md">
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">Promedio Sector</Text>
                      <Text fw={500}>75%</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">Meta Empresa</Text>
                      <Text fw={500}>85%</Text>
                    </Grid.Col>
                  </Grid>
                </div>
              )}
            </Center>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Top Clientes con Deuda */}
      <Card withBorder mt="md">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Top Clientes con Deuda Pendiente</Text>
          <ActionIcon variant="light">
            <IconFileReport size={16} />
          </ActionIcon>
        </Group>
        
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Total Facturado</Table.Th>
                <Table.Th>Pendiente</Table.Th>
                <Table.Th>% Pendiente</Table.Th>
                <Table.Th>Días Atraso</Table.Th>
                <Table.Th>Último Pago</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topClientes.map((cliente, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Text fw={500}>{cliente.nombre}</Text>
                  </Table.Td>
                  <Table.Td>{formatCurrency(cliente.totalFacturado)}</Table.Td>
                  <Table.Td>
                    <Text c="orange" fw={500}>
                      {formatCurrency(cliente.totalPendiente)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={cliente.porcentajePendiente > 20 ? 'red' : 
                             cliente.porcentajePendiente > 10 ? 'yellow' : 'green'}
                      size="sm"
                    >
                      {cliente.porcentajePendiente}%
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={cliente.diasPromedioAtraso > 10 ? 'red' : 
                             cliente.diasPromedioAtraso > 5 ? 'yellow' : 'green'}
                      size="sm"
                    >
                      {cliente.diasPromedioAtraso} días
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {cliente.ultimoPago?.toLocaleDateString() || 'Sin pagos'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Ver detalle">
                        <ActionIcon variant="light" size="sm">
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Contactar">
                        <ActionIcon variant="light" size="sm" color="orange">
                          <IconUserCheck size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Tendencias Mensuales */}
      <Card withBorder mt="md">
        <Text fw={500} mb="md">Tendencia de Facturación y Cobranza</Text>
        
        <ScrollArea>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Período</Table.Th>
                <Table.Th>Facturado</Table.Th>
                <Table.Th>Cobrado</Table.Th>
                <Table.Th>Eficiencia</Table.Th>
                <Table.Th>Tendencia</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tendencias.map((tendencia, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Text fw={500}>{tendencia.mes}</Text>
                  </Table.Td>
                  <Table.Td>{formatCurrency(tendencia.facturado)}</Table.Td>
                  <Table.Td>{formatCurrency(tendencia.cobrado)}</Table.Td>
                  <Table.Td>
                    <Badge 
                      color={tendencia.eficiencia >= 85 ? 'green' : 
                             tendencia.eficiencia >= 70 ? 'yellow' : 'red'}
                    >
                      {tendencia.eficiencia}%
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {index > 0 && getTendenciaIcon(
                      tendencia.eficiencia,
                      tendencias[index - 1].eficiencia
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>
    </Paper>
  );
};