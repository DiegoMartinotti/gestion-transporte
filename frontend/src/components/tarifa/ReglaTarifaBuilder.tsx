import React, { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Switch,
  NumberInput,
  Select,
  Paper,
  Title,
  Text,
  Modal,
  Alert,
  ActionIcon,
  Tooltip,
  Badge,
  Accordion,
  MultiSelect,
  Card,
  Box,
  Timeline,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconCalendar,
  IconSettings,
  IconPercentage,
  IconCurrencyDollar,
  IconMath,
  IconRefresh,
} from '@tabler/icons-react';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DataTable, { DataTableColumn } from '../base/DataTable';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import FormulaEditor from './FormulaEditor';
import {
  IReglaTarifa,
  ICondicion,
  IModificador,
  ReglaTarifaFormData,
  ReglaTarifaFilters,
  OPERADORES_CONDICION,
  TIPOS_MODIFICADOR,
  APLICAR_MODIFICADOR_A,
} from '../../types/tarifa';
import { Cliente } from '../../types';

interface ReglaTarifaBuilderProps {
  onRuleChange?: (reglas: IReglaTarifa[]) => void;
}

// Mock services - en producción serían servicios reales
const SUCCESS_COLOR = 'green';
const DEFAULT_DATE = '2024-01-01';
const reglaTarifaService = {
  getAll: async (_filters?: ReglaTarifaFilters) => {
    return {
      data: [
        {
          _id: '1',
          codigo: 'DESC_VOLUMEN',
          nombre: 'Descuento por Volumen',
          descripcion: 'Descuento del 10% para viajes con más de 20 palets',
          cliente: 'Cliente ABC',
          metodoCalculo: 'DISTANCIA_PALET',
          condiciones: [
            {
              campo: 'viaje.palets',
              operador: 'mayor' as const,
              valor: 20,
            },
          ],
          operadorLogico: 'AND' as const,
          modificadores: [
            {
              tipo: 'porcentaje' as const,
              valor: -10,
              aplicarA: 'total' as const,
              descripcion: 'Descuento 10%',
            },
          ],
          prioridad: 100,
          activa: true,
          fechaInicioVigencia: DEFAULT_DATE,
          aplicarEnCascada: true,
          excluirOtrasReglas: false,
          estadisticas: {
            vecesAplicada: 45,
            montoTotalModificado: -25000,
          },
          createdAt: DEFAULT_DATE,
          updatedAt: DEFAULT_DATE,
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 50,
      },
    };
  },

  create: async (data: ReglaTarifaFormData) => {
    console.log('Creating business rule:', data);
    return { success: true };
  },

  update: async (id: string, data: ReglaTarifaFormData) => {
    console.log('Updating business rule:', id, data);
    return { success: true };
  },

  delete: async (id: string) => {
    console.log('Deleting business rule:', id);
    return { success: true };
  },

  updatePriorities: async (rules: { id: string; prioridad: number }[]) => {
    console.log('Updating priorities:', rules);
    return { success: true };
  },
};

const clienteService = {
  getAll: async () => ({
    data: [
      { _id: '1', nombre: 'Cliente ABC' },
      { _id: '2', nombre: 'Cliente XYZ' },
    ] as Cliente[],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 50,
    },
  }),
};

// eslint-disable-next-line complexity
const ReglaTarifaBuilder: React.FC<ReglaTarifaBuilderProps> = ({ onRuleChange }) => {
  const [_filters] = useState<ReglaTarifaFilters>({}); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Data loading
  const {
    data: reglas,
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: () => reglaTarifaService.getAll(_filters),
    dependencies: [_filters],
    errorMessage: 'Error al cargar reglas de tarifa',
  });

  const { data: clientes } = useDataLoader({
    fetchFunction: clienteService.getAll,
    errorMessage: 'Error al cargar clientes',
  });

  // Modals
  const formModal = useModal<IReglaTarifa>({
    onSuccess: () => {
      refresh();
      onRuleChange?.(reglas);
    },
  });

  const viewModal = useModal<IReglaTarifa>();
  const deleteModal = useModal<IReglaTarifa>();

  // Form
  const form = useForm<ReglaTarifaFormData>({
    initialValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      cliente: '',
      metodoCalculo: '',
      condiciones: [],
      operadorLogico: 'AND',
      modificadores: [],
      prioridad: 100,
      activa: true,
      fechaInicioVigencia: '',
      fechaFinVigencia: '',
      aplicarEnCascada: true,
      excluirOtrasReglas: false,
      diasSemana: [],
      horariosAplicacion: {
        horaInicio: '',
        horaFin: '',
      },
      temporadas: [],
    },
    validate: {
      codigo: (value) => (!value ? 'El código es requerido' : null),
      nombre: (value) => (!value ? 'El nombre es requerido' : null),
      descripcion: (value) => (!value ? 'La descripción es requerida' : null),
      fechaInicioVigencia: (value) => (!value ? 'La fecha de inicio es requerida' : null),
      condiciones: (value) => (value.length === 0 ? 'Debe definir al menos una condición' : null),
      modificadores: (value) =>
        value.length === 0 ? 'Debe definir al menos un modificador' : null,
    },
  });

  // Condition and modifier forms
  const [newCondicion, setNewCondicion] = useState<ICondicion>({
    campo: '',
    operador: 'igual',
    valor: '',
  });

  const [newModificador, setNewModificador] = useState<IModificador>({
    tipo: 'porcentaje',
    valor: 0,
    aplicarA: 'total',
    descripcion: '',
  });

  // Handlers
  const handleEdit = (regla: IReglaTarifa) => {
    form.setValues({
      codigo: regla.codigo,
      nombre: regla.nombre,
      descripcion: regla.descripcion,
      cliente: regla.cliente || '',
      metodoCalculo: regla.metodoCalculo || '',
      condiciones: regla.condiciones,
      operadorLogico: regla.operadorLogico,
      modificadores: regla.modificadores,
      prioridad: regla.prioridad,
      activa: regla.activa,
      fechaInicioVigencia: regla.fechaInicioVigencia,
      fechaFinVigencia: regla.fechaFinVigencia || '',
      aplicarEnCascada: regla.aplicarEnCascada,
      excluirOtrasReglas: regla.excluirOtrasReglas,
      diasSemana: regla.diasSemana || [],
      horariosAplicacion: regla.horariosAplicacion || { horaInicio: '', horaFin: '' },
      temporadas: regla.temporadas || [],
    });
    formModal.openEdit(regla);
  };

  const handleSubmit = async (values: ReglaTarifaFormData) => {
    try {
      formModal.setLoading(true);

      if (formModal.selectedItem) {
        await reglaTarifaService.update(formModal.selectedItem._id, values);
        notifications.show({
          title: 'Éxito',
          message: 'Regla actualizada correctamente',
          color: SUCCESS_COLOR,
        });
      } else {
        await reglaTarifaService.create(values);
        notifications.show({
          title: 'Éxito',
          message: 'Nueva regla creada correctamente',
          color: SUCCESS_COLOR,
        });
      }

      formModal.onSuccess();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar la regla de tarifa',
        color: 'red',
      });
    } finally {
      formModal.setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      deleteModal.setLoading(true);
      await reglaTarifaService.delete(deleteModal.selectedItem._id);

      notifications.show({
        title: 'Éxito',
        message: 'Regla eliminada correctamente',
        color: 'green',
      });

      refresh();
      deleteModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar la regla de tarifa',
        color: 'red',
      });
    } finally {
      deleteModal.setLoading(false);
    }
  };

  // Drag and drop handler for priority ordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(reglas);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Update priorities
    const updates = reordered.map((regla, index) => ({
      id: regla._id,
      prioridad: reordered.length - index,
    }));

    try {
      await reglaTarifaService.updatePriorities(updates);
      refresh();
      notifications.show({
        title: 'Éxito',
        message: 'Prioridades actualizadas correctamente',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar prioridades',
        color: 'red',
      });
    }
  };

  // Condition helpers
  const addCondicion = () => {
    if (!newCondicion.campo || newCondicion.valor === '') {
      notifications.show({
        title: 'Error',
        message: 'Campo y valor son requeridos',
        color: 'red',
      });
      return;
    }

    const condiciones = [...form.values.condiciones, { ...newCondicion }];
    form.setFieldValue('condiciones', condiciones);

    setNewCondicion({
      campo: '',
      operador: 'igual',
      valor: '',
    });
  };

  const removeCondicion = (index: number) => {
    const condiciones = [...form.values.condiciones];
    condiciones.splice(index, 1);
    form.setFieldValue('condiciones', condiciones);
  };

  // Modifier helpers
  const addModificador = () => {
    if (newModificador.valor === 0 || newModificador.valor === '') {
      notifications.show({
        title: 'Error',
        message: 'El valor del modificador es requerido',
        color: 'red',
      });
      return;
    }

    const modificadores = [...form.values.modificadores, { ...newModificador }];
    form.setFieldValue('modificadores', modificadores);

    setNewModificador({
      tipo: 'porcentaje',
      valor: 0,
      aplicarA: 'total',
      descripcion: '',
    });
  };

  const removeModificador = (index: number) => {
    const modificadores = [...form.values.modificadores];
    modificadores.splice(index, 1);
    form.setFieldValue('modificadores', modificadores);
  };

  const handleFiltersChange = (_newFilters: any) => {
    // Implementation would go here
  };

  // Table columns
  const columns: DataTableColumn<IReglaTarifa>[] = [
    {
      key: 'prioridad',
      label: '#',
      width: 50,
      align: 'center',
      render: (regla: IReglaTarifa, index?: number) => (
        <Badge variant="light" color="blue">
          {(index || 0) + 1}
        </Badge>
      ),
    },
    {
      key: 'codigo',
      label: 'Código',
      sortable: true,
      width: 150,
      render: (regla) => <Text fw={600}>{regla.codigo}</Text>,
    },
    {
      key: 'nombre',
      label: 'Regla',
      sortable: true,
      render: (regla) => (
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {regla.nombre}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {regla.descripcion}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'condiciones',
      label: 'Condiciones',
      align: 'center',
      width: 100,
      render: (regla) => (
        <Group gap="xs" justify="center">
          <Badge variant="light" size="sm">
            {regla.condiciones.length}
          </Badge>
          <Badge variant="outline" size="xs">
            {regla.operadorLogico}
          </Badge>
        </Group>
      ),
    },
    {
      key: 'modificadores',
      label: 'Modificadores',
      align: 'center',
      width: 120,
      render: (regla) => (
        <Group gap="xs" justify="center" wrap="nowrap">
          {regla.modificadores.map((mod, idx) => (
            <Badge
              key={idx}
              size="xs"
              color={mod.tipo === 'porcentaje' ? 'blue' : mod.tipo === 'fijo' ? 'green' : 'orange'}
              variant="light"
            >
              {mod.tipo === 'porcentaje'
                ? `${mod.valor}%`
                : mod.tipo === 'fijo'
                  ? `$${mod.valor}`
                  : 'F()'}
            </Badge>
          ))}
        </Group>
      ),
    },
    {
      key: 'estadisticas',
      label: 'Aplicada',
      align: 'center',
      width: 100,
      render: (regla) => (
        <Stack gap={2} align="center">
          <Badge variant="light" color="green">
            {regla.estadisticas.vecesAplicada}x
          </Badge>
          <Text size="xs" c="dimmed">
            ${regla.estadisticas.montoTotalModificado}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'vigencia',
      label: 'Vigencia',
      align: 'center',
      width: 120,
      render: (regla) => (
        <Stack gap={2} align="center">
          <Text size="xs">{new Date(regla.fechaInicioVigencia).toLocaleDateString()}</Text>
          {regla.fechaFinVigencia && (
            <Text size="xs" c="dimmed">
              hasta {new Date(regla.fechaFinVigencia).toLocaleDateString()}
            </Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'activa',
      label: 'Estado',
      sortable: true,
      align: 'center',
      width: 100,
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center',
      width: 140,
      render: (regla) => (
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label="Ver detalles">
            <ActionIcon variant="light" size="sm" onClick={() => viewModal.openView(regla)}>
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Editar">
            <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEdit(regla)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Eliminar">
            <ActionIcon
              variant="light"
              color="red"
              size="sm"
              onClick={() => deleteModal.openDelete(regla)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  const diasSemanaOptions = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '0', label: 'Domingo' },
  ];

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Constructor de Reglas de Tarifa</Title>
          <Text size="sm" c="dimmed">
            Define reglas de negocio para la modificación automática de tarifas
          </Text>
        </div>

        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={refresh}
            loading={loading}
          >
            Actualizar
          </Button>

          <Button leftSection={<IconPlus size={16} />} onClick={formModal.openCreate}>
            Nueva Regla
          </Button>
        </Group>
      </Group>

      {/* Priority-ordered list with drag and drop */}
      <Paper p="md" withBorder>
        <Group mb="md" align="center">
          <IconRefresh size={20} />
          <Text fw={600}>Reglas por Orden de Prioridad</Text>
          <Text size="sm" c="dimmed">
            (Arrastra para reordenar)
          </Text>
        </Group>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="reglas">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Stack gap="xs">
                  {reglas.map((regla, index) => (
                    <Draggable key={regla._id} draggableId={regla._id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          p="sm"
                          withBorder
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: snapshot.isDragging
                              ? 'var(--mantine-color-blue-light)'
                              : undefined,
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                              <Badge variant="filled" color="blue">
                                #{index + 1}
                              </Badge>

                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <Text fw={600} size="sm" truncate>
                                  {regla.nombre}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>
                                  {regla.descripcion}
                                </Text>
                              </Box>

                              <Group gap="xs">
                                <Badge size="xs" variant="light">
                                  {regla.condiciones.length} condiciones
                                </Badge>
                                <Badge size="xs" variant="light" color="green">
                                  {regla.modificadores.length} modificadores
                                </Badge>
                                {!regla.activa && (
                                  <Badge size="xs" color="red" variant="light">
                                    Inactiva
                                  </Badge>
                                )}
                              </Group>
                            </Group>

                            <Group gap="xs" wrap="nowrap">
                              <ActionIcon
                                variant="light"
                                size="sm"
                                onClick={() => viewModal.openView(regla)}
                              >
                                <IconEye size={16} />
                              </ActionIcon>

                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={() => handleEdit(regla)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Stack>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>

      {/* Detailed Table */}
      <DataTable
        columns={columns}
        data={reglas}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Buscar reglas..."
      />

      {/* Form Modal */}
      <Modal
        opened={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.selectedItem ? 'Editar Regla de Tarifa' : 'Nueva Regla de Tarifa'}
        size="xl"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Información Básica */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="md">
                Información Básica
              </Text>

              <Group grow>
                <TextInput
                  label="Código"
                  placeholder="REGLA_CODIGO"
                  required
                  {...form.getInputProps('codigo')}
                />

                <NumberInput
                  label="Prioridad"
                  placeholder="100"
                  min={1}
                  required
                  {...form.getInputProps('prioridad')}
                />
              </Group>

              <TextInput
                label="Nombre"
                placeholder="Nombre de la regla"
                required
                mt="md"
                {...form.getInputProps('nombre')}
              />

              <Textarea
                label="Descripción"
                placeholder="Descripción detallada de la regla"
                required
                mt="md"
                {...form.getInputProps('descripcion')}
              />

              <Group grow mt="md">
                <Select
                  label="Cliente (opcional)"
                  placeholder="Aplicar solo a cliente específico"
                  data={clientes.map((c) => ({ value: c._id, label: c.nombre }))}
                  {...form.getInputProps('cliente')}
                  clearable
                />

                <TextInput
                  label="Método de Cálculo (opcional)"
                  placeholder="DISTANCIA_PALET"
                  {...form.getInputProps('metodoCalculo')}
                />
              </Group>

              <Group mt="md">
                <Switch label="Activa" {...form.getInputProps('activa', { type: 'checkbox' })} />

                <Switch
                  label="Aplicar en Cascada"
                  description="Las siguientes reglas se aplicarán sobre el resultado de esta"
                  {...form.getInputProps('aplicarEnCascada', { type: 'checkbox' })}
                />

                <Switch
                  label="Excluir Otras Reglas"
                  description="Si se aplica esta regla, no aplicar ninguna otra"
                  {...form.getInputProps('excluirOtrasReglas', { type: 'checkbox' })}
                />
              </Group>
            </Paper>

            {/* Vigencia */}
            <Paper p="md" withBorder>
              <Group mb="md" align="center">
                <IconCalendar size={20} />
                <Text fw={600}>Vigencia y Horarios</Text>
              </Group>

              <Group grow>
                <DateInput
                  label="Fecha Inicio Vigencia"
                  placeholder="Seleccionar fecha"
                  required
                  value={
                    form.values.fechaInicioVigencia
                      ? new Date(form.values.fechaInicioVigencia)
                      : null
                  }
                  onChange={(value) =>
                    form.setFieldValue(
                      'fechaInicioVigencia',
                      value ? (value as unknown as Date).toISOString().split('T')[0] : ''
                    )
                  }
                  error={form.errors.fechaInicioVigencia}
                />

                <DateInput
                  label="Fecha Fin Vigencia (opcional)"
                  placeholder="Seleccionar fecha"
                  value={
                    form.values.fechaFinVigencia ? new Date(form.values.fechaFinVigencia) : null
                  }
                  onChange={(value) =>
                    form.setFieldValue(
                      'fechaFinVigencia',
                      value ? (value as unknown as Date).toISOString().split('T')[0] : ''
                    )
                  }
                  error={form.errors.fechaFinVigencia}
                />
              </Group>

              <Group grow mt="md">
                <TimeInput
                  label="Hora Inicio (opcional)"
                  value={form.values.horariosAplicacion?.horaInicio || ''}
                  onChange={(event) =>
                    form.setFieldValue(
                      'horariosAplicacion.horaInicio',
                      event.currentTarget.value || ''
                    )
                  }
                />

                <TimeInput
                  label="Hora Fin (opcional)"
                  value={form.values.horariosAplicacion?.horaFin || ''}
                  onChange={(event) =>
                    form.setFieldValue(
                      'horariosAplicacion.horaFin',
                      event.currentTarget.value || ''
                    )
                  }
                />
              </Group>

              <MultiSelect
                label="Días de la Semana (opcional)"
                placeholder="Seleccionar días"
                data={diasSemanaOptions}
                mt="md"
                {...form.getInputProps('diasSemana')}
              />
            </Paper>

            {/* Condiciones */}
            <Paper p="md" withBorder>
              <Group mb="md" align="center">
                <IconSettings size={20} />
                <Text fw={600}>Condiciones</Text>
                <Select
                  size="sm"
                  data={[
                    { value: 'AND', label: 'Todas (AND)' },
                    { value: 'OR', label: 'Cualquiera (OR)' },
                  ]}
                  {...form.getInputProps('operadorLogico')}
                  w={120}
                />
              </Group>

              {/* Lista de condiciones existentes */}
              {form.values.condiciones.length > 0 && (
                <Stack gap="xs" mb="md">
                  {form.values.condiciones.map((condicion, index) => (
                    <Paper key={index} p="sm" withBorder bg="blue.0">
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Badge color="blue" variant="light">
                            {condicion.campo}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {
                              OPERADORES_CONDICION.find((op) => op.value === condicion.operador)
                                ?.label
                            }
                          </Badge>
                          <Text size="sm" fw={600}>
                            {String(condicion.valor)}
                          </Text>
                          {condicion.valorHasta && (
                            <>
                              <Text size="sm">-</Text>
                              <Text size="sm" fw={600}>
                                {String(condicion.valorHasta)}
                              </Text>
                            </>
                          )}
                        </Group>

                        <ActionIcon
                          color="red"
                          variant="light"
                          size="sm"
                          onClick={() => removeCondicion(index)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Formulario para nueva condición */}
              <Accordion>
                <Accordion.Item value="nueva-condicion">
                  <Accordion.Control icon={<IconPlus size={16} />}>
                    Agregar Condición
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      <Group grow>
                        <TextInput
                          label="Campo"
                          placeholder="viaje.palets, tramo.distancia, etc."
                          value={newCondicion.campo}
                          onChange={(e) =>
                            setNewCondicion((prev) => ({
                              ...prev,
                              campo: e.currentTarget.value,
                            }))
                          }
                        />

                        <Select
                          label="Operador"
                          data={OPERADORES_CONDICION}
                          value={newCondicion.operador}
                          onChange={(value) =>
                            setNewCondicion((prev) => ({
                              ...prev,
                              operador: value as any,
                            }))
                          }
                        />
                      </Group>

                      <Group grow>
                        <TextInput
                          label="Valor"
                          placeholder="20, 'texto', true, etc."
                          value={String(newCondicion.valor)}
                          onChange={(e) =>
                            setNewCondicion((prev) => ({
                              ...prev,
                              valor: e.currentTarget.value,
                            }))
                          }
                        />

                        {newCondicion.operador === 'entre' && (
                          <TextInput
                            label="Valor Hasta"
                            placeholder="Valor máximo"
                            value={String(newCondicion.valorHasta || '')}
                            onChange={(e) =>
                              setNewCondicion((prev) => ({
                                ...prev,
                                valorHasta: e.currentTarget.value,
                              }))
                            }
                          />
                        )}
                      </Group>

                      <Group justify="flex-end">
                        <Button
                          size="sm"
                          onClick={addCondicion}
                          leftSection={<IconPlus size={16} />}
                        >
                          Agregar Condición
                        </Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Paper>

            {/* Modificadores */}
            <Paper p="md" withBorder>
              <Group mb="md" align="center">
                <IconSettings size={20} />
                <Text fw={600}>Modificadores</Text>
              </Group>

              {/* Lista de modificadores existentes */}
              {form.values.modificadores.length > 0 && (
                <Stack gap="xs" mb="md">
                  {form.values.modificadores.map((modificador, index) => (
                    <Paper key={index} p="sm" withBorder bg="green.0">
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Badge
                            color={
                              modificador.tipo === 'porcentaje'
                                ? 'blue'
                                : modificador.tipo === 'fijo'
                                  ? 'green'
                                  : 'orange'
                            }
                            leftSection={
                              modificador.tipo === 'porcentaje' ? (
                                <IconPercentage size={12} />
                              ) : modificador.tipo === 'fijo' ? (
                                <IconCurrencyDollar size={12} />
                              ) : (
                                <IconMath size={12} />
                              )
                            }
                          >
                            {modificador.tipo}
                          </Badge>

                          <Text size="sm" fw={600}>
                            {modificador.tipo === 'porcentaje'
                              ? `${modificador.valor}%`
                              : modificador.tipo === 'fijo'
                                ? `$${modificador.valor}`
                                : String(modificador.valor)}
                          </Text>

                          <Badge variant="outline" size="sm">
                            {
                              APLICAR_MODIFICADOR_A.find((ap) => ap.value === modificador.aplicarA)
                                ?.label
                            }
                          </Badge>

                          {modificador.descripcion && (
                            <Text size="xs" c="dimmed">
                              {modificador.descripcion}
                            </Text>
                          )}
                        </Group>

                        <ActionIcon
                          color="red"
                          variant="light"
                          size="sm"
                          onClick={() => removeModificador(index)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Formulario para nuevo modificador */}
              <Accordion>
                <Accordion.Item value="nuevo-modificador">
                  <Accordion.Control icon={<IconPlus size={16} />}>
                    Agregar Modificador
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      <Group grow>
                        <Select
                          label="Tipo"
                          data={TIPOS_MODIFICADOR}
                          value={newModificador.tipo}
                          onChange={(value) =>
                            setNewModificador((prev) => ({
                              ...prev,
                              tipo: value as any,
                            }))
                          }
                        />

                        <Select
                          label="Aplicar A"
                          data={APLICAR_MODIFICADOR_A}
                          value={newModificador.aplicarA}
                          onChange={(value) =>
                            setNewModificador((prev) => ({
                              ...prev,
                              aplicarA: value as any,
                            }))
                          }
                        />
                      </Group>

                      {newModificador.tipo === 'formula' ? (
                        <FormulaEditor
                          value={String(newModificador.valor)}
                          onChange={(value) =>
                            setNewModificador((prev) => ({
                              ...prev,
                              valor: value,
                            }))
                          }
                          variables={[]}
                          height={100}
                        />
                      ) : (
                        <NumberInput
                          label={`Valor (${newModificador.tipo === 'porcentaje' ? '%' : '$'})`}
                          placeholder={
                            newModificador.tipo === 'porcentaje'
                              ? '-10 para descuento 10%'
                              : '500 para agregar $500'
                          }
                          value={Number(newModificador.valor)}
                          onChange={(value) =>
                            setNewModificador((prev) => ({
                              ...prev,
                              valor: value || 0,
                            }))
                          }
                        />
                      )}

                      <TextInput
                        label="Descripción (opcional)"
                        placeholder="Descripción del modificador"
                        value={newModificador.descripcion}
                        onChange={(e) =>
                          setNewModificador((prev) => ({
                            ...prev,
                            descripcion: e.currentTarget.value,
                          }))
                        }
                      />

                      <Group justify="flex-end">
                        <Button
                          size="sm"
                          onClick={addModificador}
                          leftSection={<IconPlus size={16} />}
                        >
                          Agregar Modificador
                        </Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Paper>

            {/* Actions */}
            <Group justify="flex-end">
              <Button variant="light" onClick={formModal.close}>
                Cancelar
              </Button>

              <Button type="submit" loading={formModal.loading}>
                {formModal.selectedItem ? 'Actualizar' : 'Crear'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        opened={viewModal.isOpen}
        onClose={viewModal.close}
        title="Detalles de la Regla"
        size="lg"
      >
        {viewModal.selectedItem && (
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Información General
              </Text>
              <Group grow>
                <div>
                  <Text size="xs" c="dimmed">
                    Código
                  </Text>
                  <Text fw={600}>{viewModal.selectedItem.codigo}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Prioridad
                  </Text>
                  <Text>{viewModal.selectedItem.prioridad}</Text>
                </div>
              </Group>

              <Text size="xs" c="dimmed" mt="md">
                Nombre
              </Text>
              <Text fw={600}>{viewModal.selectedItem.nombre}</Text>

              <Text size="xs" c="dimmed" mt="md">
                Descripción
              </Text>
              <Text>{viewModal.selectedItem.descripcion}</Text>
            </Paper>

            {/* Condiciones Timeline */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Condiciones ({viewModal.selectedItem.operadorLogico})
              </Text>
              <Timeline>
                {viewModal.selectedItem.condiciones.map((condicion, index) => (
                  <Timeline.Item key={index} title={condicion.campo}>
                    <Text size="sm">
                      {OPERADORES_CONDICION.find((op) => op.value === condicion.operador)?.label}{' '}
                      {String(condicion.valor)}
                      {condicion.valorHasta && ` - ${String(condicion.valorHasta)}`}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Paper>

            {/* Modificadores */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Modificadores
              </Text>
              <Stack gap="xs">
                {viewModal.selectedItem.modificadores.map((modificador, index) => (
                  <Group key={index} justify="space-between" p="sm" bg="gray.0">
                    <Group>
                      <Badge color="blue" variant="light">
                        {modificador.tipo}
                      </Badge>
                      <Text size="sm">
                        {modificador.tipo === 'porcentaje'
                          ? `${modificador.valor}%`
                          : modificador.tipo === 'fijo'
                            ? `$${modificador.valor}`
                            : String(modificador.valor)}
                      </Text>
                      <Text size="sm" c="dimmed">
                        →{' '}
                        {
                          APLICAR_MODIFICADOR_A.find((ap) => ap.value === modificador.aplicarA)
                            ?.label
                        }
                      </Text>
                    </Group>
                    {modificador.descripcion && (
                      <Text size="xs" c="dimmed">
                        {modificador.descripcion}
                      </Text>
                    )}
                  </Group>
                ))}
              </Stack>
            </Paper>

            {/* Estadísticas */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Estadísticas de Uso
              </Text>
              <Group grow>
                <div>
                  <Text size="xs" c="dimmed">
                    Veces Aplicada
                  </Text>
                  <Text fw={600} c="green">
                    {viewModal.selectedItem.estadisticas.vecesAplicada}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Monto Total Modificado
                  </Text>
                  <Text
                    fw={600}
                    c={
                      viewModal.selectedItem.estadisticas.montoTotalModificado >= 0
                        ? 'green'
                        : 'red'
                    }
                  >
                    ${viewModal.selectedItem.estadisticas.montoTotalModificado}
                  </Text>
                </div>
              </Group>
              {viewModal.selectedItem.estadisticas.ultimaAplicacion && (
                <div>
                  <Text size="xs" c="dimmed" mt="md">
                    Última Aplicación
                  </Text>
                  <Text>
                    {new Date(
                      viewModal.selectedItem.estadisticas.ultimaAplicacion
                    ).toLocaleString()}
                  </Text>
                </div>
              )}
            </Paper>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Confirmar Eliminación"
        size="sm"
      >
        {deleteModal.selectedItem && (
          <Stack gap="md">
            <Alert color="red" variant="light">
              ¿Estás seguro que deseas eliminar la regla &quot;{deleteModal.selectedItem.nombre}
              &quot;? Esta acción no se puede deshacer.
            </Alert>

            <Group justify="flex-end">
              <Button variant="light" onClick={deleteModal.close}>
                Cancelar
              </Button>

              <Button color="red" onClick={handleDelete} loading={deleteModal.loading}>
                Eliminar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default ReglaTarifaBuilder;
