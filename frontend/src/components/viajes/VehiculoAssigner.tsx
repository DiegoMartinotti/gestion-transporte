import React, { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Button,
  Card,
  Text,
  Badge,
  ActionIcon,
  NumberInput,
  Select,
  Alert,
  Divider,
  Box,
  Tooltip,
  ScrollArea
} from '@mantine/core';
import { 
  IconPlus, 
  IconTrash, 
  IconTruck, 
  IconUsers, 
  IconClipboardList,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { VehiculoSelector } from '../selectors/VehiculoSelector';
import { PersonalSelector } from '../selectors/PersonalSelector';
import { vehiculoService } from '../../services/vehiculoService';
import { personalService } from '../../services/personalService';
import type { Personal, PersonalFilters, Vehiculo } from '../../types';

export interface VehiculoAssignment {
  id: string;
  vehiculo?: Vehiculo;
  conductor?: Personal;
  acompanante?: Personal;
  cantidadCamiones: number;
  observaciones?: string;
}

interface VehiculoAssignerProps {
  assignments: VehiculoAssignment[];
  onChange: (assignments: VehiculoAssignment[]) => void;
  clienteId?: string;
  empresaId?: string;
  readonly?: boolean;
}

export function VehiculoAssigner({ 
  assignments, 
  onChange, 
  clienteId, 
  empresaId,
  readonly = false 
}: VehiculoAssignerProps) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Personal[]>([]);
  const [acompanantes, setAcompanantes] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [empresaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [vehiculosRes, personalRes] = await Promise.all([
        vehiculoService.getAll({ empresa: empresaId, activo: true }),
        personalService.getAll({ empresa: empresaId, activo: true })
      ]);

      setVehiculos(Array.isArray(vehiculosRes.data) ? vehiculosRes.data : []);
      
      const personal = personalRes.data || [];
      setConductores(personal.filter(p => p.tipo === 'Conductor'));
      setAcompanantes(personal.filter(p => p.tipo === 'Otro'));
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar vehículos y personal',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = () => {
    const newAssignment: VehiculoAssignment = {
      id: Date.now().toString(),
      cantidadCamiones: 1
    };
    
    onChange([...assignments, newAssignment]);
  };

  const removeAssignment = (id: string) => {
    onChange(assignments.filter(a => a.id !== id));
  };

  const updateAssignment = (id: string, updates: Partial<VehiculoAssignment>) => {
    const updated = assignments.map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    onChange(updated);
    
    // Validar assignment actualizado
    const currentAssignment = assignments.find(a => a.id === id);
    if (currentAssignment) {
      validateAssignment(id, { ...currentAssignment, ...updates });
    }
  };

  const validateAssignment = (id: string, assignment: VehiculoAssignment) => {
    const newErrors = { ...errors };
    
    // Limpiar errores previos para este assignment
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(id)) {
        delete newErrors[key];
      }
    });

    // Validar vehículo seleccionado
    if (!assignment.vehiculo) {
      newErrors[`${id}.vehiculo`] = 'Debe seleccionar un vehículo';
    }

    // Validar conductor
    if (!assignment.conductor) {
      newErrors[`${id}.conductor`] = 'Debe asignar un conductor';
    }

    // Validar cantidad de camiones
    if (!assignment.cantidadCamiones || assignment.cantidadCamiones < 1) {
      newErrors[`${id}.cantidadCamiones`] = 'Cantidad debe ser mayor a 0';
    }

    // Validar duplicados de vehículo
    const vehiculoUsed = assignments.filter(a => 
      a.id !== id && a.vehiculo?._id === assignment.vehiculo?._id
    ).length > 0;
    
    if (vehiculoUsed) {
      newErrors[`${id}.vehiculo`] = 'Este vehículo ya está asignado';
    }

    // Validar duplicados de conductor
    const conductorUsed = assignments.filter(a => 
      a.id !== id && a.conductor?._id === assignment.conductor?._id
    ).length > 0;
    
    if (conductorUsed) {
      newErrors[`${id}.conductor`] = 'Este conductor ya está asignado';
    }

    setErrors(newErrors);
  };

  const getAssignmentStatus = (assignment: VehiculoAssignment) => {
    const hasErrors = Object.keys(errors).some(key => key.startsWith(assignment.id));
    
    if (hasErrors) return { color: 'red', label: 'Incompleto', icon: IconAlertCircle };
    if (!assignment.vehiculo || !assignment.conductor) return { color: 'yellow', label: 'Pendiente', icon: IconClipboardList };
    return { color: 'green', label: 'Completo', icon: IconCheck };
  };

  const getTotalCamiones = () => {
    return assignments.reduce((total, a) => total + (a.cantidadCamiones || 0), 0);
  };

  const getValidAssignments = () => {
    return assignments.filter(a => 
      a.vehiculo && a.conductor && a.cantidadCamiones > 0 && 
      !Object.keys(errors).some(key => key.startsWith(a.id))
    );
  };

  return (
    <Stack gap="md">
      {/* Header con resumen */}
      <Card withBorder>
        <Group justify="space-between">
          <Group>
            <IconTruck size={20} />
            <div>
              <Text fw={500}>Configuración de Vehículos</Text>
              <Text size="sm" c="dimmed">
                {assignments.length} asignación(es) • {getTotalCamiones()} camión(es) total
              </Text>
            </div>
          </Group>
          
          <Group>
            <Badge 
              color={getValidAssignments().length === assignments.length ? 'green' : 'yellow'}
              variant="light"
            >
              {getValidAssignments().length}/{assignments.length} válidas
            </Badge>
            
            {!readonly && (
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                onClick={addAssignment}
                disabled={loading}
              >
                Agregar Vehículo
              </Button>
            )}
          </Group>
        </Group>
      </Card>

      {/* Lista de asignaciones */}
      <ScrollArea h={400}>
        <Stack gap="sm">
          {assignments.map((assignment, index) => {
            const status = getAssignmentStatus(assignment);
            const StatusIcon = status.icon;
            
            return (
              <Card key={assignment.id} withBorder>
                <Stack gap="md">
                  {/* Header de la asignación */}
                  <Group justify="space-between">
                    <Group>
                      <StatusIcon size={16} color={status.color} />
                      <Text fw={500}>Configuración #{index + 1}</Text>
                      <Badge color={status.color} variant="light" size="sm">
                        {status.label}
                      </Badge>
                    </Group>
                    
                    {!readonly && (
                      <Tooltip label="Eliminar configuración">
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => removeAssignment(assignment.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>

                  <Divider />

                  {/* Formulario de asignación */}
                  <Group grow>
                    {/* Selección de vehículo */}
                    <VehiculoSelector
                      value={assignment.vehiculo?._id}
                      onChange={(vehiculoId) => {
                        const vehiculo = vehiculos.find(v => v._id === vehiculoId);
                        updateAssignment(assignment.id, { vehiculo });
                      }}
                      placeholder="Seleccionar vehículo"
                      error={errors[`${assignment.id}.vehiculo`]}
                      disabled={readonly || loading}
                    />

                    {/* Cantidad de camiones */}
                    <NumberInput
                      label="Cantidad de Camiones"
                      value={assignment.cantidadCamiones}
                      onChange={(value) => updateAssignment(assignment.id, { cantidadCamiones: Number(value) || 1 })}
                      min={1}
                      max={10}
                      error={errors[`${assignment.id}.cantidadCamiones`]}
                      disabled={readonly}
                    />
                  </Group>

                  <Group grow>
                    {/* Selección de conductor */}
                    <PersonalSelector
                      value={assignment.conductor?._id}
                      onChange={(conductorId) => {
                        const conductor = conductores.find(c => c._id === conductorId);
                        updateAssignment(assignment.id, { conductor });
                      }}
                      tipo="Conductor"
                      placeholder="Seleccionar conductor"
                      error={errors[`${assignment.id}.conductor`]}
                      disabled={readonly || loading}
                    />

                    {/* Selección de acompañante (opcional) */}
                    <PersonalSelector
                      value={assignment.acompanante?._id}
                      onChange={(acompananteId) => {
                        const acompanante = acompanantes.find(a => a._id === acompananteId);
                        updateAssignment(assignment.id, { acompanante });
                      }}
                      tipo="Otro"
                      placeholder="Acompañante (opcional)"
                      disabled={readonly || loading}
                    />
                  </Group>

                  {/* Información del vehículo seleccionado */}
                  {assignment.vehiculo && (
                    <Card withBorder radius="sm" bg="gray.0">
                      <Group>
                        <IconTruck size={16} />
                        <div>
                          <Text size="sm" fw={500}>
                            {assignment.vehiculo.patente} - {assignment.vehiculo.marca} {assignment.vehiculo.modelo}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Tipo: {assignment.vehiculo.tipo} • 
                            Estado: {assignment.vehiculo.activo ? 'Activo' : 'Inactivo'}
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Estado vacío */}
      {assignments.length === 0 && (
        <Card withBorder>
          <Stack align="center" gap="md" py="xl">
            <IconTruck size={48} color="gray" />
            <div style={{ textAlign: 'center' }}>
              <Text fw={500} mb="xs">No hay vehículos asignados</Text>
              <Text size="sm" c="dimmed" mb="md">
                Agregue al menos un vehículo para continuar con el viaje
              </Text>
              {!readonly && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={addAssignment}
                  disabled={loading}
                >
                  Agregar Primer Vehículo
                </Button>
              )}
            </div>
          </Stack>
        </Card>
      )}

      {/* Alertas de validación */}
      {Object.keys(errors).length > 0 && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Configuración incompleta"
          color="yellow"
        >
          Revise las asignaciones marcadas en rojo para continuar.
        </Alert>
      )}

      {/* Resumen final */}
      {assignments.length > 0 && (
        <Card withBorder bg="blue.0">
          <Group justify="space-between">
            <div>
              <Text fw={500}>Resumen de Configuración</Text>
              <Text size="sm" c="dimmed">
                Total: {getTotalCamiones()} camión(es) en {assignments.length} configuración(es)
              </Text>
            </div>
            <Group>
              <Badge color="blue" variant="light">
                {getValidAssignments().length} completas
              </Badge>
              {assignments.length - getValidAssignments().length > 0 && (
                <Badge color="yellow" variant="light">
                  {assignments.length - getValidAssignments().length} pendientes
                </Badge>
              )}
            </Group>
          </Group>
        </Card>
      )}
    </Stack>
  );
}