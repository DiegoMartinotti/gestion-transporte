import React, { useState } from 'react';
import {
  Paper,
  Title,
  Button,
  Group,
  Stack,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Text,
  Alert,
  Timeline,
  Card,
  Grid,
  NumberInput,
  Select,
  TextInput,
  Textarea,
  Switch
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
  IconHistory
} from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { 
  getTarifaVersions, 
  createTarifaVersion, 
  updateTarifaVersion, 
  toggleTarifaVersion,
  TarifaVersion,
  detectConflicts
} from '../../services/tarifaService';

interface TarifaVersioningProps {
  tramoId: string;
  onVersionSelect?: (version: TarifaVersion) => void;
}

export const TarifaVersioning: React.FC<TarifaVersioningProps> = ({
  tramoId,
  onVersionSelect
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<TarifaVersion | null>(null);
  const [newVersion, setNewVersion] = useState<Partial<TarifaVersion>>({
    fechaVigenciaInicio: new Date().toISOString().split('T')[0],
    tipoCalculo: 'peso',
    tarifasPorTipo: {
      chico: 0,
      semi: 0,
      acoplado: 0,
      bitrén: 0
    },
    activa: true
  });

  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['tarifa-versions', tramoId],
    queryFn: () => getTarifaVersions(tramoId)
  });

  const createMutation = useMutation({
    mutationFn: (version: Partial<TarifaVersion>) => createTarifaVersion(tramoId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifa-versions', tramoId] });
      setIsModalOpen(false);
      setNewVersion({
        fechaVigenciaInicio: new Date().toISOString().split('T')[0],
        tipoCalculo: 'peso',
        tarifasPorTipo: { chico: 0, semi: 0, acoplado: 0, bitrén: 0 },
        activa: true
      });
      notifications.show({
        title: 'Éxito',
        message: 'Nueva versión de tarifa creada',
        color: 'green'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { versionId: string; version: Partial<TarifaVersion> }) => 
      updateTarifaVersion(tramoId, data.versionId, data.version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifa-versions', tramoId] });
      setEditingVersion(null);
      notifications.show({
        title: 'Éxito',
        message: 'Versión actualizada correctamente',
        color: 'green'
      });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { versionId: string; activa: boolean }) => 
      toggleTarifaVersion(tramoId, data.versionId, data.activa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifa-versions', tramoId] });
      notifications.show({
        title: 'Éxito',
        message: 'Estado de la versión actualizado',
        color: 'green'
      });
    }
  });

  const handleCreateVersion = async () => {
    // Detectar conflictos antes de crear
    const conflicts = await detectConflicts(tramoId, newVersion);
    
    if (conflicts.length > 0) {
      notifications.show({
        title: 'Conflictos detectados',
        message: `Se encontraron ${conflicts.length} conflictos de fechas`,
        color: 'orange'
      });
      return;
    }

    createMutation.mutate(newVersion);
  };

  const handleEditVersion = (version: TarifaVersion) => {
    setEditingVersion(version);
    setIsModalOpen(true);
  };

  const handleUpdateVersion = () => {
    if (!editingVersion) return;
    updateMutation.mutate({ 
      versionId: editingVersion._id, 
      version: editingVersion 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getVersionStatus = (version: TarifaVersion) => {
    const now = new Date();
    const inicio = new Date(version.fechaVigenciaInicio);
    const fin = version.fechaVigenciaFin ? new Date(version.fechaVigenciaFin) : null;

    if (!version.activa) return { color: 'gray', label: 'Inactiva' };
    if (now < inicio) return { color: 'blue', label: 'Programada' };
    if (fin && now > fin) return { color: 'red', label: 'Vencida' };
    return { color: 'green', label: 'Vigente' };
  };

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconHistory size={20} />
            Control de Versiones de Tarifas
          </Group>
        </Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          Nueva Versión
        </Button>
      </Group>

      {/* Timeline de versiones */}
      <Card withBorder mb="md">
        <Title order={5} mb="md">Línea de Tiempo</Title>
        <Timeline active={versions.findIndex(v => getVersionStatus(v).label === 'Vigente')}>
          {versions
            .sort((a, b) => new Date(b.fechaVigenciaInicio).getTime() - new Date(a.fechaVigenciaInicio).getTime())
            .map((version) => {
              const status = getVersionStatus(version);
              return (
                <Timeline.Item
                  key={version._id}
                  bullet={status.label === 'Vigente' ? <IconCheck size={12} /> : <IconClock size={12} />}
                  color={status.color}
                >
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>Versión {version.version}</Text>
                      <Text size="sm" c="dimmed">
                        Desde {formatDate(version.fechaVigenciaInicio)}
                        {version.fechaVigenciaFin && ` hasta ${formatDate(version.fechaVigenciaFin)}`}
                      </Text>
                      <Badge size="sm" color={status.color} mt="xs">
                        {status.label}
                      </Badge>
                    </div>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => onVersionSelect?.(version)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="orange"
                        onClick={() => handleEditVersion(version)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <Switch
                        checked={version.activa}
                        onChange={(event) => 
                          toggleMutation.mutate({
                            versionId: version._id,
                            activa: event.currentTarget.checked
                          })
                        }
                        size="sm"
                      />
                    </Group>
                  </Group>
                </Timeline.Item>
              );
            })}
        </Timeline>
      </Card>

      {/* Tabla de versiones detallada */}
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Versión</Table.Th>
            <Table.Th>Vigencia</Table.Th>
            <Table.Th>Tipo Cálculo</Table.Th>
            <Table.Th>Tarifas</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {versions.map((version) => {
            const status = getVersionStatus(version);
            return (
              <Table.Tr key={version._id}>
                <Table.Td>
                  <Text fw={500}>v{version.version}</Text>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm">
                      Desde: {formatDate(version.fechaVigenciaInicio)}
                    </Text>
                    {version.fechaVigenciaFin && (
                      <Text size="sm">
                        Hasta: {formatDate(version.fechaVigenciaFin)}
                      </Text>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">
                    {version.tipoCalculo.toUpperCase()}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="xs">
                      Semi: {formatCurrency(version.tarifasPorTipo.semi)}
                    </Text>
                    <Text size="xs">
                      Acoplado: {formatCurrency(version.tarifasPorTipo.acoplado)}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge color={status.color} size="sm">
                    {status.label}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onVersionSelect?.(version)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="orange"
                      onClick={() => handleEditVersion(version)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {/* Modal para crear/editar versión */}
      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVersion(null);
        }}
        title={editingVersion ? 'Editar Versión' : 'Nueva Versión de Tarifa'}
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <DateInput
                label="Fecha Inicio Vigencia"
                required
                value={editingVersion ? 
                  new Date(editingVersion.fechaVigenciaInicio) : 
                  new Date(newVersion.fechaVigenciaInicio!)
                }
                onChange={(value: string | null) => {
                  const dateString = value || '';
                  if (editingVersion) {
                    setEditingVersion({...editingVersion, fechaVigenciaInicio: dateString});
                  } else {
                    setNewVersion({...newVersion, fechaVigenciaInicio: dateString});
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                label="Fecha Fin Vigencia (Opcional)"
                value={editingVersion?.fechaVigenciaFin ? 
                  new Date(editingVersion.fechaVigenciaFin) : 
                  undefined
                }
                onChange={(value: string | null) => {
                  const dateString = value || undefined;
                  if (editingVersion) {
                    setEditingVersion({...editingVersion, fechaVigenciaFin: dateString});
                  } else {
                    setNewVersion({...newVersion, fechaVigenciaFin: dateString});
                  }
                }}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Tipo de Cálculo"
            required
            value={editingVersion?.tipoCalculo || newVersion.tipoCalculo}
            onChange={(value) => {
              const tipoCalculo = value as 'peso' | 'volumen' | 'distancia' | 'tiempo' | 'fija' | 'formula';
              if (editingVersion) {
                setEditingVersion({...editingVersion, tipoCalculo});
              } else {
                setNewVersion({...newVersion, tipoCalculo});
              }
            }}
            data={[
              { value: 'peso', label: 'Por Peso (Tn)' },
              { value: 'volumen', label: 'Por Volumen (m³)' },
              { value: 'distancia', label: 'Por Distancia (Km)' },
              { value: 'tiempo', label: 'Por Tiempo (Hs)' },
              { value: 'fija', label: 'Tarifa Fija' },
              { value: 'formula', label: 'Fórmula Personalizada' }
            ]}
          />

          {/* Tarifas por tipo de camión */}
          <Title order={6}>Tarifas por Tipo de Camión</Title>
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Camión Chico"
                min={0}
                value={editingVersion?.tarifasPorTipo.chico || newVersion.tarifasPorTipo?.chico}
                onChange={(value) => {
                  const currentTarifas = editingVersion?.tarifasPorTipo || newVersion.tarifasPorTipo || { chico: 0, semi: 0, acoplado: 0, bitrén: 0 };
                  const tarifas = {...currentTarifas, chico: Number(value) || 0};
                  if (editingVersion) {
                    setEditingVersion({...editingVersion, tarifasPorTipo: tarifas});
                  } else {
                    setNewVersion({...newVersion, tarifasPorTipo: tarifas});
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Semi"
                min={0}
                value={editingVersion?.tarifasPorTipo.semi || newVersion.tarifasPorTipo?.semi}
                onChange={(value) => {
                  const currentTarifas = editingVersion?.tarifasPorTipo || newVersion.tarifasPorTipo || { chico: 0, semi: 0, acoplado: 0, bitrén: 0 };
                  const tarifas = {...currentTarifas, semi: Number(value) || 0};
                  if (editingVersion) {
                    setEditingVersion({...editingVersion, tarifasPorTipo: tarifas});
                  } else {
                    setNewVersion({...newVersion, tarifasPorTipo: tarifas});
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Acoplado"
                min={0}
                value={editingVersion?.tarifasPorTipo.acoplado || newVersion.tarifasPorTipo?.acoplado}
                onChange={(value) => {
                  const currentTarifas = editingVersion?.tarifasPorTipo || newVersion.tarifasPorTipo || { chico: 0, semi: 0, acoplado: 0, bitrén: 0 };
                  const tarifas = {...currentTarifas, acoplado: Number(value) || 0};
                  if (editingVersion) {
                    setEditingVersion({...editingVersion, tarifasPorTipo: tarifas});
                  } else {
                    setNewVersion({...newVersion, tarifasPorTipo: tarifas});
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Bitrén"
                min={0}
                value={editingVersion?.tarifasPorTipo.bitrén || newVersion.tarifasPorTipo?.bitrén}
                onChange={(value) => {
                  const currentTarifas = editingVersion?.tarifasPorTipo || newVersion.tarifasPorTipo || { chico: 0, semi: 0, acoplado: 0, bitrén: 0 };
                  const tarifas = {...currentTarifas, bitrén: Number(value) || 0};
                  if (editingVersion) {
                    setEditingVersion({...editingVersion, tarifasPorTipo: tarifas});
                  } else {
                    setNewVersion({...newVersion, tarifasPorTipo: tarifas});
                  }
                }}
              />
            </Grid.Col>
          </Grid>

          {/* Fórmula personalizada */}
          {((editingVersion?.tipoCalculo || newVersion.tipoCalculo) === 'formula') && (
            <Textarea
              label="Fórmula Personalizada"
              placeholder="Ej: peso * 150 + distancia * 2.5"
              value={editingVersion?.formula || newVersion.formula || ''}
              onChange={(event) => {
                const formula = event.currentTarget.value;
                if (editingVersion) {
                  setEditingVersion({...editingVersion, formula});
                } else {
                  setNewVersion({...newVersion, formula});
                }
              }}
            />
          )}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setIsModalOpen(false);
                setEditingVersion(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={editingVersion ? handleUpdateVersion : handleCreateVersion}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingVersion ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
};