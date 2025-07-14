import { useState } from 'react';
import {
  Card, Group, Button, Stack, Title, Text, Grid, Badge, 
  Divider, Paper, Table, Timeline, Alert, Modal, Tabs,
  ActionIcon, Tooltip, Progress, RingProgress, Center
} from '@mantine/core';
import {
  IconEdit, IconPrinter, IconDownload, IconMapPin, IconTruck,
  IconUser, IconCalendar, IconClock, IconCurrencyDollar, IconPackage,
  IconRoute, IconFlag, IconAlertCircle, IconInfoCircle,
  IconCheck, IconX, IconArrowRight, IconFileText, IconEye
} from '@tabler/icons-react';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { DocumentViewer } from '../../components/base/DocumentViewer';
import { TarifaCalculator } from '../../components/calculation/TarifaCalculator';
import { ViajeTracker } from './ViajeTracker';
import { useViaje } from '../../hooks/useViaje';
import { Viaje } from '../../types/viaje';
import { notifications } from '@mantine/notifications';
import { getClienteText, getClienteId } from '../../utils/viajeHelpers';

interface ViajeDetailProps {
  viajeId: string;
  onEdit: () => void;
  onClose: () => void;
}

export function ViajeDetail({ viajeId, onEdit, onClose }: ViajeDetailProps) {
  const { viaje, loading, error, updateEstado } = useViaje(viajeId);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('general');

  if (loading) {
    return (
      <Card>
        <LoadingOverlay loading>
          <div style={{ height: 400 }} />
        </LoadingOverlay>
      </Card>
    );
  }

  if (error || !viaje) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error || 'No se pudo cargar el viaje'}
      </Alert>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'blue';
      case 'EN_PROGRESO': return 'yellow';
      case 'COMPLETADO': return 'green';
      case 'CANCELADO': return 'red';
      case 'FACTURADO': return 'violet';
      default: return 'gray';
    }
  };

  const getProgressValue = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 20;
      case 'EN_PROGRESO': return 60;
      case 'COMPLETADO': return 100;
      case 'CANCELADO': return 0;
      case 'FACTURADO': return 100;
      default: return 0;
    }
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    try {
      await updateEstado(nuevoEstado);
      notifications.show({
        title: 'Estado actualizado',
        message: `El viaje cambió a ${nuevoEstado}`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado',
        color: 'red'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    notifications.show({
      title: 'Exportando',
      message: 'Generando documento PDF...',
      color: 'blue'
    });
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Title order={2}>Viaje #{viaje.numeroViaje}</Title>
          <Badge 
            color={getEstadoBadgeColor(viaje.estado)} 
            variant="filled"
            size="lg"
          >
            {viaje.estado}
          </Badge>
        </Group>
        <Group>
          <Button variant="light" leftSection={<IconPrinter />} onClick={handlePrint}>
            Imprimir
          </Button>
          <Button variant="light" leftSection={<IconDownload />} onClick={handleExport}>
            Exportar PDF
          </Button>
          <Button leftSection={<IconEdit />} onClick={onEdit}>
            Editar
          </Button>
          <ActionIcon variant="light" color="gray" onClick={onClose}>
            <IconX />
          </ActionIcon>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={8}>
          <Card>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="general" leftSection={<IconInfoCircle size={14} />}>
                  Información General
                </Tabs.Tab>
                <Tabs.Tab value="recursos" leftSection={<IconTruck size={14} />}>
                  Vehículos y Personal
                </Tabs.Tab>
                <Tabs.Tab value="carga" leftSection={<IconPackage size={14} />}>
                  Detalles de Carga
                </Tabs.Tab>
                <Tabs.Tab value="costos" leftSection={<IconCurrencyDollar size={14} />}>
                  Costos y Facturación
                </Tabs.Tab>
                <Tabs.Tab value="seguimiento" leftSection={<IconRoute size={14} />}>
                  Seguimiento
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="general" pt="md">
                <Stack>
                  <Grid>
                    <Grid.Col span={6}>
                      <Paper p="md" withBorder>
                        <Group gap="xs" mb="xs">
                          <IconCalendar size={16} />
                          <Text size="sm" fw={600} c="dimmed">FECHA</Text>
                        </Group>
                        <Text size="lg">{formatDate(viaje.fecha)}</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Paper p="md" withBorder>
                        <Group gap="xs" mb="xs">
                          <IconUser size={16} />
                          <Text size="sm" fw={600} c="dimmed">CLIENTE</Text>
                        </Group>
                        <Text size="lg">{getClienteText(viaje)}</Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  <Paper p="md" withBorder>
                    <Group gap="xs" mb="xs">
                      <IconMapPin size={16} />
                      <Text size="sm" fw={600} c="dimmed">RUTA</Text>
                    </Group>
                    <Text size="lg" fw={500} mb="xs">{viaje.tramo?.denominacion}</Text>
                    <Group gap="md">
                      <Group gap={4}>
                        <IconFlag size={14} color="green" />
                        <Text size="sm">{viaje.tramo?.origen?.denominacion}</Text>
                      </Group>
                      <IconArrowRight size={14} />
                      <Group gap={4}>
                        <IconFlag size={14} color="red" />
                        <Text size="sm">{viaje.tramo?.destino?.denominacion}</Text>
                      </Group>
                    </Group>
                    <Group mt="xs">
                      <Badge variant="light">
                        {viaje.distanciaKm} km
                      </Badge>
                      <Badge variant="light">
                        {viaje.tiempoEstimadoHoras}h estimadas
                      </Badge>
                    </Group>
                  </Paper>

                  {viaje.ordenCompra && (
                    <Paper p="md" withBorder>
                      <Group gap="xs" mb="xs">
                        <IconFileText size={16} />
                        <Text size="sm" fw={600} c="dimmed">ORDEN DE COMPRA</Text>
                      </Group>
                      <Badge color="indigo" size="lg">
                        OC-{viaje.ordenCompra}
                      </Badge>
                    </Paper>
                  )}

                  {viaje.observaciones && (
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">OBSERVACIONES</Text>
                      <Text>{viaje.observaciones}</Text>
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="recursos" pt="md">
                <Stack>
                  <Paper p="md" withBorder>
                    <Text size="sm" fw={600} c="dimmed" mb="md">VEHÍCULOS ASIGNADOS</Text>
                    {viaje.vehiculos && viaje.vehiculos.length > 0 ? (
                      <Stack gap="xs">
                        {viaje.vehiculos.map((vehiculo, index) => (
                          <Group key={index} justify="space-between">
                            <Group>
                              <IconTruck size={16} />
                              <div>
                                <Text fw={500}>
                                  {typeof vehiculo.vehiculo === 'object' 
                                    ? vehiculo.vehiculo?.dominio || vehiculo.vehiculo?._id
                                    : vehiculo.vehiculo}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  Posición {vehiculo.posicion}
                                </Text>
                              </div>
                            </Group>
                            <Badge variant="light">
                              Vehículo {vehiculo.posicion}
                            </Badge>
                          </Group>
                        ))}
                      </Stack>
                    ) : (
                      <Text c="dimmed">No hay vehículos asignados</Text>
                    )}
                  </Paper>

                  <Grid>
                    <Grid.Col span={6}>
                      <Paper p="md" withBorder>
                        <Text size="sm" fw={600} c="dimmed" mb="md">CHOFERES</Text>
                        {viaje.choferes && viaje.choferes.length > 0 ? (
                          <Stack gap="xs">
                            {viaje.choferes.map((chofer, index) => (
                              <Group key={index}>
                                <IconUser size={16} />
                                <div>
                                  <Text fw={500}>{chofer.nombre} {chofer.apellido}</Text>
                                  <Text size="xs" c="dimmed">
                                    Licencia: {chofer.licenciaNumero}
                                  </Text>
                                </div>
                              </Group>
                            ))}
                          </Stack>
                        ) : (
                          <Text c="dimmed">No hay choferes asignados</Text>
                        )}
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Paper p="md" withBorder>
                        <Text size="sm" fw={600} c="dimmed" mb="md">AYUDANTES</Text>
                        {viaje.ayudantes && viaje.ayudantes.length > 0 ? (
                          <Stack gap="xs">
                            {viaje.ayudantes.map((ayudante, index) => (
                              <Group key={index}>
                                <IconUser size={16} />
                                <Text fw={500}>{ayudante.nombre} {ayudante.apellido}</Text>
                              </Group>
                            ))}
                          </Stack>
                        ) : (
                          <Text c="dimmed">No hay ayudantes asignados</Text>
                        )}
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="carga" pt="md">
                <Stack>
                  <Grid>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">PESO</Text>
                        <Text size="xl" fw={700}>{viaje.carga?.peso || 0} kg</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">VOLUMEN</Text>
                        <Text size="xl" fw={700}>{viaje.carga?.volumen || 0} m³</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">TIPO</Text>
                        <Group>
                          {viaje.carga?.peligrosa && (
                            <Badge color="red" variant="filled">Peligrosa</Badge>
                          )}
                          {viaje.carga?.refrigerada && (
                            <Badge color="blue" variant="filled">Refrigerada</Badge>
                          )}
                          {!viaje.carga?.peligrosa && !viaje.carga?.refrigerada && (
                            <Badge variant="light">Normal</Badge>
                          )}
                        </Group>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  {viaje.carga?.descripcion && (
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">DESCRIPCIÓN</Text>
                      <Text>{viaje.carga.descripcion}</Text>
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="costos" pt="md">
                <Stack>
                  <Group justify="space-between">
                    <Text size="lg" fw={600}>Desglose de Costos</Text>
                    <Button
                      variant="light"
                      leftSection={<IconEye />}
                      onClick={() => setShowCalculationDetails(true)}
                    >
                      Ver Cálculo Detallado
                    </Button>
                  </Group>

                  <Grid>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Monto Base
                        </Text>
                        <Text size="xl" fw={700}>
                          {formatCurrency(viaje.montoBase || 0)}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Extras
                        </Text>
                        <Text size="xl" fw={700}>
                          {formatCurrency(viaje.montoExtras || 0)}
                        </Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper p="md" withBorder>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Total
                        </Text>
                        <Text size="xl" fw={700} c="green">
                          {formatCurrency(viaje.montoTotal || 0)}
                        </Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>

                  {viaje.extras && viaje.extras.length > 0 && (
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={600} c="dimmed" mb="md">EXTRAS</Text>
                      <Table>
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Descripción</th>
                            <th style={{ textAlign: 'right' }}>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viaje.extras.map((extra, index) => (
                            <tr key={index}>
                              <td>{extra.concepto}</td>
                              <td>{extra.descripcion || '-'}</td>
                              <td style={{ textAlign: 'right' }}>
                                {formatCurrency(extra.monto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="seguimiento" pt="md">
                <ViajeTracker viaje={viaje} onUpdateEstado={handleChangeEstado} />
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack>
            <Card>
              <Stack ta="center">
                <RingProgress
                  size={120}
                  thickness={12}
                  sections={[
                    { value: getProgressValue(viaje.estado), color: getEstadoBadgeColor(viaje.estado) }
                  ]}
                  label={
                    <Center>
                      <Text size="xs" fw={700}>
                        {getProgressValue(viaje.estado)}%
                      </Text>
                    </Center>
                  }
                />
                <Text size="sm" c="dimmed" ta="center">
                  Progreso del viaje
                </Text>
              </Stack>
            </Card>

            <Card>
              <Text size="sm" fw={600} mb="md">ACCIONES RÁPIDAS</Text>
              <Stack gap="xs">
                <Button
                  fullWidth
                  variant="light"
                  color="blue"
                  disabled={viaje.estado !== 'Pendiente'}
                  onClick={() => handleChangeEstado('En Progreso')}
                >
                  Iniciar Viaje
                </Button>
                <Button
                  fullWidth
                  variant="light"
                  c="green"
                  disabled={viaje.estado !== 'En Progreso'}
                  onClick={() => handleChangeEstado('Completado')}
                >
                  Completar Viaje
                </Button>
                <Button
                  fullWidth
                  variant="light"
                  color="violet"
                  disabled={viaje.estado !== 'Completado'}
                  onClick={() => handleChangeEstado('Facturado')}
                >
                  Marcar Facturado
                </Button>
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  disabled={viaje.estado === 'Facturado'}
                  onClick={() => handleChangeEstado('Cancelado')}
                >
                  Cancelar Viaje
                </Button>
              </Stack>
            </Card>

            {viaje.documentos && viaje.documentos.length > 0 && (
              <Card>
                <Group justify="space-between" mb="md">
                  <Text size="sm" fw={600}>DOCUMENTOS</Text>
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => setShowDocuments(true)}
                  >
                    Ver todos
                  </Button>
                </Group>
                <Stack gap="xs">
                  {viaje.documentos.slice(0, 3).map((doc, index) => (
                    <Group key={index} justify="space-between">
                      <Group gap="xs">
                        <IconFileText size={14} />
                        <Text size="sm">{doc.nombre}</Text>
                      </Group>
                      <ActionIcon variant="light" size="sm">
                        <IconDownload size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      <Modal
        opened={showCalculationDetails}
        onClose={() => setShowCalculationDetails(false)}
        title="Detalles del Cálculo de Tarifa"
        size="xl"
      >
        <TarifaCalculator
          cliente={viaje.cliente}
          tramo={viaje.tramo}
          datos={{
            peso: viaje.carga?.peso || 0,
            volumen: viaje.carga?.volumen || 0,
            distancia: viaje.distanciaKm || 0,
            vehiculos: viaje.vehiculos?.length || 0
          }}
          resultado={{
            montoBase: viaje.montoBase || 0,
            montoExtras: viaje.montoExtras || 0,
            montoTotal: viaje.montoTotal || 0
          }}
        />
      </Modal>

      <Modal
        opened={showDocuments}
        onClose={() => setShowDocuments(false)}
        title="Documentos del Viaje"
        size="lg"
      >
        {viaje.documentos && (
          <DocumentViewer documentos={viaje.documentos} />
        )}
      </Modal>
    </Stack>
  );
}