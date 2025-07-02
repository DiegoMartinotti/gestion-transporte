import React, { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Card,
  Text,
  Badge,
  Button,
  Divider,
  Alert,
  Table,
  Progress,
  ActionIcon,
  Collapse,
  Box,
  Grid,
  NumberFormatter,
  Tooltip,
  ScrollArea
} from '@mantine/core';
import {
  IconTruck,
  IconUsers,
  IconScale,
  IconCurrencyDollar,
  IconChevronDown,
  IconChevronUp,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconRoute,
  IconClock,
  IconGasStation,
  IconEdit
} from '@tabler/icons-react';
import { VehiculoAssignment } from './VehiculoAssigner';
import { VehicleDetectionResult } from './VehicleTypeDetector';
import type { Personal, Vehiculo } from '../../types';

interface ConfigurationPreviewProps {
  assignments: VehiculoAssignment[];
  detectionResults?: Record<string, VehicleDetectionResult>;
  viajeData?: {
    tramo?: any;
    extras?: any[];
    cargaTotal?: number;
    distanciaTotal?: number;
    fechaViaje?: Date;
  };
  onEdit?: () => void;
  readonly?: boolean;
}

interface ConfigurationSummary {
  totalVehiculos: number;
  totalCamiones: number;
  capacidadTotal: number;
  costoEstimado: number;
  utilizacionPromedio: number;
  riesgos: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    vehiculoId?: string;
  }>;
}

export function ConfigurationPreview({
  assignments,
  detectionResults = {},
  viajeData,
  onEdit,
  readonly = false
}: ConfigurationPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vehicles: true,
    costs: false,
    risks: false
  });

  const summary = useMemo((): ConfigurationSummary => {
    const totalVehiculos = assignments.length;
    const totalCamiones = assignments.reduce((sum, a) => sum + (a.cantidadCamiones || 0), 0);
    const capacidadTotal = assignments.reduce((sum, a) => 
      sum + (10000) * (a.cantidadCamiones || 0), 0 // Capacidad por defecto de 10000kg
    );

    const riesgos: ConfigurationSummary['riesgos'] = [];

    // Detectar riesgos
    assignments.forEach(assignment => {
      // Validación básica
      if (!assignment.vehiculo) {
        riesgos.push({
          tipo: 'error',
          mensaje: 'Vehículo no seleccionado',
          vehiculoId: assignment.id
        });
      }
      
      if (!assignment.conductor) {
        riesgos.push({
          tipo: 'error',
          mensaje: 'Conductor no asignado',
          vehiculoId: assignment.id
        });
      }

      // Riesgos de capacidad
      if (assignment.vehiculo && viajeData?.cargaTotal) {
        const capacidadAsignada = 10000 * (assignment.cantidadCamiones || 0); // Capacidad por defecto
        const utilizacion = (viajeData.cargaTotal / capacidadTotal) * 100;
        
        if (utilizacion > 95) {
          riesgos.push({
            tipo: 'warning',
            mensaje: `Utilización muy alta: ${utilizacion.toFixed(1)}%`,
            vehiculoId: assignment.id
          });
        }
        
        if (utilizacion < 30) {
          riesgos.push({
            tipo: 'info',
            mensaje: `Baja utilización: ${utilizacion.toFixed(1)}% - considere optimizar`,
            vehiculoId: assignment.id
          });
        }
      }

      // Riesgos de documentación
      if (assignment.vehiculo) {
        if (assignment.vehiculo.documentacion) {
          const docVencidos = assignment.vehiculo.documentacion.filter((doc) => 
            doc.fechaVencimiento && new Date(doc.fechaVencimiento) < new Date()
          );
          
          if (docVencidos.length > 0) {
            riesgos.push({
              tipo: 'warning',
              mensaje: `${docVencidos.length} documento(s) vencido(s)`,
              vehiculoId: assignment.id
            });
          }
        }
      }
      
      if (assignment.conductor?.documentacion) {
        // Simplificar verificación de documentación del personal
        const hasExpiredDocs = assignment.conductor.documentacion.licenciaConducir?.vencimiento && 
          new Date(assignment.conductor.documentacion.licenciaConducir.vencimiento) < new Date();
        
        if (hasExpiredDocs) {
          riesgos.push({
            tipo: 'warning',
            mensaje: `Conductor con documentación vencida`,
            vehiculoId: assignment.id
          });
        }
      }
    });

    // Calcular utilización promedio
    const utilizacionPromedio = viajeData?.cargaTotal && capacidadTotal > 0 
      ? (viajeData.cargaTotal / capacidadTotal) * 100 
      : 0;

    // Costo estimado (simplificado)
    const costoEstimado = assignments.reduce((sum, assignment) => {
      const costoBase = 50000; // Costo base por vehículo
      const costoPorKm = 150; // Costo por km
      const distancia = viajeData?.distanciaTotal || 0;
      const cantidadCamiones = assignment.cantidadCamiones || 0;
      
      return sum + (costoBase + (costoPorKm * distancia)) * cantidadCamiones;
    }, 0);

    return {
      totalVehiculos,
      totalCamiones,
      capacidadTotal,
      costoEstimado,
      utilizacionPromedio,
      riesgos
    };
  }, [assignments, viajeData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskColor = (tipo: 'warning' | 'error' | 'info') => {
    switch (tipo) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const getRiskIcon = (tipo: 'warning' | 'error' | 'info') => {
    switch (tipo) {
      case 'error': return IconAlertTriangle;
      case 'warning': return IconAlertTriangle;
      case 'info': return IconInfoCircle;
      default: return IconInfoCircle;
    }
  };

  const getUtilizationColor = (utilizacion: number) => {
    if (utilizacion > 95) return 'red';
    if (utilizacion > 85) return 'orange';
    if (utilizacion > 60) return 'green';
    if (utilizacion > 30) return 'blue';
    return 'gray';
  };

  if (assignments.length === 0) {
    return (
      <Card withBorder>
        <Stack align="center" gap="md" py="xl">
          <IconTruck size={48} color="gray" />
          <div style={{ textAlign: 'center' }}>
            <Text fw={500} mb="xs">No hay configuración para mostrar</Text>
            <Text size="sm" c="dimmed">
              Configure al menos un vehículo para ver la vista previa
            </Text>
          </div>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Resumen general */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconTruck size={20} />
            <div>
              <Text fw={600} size="lg">Vista Previa de Configuración</Text>
              <Text size="sm" c="dimmed">
                Resumen detallado de la configuración de vehículos
              </Text>
            </div>
          </Group>
          
          {!readonly && onEdit && (
            <Button
              leftSection={<IconEdit size={16} />}
              variant="light"
              onClick={onEdit}
            >
              Editar
            </Button>
          )}
        </Group>

        <Grid>
          <Grid.Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="blue">{summary.totalVehiculos}</Text>
              <Text size="sm" c="dimmed">Vehículos</Text>
            </div>
          </Grid.Col>
          <Grid.Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="green">{summary.totalCamiones}</Text>
              <Text size="sm" c="dimmed">Camiones</Text>
            </div>
          </Grid.Col>
          <Grid.Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="orange">
                <NumberFormatter value={summary.capacidadTotal} thousandSeparator />
              </Text>
              <Text size="sm" c="dimmed">Kg Capacidad</Text>
            </div>
          </Grid.Col>
          <Grid.Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="purple">
                {summary.utilizacionPromedio.toFixed(0)}%
              </Text>
              <Text size="sm" c="dimmed">Utilización</Text>
            </div>
          </Grid.Col>
        </Grid>

        {/* Barra de utilización */}
        {viajeData?.cargaTotal && (
          <Box mt="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Utilización de Capacidad</Text>
              <Text size="sm" c="dimmed">
                <NumberFormatter value={viajeData.cargaTotal} thousandSeparator /> / {' '}
                <NumberFormatter value={summary.capacidadTotal} thousandSeparator /> kg
              </Text>
            </Group>
            <Progress
              value={Math.min(100, summary.utilizacionPromedio)}
              color={getUtilizationColor(summary.utilizacionPromedio)}
              size="lg"
              radius="xl"
            />
          </Box>
        )}
      </Card>

      {/* Riesgos y alertas */}
      {summary.riesgos.length > 0 && (
        <Card withBorder>
          <Group justify="space-between" onClick={() => toggleSection('risks')} style={{ cursor: 'pointer' }}>
            <Group>
              <IconAlertTriangle size={20} color="orange" />
              <div>
                <Text fw={500}>Riesgos y Alertas</Text>
                <Text size="sm" c="dimmed">{summary.riesgos.length} elemento(s) detectado(s)</Text>
              </div>
            </Group>
            <ActionIcon variant="transparent">
              {expandedSections.risks ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
            </ActionIcon>
          </Group>

          <Collapse in={expandedSections.risks}>
            <Divider my="md" />
            <Stack gap="xs">
              {summary.riesgos.map((riesgo, index) => {
                const RiskIcon = getRiskIcon(riesgo.tipo);
                return (
                  <Alert
                    key={index}
                    icon={<RiskIcon size={16} />}
                    color={getRiskColor(riesgo.tipo)}
                    variant="light"
                  >
                    {riesgo.mensaje}
                  </Alert>
                );
              })}
            </Stack>
          </Collapse>
        </Card>
      )}

      {/* Detalle de vehículos */}
      <Card withBorder>
        <Group justify="space-between" onClick={() => toggleSection('vehicles')} style={{ cursor: 'pointer' }}>
          <Group>
            <IconTruck size={20} />
            <div>
              <Text fw={500}>Detalle de Vehículos</Text>
              <Text size="sm" c="dimmed">Configuración por vehículo</Text>
            </div>
          </Group>
          <ActionIcon variant="transparent">
            {expandedSections.vehicles ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </ActionIcon>
        </Group>

        <Collapse in={expandedSections.vehicles}>
          <Divider my="md" />
          <ScrollArea>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Vehículo</Table.Th>
                  <Table.Th>Conductor</Table.Th>
                  <Table.Th>Camiones</Table.Th>
                  <Table.Th>Capacidad</Table.Th>
                  <Table.Th>Tipo Detectado</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {assignments.map((assignment, index) => {
                  const detection = detectionResults[assignment.id];
                  const vehiculo = assignment.vehiculo;
                  const conductor = assignment.conductor;
                  const capacidadTotal = vehiculo ? 10000 * (assignment.cantidadCamiones || 0) : 0;
                  
                  const hasErrors = summary.riesgos.some(r => 
                    r.vehiculoId === assignment.id && r.tipo === 'error'
                  );
                  
                  const hasWarnings = summary.riesgos.some(r => 
                    r.vehiculoId === assignment.id && r.tipo === 'warning'
                  );

                  return (
                    <Table.Tr key={assignment.id}>
                      <Table.Td>
                        {vehiculo ? (
                          <div>
                            <Text fw={500} size="sm">{vehiculo.patente}</Text>
                            <Text size="xs" c="dimmed">
                              {vehiculo.marca} {vehiculo.modelo}
                            </Text>
                          </div>
                        ) : (
                          <Text c="dimmed" size="sm">No seleccionado</Text>
                        )}
                      </Table.Td>
                      
                      <Table.Td>
                        {conductor ? (
                          <div>
                            <Text fw={500} size="sm">
                              {conductor.nombre} {conductor.apellido}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {conductor.documentacion?.licenciaConducir?.numero || 'N/A'}
                            </Text>
                          </div>
                        ) : (
                          <Text c="dimmed" size="sm">No asignado</Text>
                        )}
                      </Table.Td>
                      
                      <Table.Td>
                        <Text fw={500}>{assignment.cantidadCamiones || 0}</Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text fw={500}>
                          <NumberFormatter value={capacidadTotal} thousandSeparator /> kg
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        {detection ? (
                          <Tooltip label={`Confianza: ${detection.confidence.toFixed(0)}%`}>
                            <Badge
                              color={detection.confidence >= 80 ? 'green' : detection.confidence >= 60 ? 'yellow' : 'red'}
                              variant="light"
                              size="sm"
                            >
                              {detection.tipoUnidad.replace('_', ' ')}
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Text c="dimmed" size="sm">No detectado</Text>
                        )}
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="xs">
                          {hasErrors && (
                            <Badge color="red" variant="light" size="sm">Error</Badge>
                          )}
                          {hasWarnings && !hasErrors && (
                            <Badge color="yellow" variant="light" size="sm">Alerta</Badge>
                          )}
                          {!hasErrors && !hasWarnings && (
                            <Badge color="green" variant="light" size="sm">
                              <IconCheck size={12} />
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Collapse>
      </Card>

      {/* Análisis de costos */}
      <Card withBorder>
        <Group justify="space-between" onClick={() => toggleSection('costs')} style={{ cursor: 'pointer' }}>
          <Group>
            <IconCurrencyDollar size={20} />
            <div>
              <Text fw={500}>Análisis de Costos</Text>
              <Text size="sm" c="dimmed">Estimación de costos del viaje</Text>
            </div>
          </Group>
          <ActionIcon variant="transparent">
            {expandedSections.costs ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </ActionIcon>
        </Group>

        <Collapse in={expandedSections.costs}>
          <Divider my="md" />
          <Grid>
            <Grid.Col span={6}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Costo Base</Text>
                  <Text size="sm" fw={500}>
                    <NumberFormatter value={summary.totalCamiones * 50000} prefix="$" thousandSeparator />
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Costo por Distancia</Text>
                  <Text size="sm" fw={500}>
                    <NumberFormatter 
                      value={(viajeData?.distanciaTotal || 0) * 150 * summary.totalCamiones} 
                      prefix="$" 
                      thousandSeparator 
                    />
                  </Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text fw={500}>Total Estimado</Text>
                  <Text fw={600} c="blue">
                    <NumberFormatter value={summary.costoEstimado} prefix="$" thousandSeparator />
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Stack gap="xs">
                <Group>
                  <IconRoute size={16} />
                  <Text size="sm">
                    {viajeData?.distanciaTotal || 0} km total
                  </Text>
                </Group>
                <Group>
                  <IconGasStation size={16} />
                  <Text size="sm">
                    Combustible estimado: {Math.round((viajeData?.distanciaTotal || 0) * 0.35)} L
                  </Text>
                </Group>
                <Group>
                  <IconClock size={16} />
                  <Text size="sm">
                    Tiempo estimado: {Math.round((viajeData?.distanciaTotal || 0) / 80)} horas
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Collapse>
      </Card>

      {/* Estado de validación general */}
      <Card withBorder bg={summary.riesgos.filter(r => r.tipo === 'error').length > 0 ? 'red.0' : 'green.0'}>
        <Group>
          {summary.riesgos.filter(r => r.tipo === 'error').length > 0 ? (
            <IconAlertTriangle size={20} color="red" />
          ) : (
            <IconCheck size={20} color="green" />
          )}
          <div>
            <Text fw={500}>
              {summary.riesgos.filter(r => r.tipo === 'error').length > 0 
                ? 'Configuración Incompleta' 
                : 'Configuración Lista'
              }
            </Text>
            <Text size="sm" c="dimmed">
              {summary.riesgos.filter(r => r.tipo === 'error').length > 0
                ? 'Corrija los errores antes de continuar'
                : 'La configuración está completa y lista para usar'
              }
            </Text>
          </div>
        </Group>
      </Card>
    </Stack>
  );
}