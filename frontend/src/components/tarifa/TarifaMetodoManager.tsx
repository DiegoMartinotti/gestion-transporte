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
  JsonInput,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSettings,
  IconVariable,
  IconMath,
  IconRefresh,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import DataTable, { DataTableColumn } from '../base/DataTable';
import { useModal } from '../../hooks/useModal';
import { useDataLoader } from '../../hooks/useDataLoader';
import FormulaEditor from './FormulaEditor';
import {
  ITarifaMetodo,
  IVariableDefinition,
  TarifaMetodoFormData,
  TarifaMetodoFilters,
  TIPOS_VARIABLE,
  ORIGENES_VARIABLE,
} from '../../types/tarifa';

interface TarifaMetodoManagerProps {
  onSelect?: (metodo: ITarifaMetodo) => void;
  showSelection?: boolean;
}

// Mock service - en producción sería un servicio real
const tarifaMetodoService = {
  getAll: async (_filters?: TarifaMetodoFilters) => {
    // Simulación de datos
    return {
      data: [
        {
          _id: '1',
          codigo: 'DISTANCIA_PALET',
          nombre: 'Cálculo por Distancia y Palets',
          descripcion: 'Tarifa basada en distancia kilométrica y cantidad de palets',
          formulaBase: 'Valor * Distancia * Palets + Peaje',
          variables: [
            {
              nombre: 'Distancia',
              descripcion: 'Distancia en kilómetros',
              tipo: 'number' as const,
              origen: 'tramo' as const,
              campo: 'distancia',
              requerido: true,
            },
          ],
          activo: true,
          prioridad: 100,
          requiereDistancia: true,
          requierePalets: true,
          permiteFormulasPersonalizadas: true,
          configuracion: {},
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
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

  create: async (data: TarifaMetodoFormData) => {
    console.log('Creating tarifa method:', data);
    return { success: true };
  },

  update: async (id: string, data: TarifaMetodoFormData) => {
    console.log('Updating tarifa method:', id, data);
    return { success: true };
  },

  delete: async (id: string) => {
    console.log('Deleting tarifa method:', id);
    return { success: true };
  },
};

const TarifaMetodoManager: React.FC<TarifaMetodoManagerProps> = ({
  onSelect,
  showSelection = false,
}) => {
  const [_filters] = useState<TarifaMetodoFilters>({}); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Data loading
  const {
    data: metodos,
    loading,
    refresh,
  } = useDataLoader({
    fetchFunction: () => tarifaMetodoService.getAll(_filters),
    dependencies: [_filters],
    errorMessage: 'Error al cargar métodos de tarifa',
  });

  // Modals
  const formModal = useModal<ITarifaMetodo>({
    onSuccess: refresh,
  });

  const viewModal = useModal<ITarifaMetodo>();
  const deleteModal = useModal<ITarifaMetodo>();

  // Form
  const form = useForm<TarifaMetodoFormData>({
    initialValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      formulaBase: 'Valor * Cantidad + Peaje',
      variables: [],
      activo: true,
      prioridad: 100,
      requiereDistancia: false,
      requierePalets: false,
      permiteFormulasPersonalizadas: true,
      configuracion: {},
    },
    validate: {
      codigo: (value) => (!value ? 'El código es requerido' : null),
      nombre: (value) => (!value ? 'El nombre es requerido' : null),
      descripcion: (value) => (!value ? 'La descripción es requerida' : null),
      formulaBase: (value) => (!value ? 'La fórmula base es requerida' : null),
      prioridad: (value) => (value < 1 ? 'La prioridad debe ser mayor a 0' : null),
    },
  });

  // Variable form
  const [newVariable, setNewVariable] = useState<IVariableDefinition>({
    nombre: '',
    descripcion: '',
    tipo: 'number',
    origen: 'tramo',
    requerido: false,
  });

  // Handlers
  const handleEdit = (metodo: ITarifaMetodo) => {
    form.setValues({
      codigo: metodo.codigo,
      nombre: metodo.nombre,
      descripcion: metodo.descripcion,
      formulaBase: metodo.formulaBase,
      variables: metodo.variables,
      activo: metodo.activo,
      prioridad: metodo.prioridad,
      requiereDistancia: metodo.requiereDistancia,
      requierePalets: metodo.requierePalets,
      permiteFormulasPersonalizadas: metodo.permiteFormulasPersonalizadas,
      configuracion: metodo.configuracion,
    });
    formModal.openEdit(metodo);
  };

  const handleSubmit = async (values: TarifaMetodoFormData) => {
    try {
      formModal.setLoading(true);

      if (formModal.selectedItem) {
        await tarifaMetodoService.update(formModal.selectedItem._id, values);
        notifications.show({
          title: 'Éxito',
          message: 'Método de tarifa actualizado correctamente',
          color: 'green',
        });
      } else {
        await tarifaMetodoService.create(values);
        notifications.show({
          title: 'Éxito',
          message: 'Método de tarifa creado correctamente',
          color: 'green',
        });
      }

      formModal.onSuccess();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar el método de tarifa',
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
      await tarifaMetodoService.delete(deleteModal.selectedItem._id);

      notifications.show({
        title: 'Éxito',
        message: 'Método de tarifa eliminado correctamente',
        color: 'green',
      });

      refresh();
      deleteModal.close();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar el método de tarifa',
        color: 'red',
      });
    } finally {
      deleteModal.setLoading(false);
    }
  };

  const handleFiltersChange = (_newFilters: any) => {
    // Implementation would go here
  };

  const addVariable = () => {
    if (!newVariable.nombre || !newVariable.descripcion) {
      notifications.show({
        title: 'Error',
        message: 'Nombre y descripción son requeridos',
        color: 'red',
      });
      return;
    }

    const variables = [...form.values.variables];

    // Validar que no exista
    if (variables.some((v) => v.nombre === newVariable.nombre)) {
      notifications.show({
        title: 'Error',
        message: 'Ya existe una variable con ese nombre',
        color: 'red',
      });
      return;
    }

    variables.push({ ...newVariable });
    form.setFieldValue('variables', variables);

    setNewVariable({
      nombre: '',
      descripcion: '',
      tipo: 'number',
      origen: 'tramo',
      requerido: false,
    });
  };

  const removeVariable = (index: number) => {
    const variables = [...form.values.variables];
    variables.splice(index, 1);
    form.setFieldValue('variables', variables);
  };

  // Table columns
  const columns: DataTableColumn<ITarifaMetodo>[] = [
    {
      key: 'codigo',
      label: 'Código',
      sortable: true,
      width: 150,
      render: (metodo) => <Text fw={600}>{metodo.codigo}</Text>,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (metodo) => (
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {metodo.nombre}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {metodo.descripcion}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'configuracion',
      label: 'Configuración',
      align: 'center',
      width: 120,
      render: (metodo) => (
        <Group gap="xs" justify="center">
          {metodo.requiereDistancia && (
            <Badge size="xs" color="blue" variant="light">
              Dist.
            </Badge>
          )}
          {metodo.requierePalets && (
            <Badge size="xs" color="green" variant="light">
              Palets
            </Badge>
          )}
          {metodo.permiteFormulasPersonalizadas && (
            <Badge size="xs" color="orange" variant="light">
              Custom
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'variables',
      label: 'Variables',
      align: 'center',
      width: 100,
      render: (metodo) => <Badge variant="light">{metodo.variables.length}</Badge>,
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      sortable: true,
      align: 'center',
      width: 100,
    },
    {
      key: 'activo',
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
      render: (metodo) => (
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label="Ver detalles">
            <ActionIcon variant="light" size="sm" onClick={() => viewModal.openView(metodo)}>
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Editar">
            <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEdit(metodo)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>

          {showSelection && (
            <Tooltip label="Seleccionar">
              <ActionIcon
                variant="light"
                color="green"
                size="sm"
                onClick={() => onSelect?.(metodo)}
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Eliminar">
            <ActionIcon
              variant="light"
              color="red"
              size="sm"
              onClick={() => deleteModal.openDelete(metodo)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Métodos de Tarifación</Title>
          <Text size="sm" c="dimmed">
            Gestiona los métodos de cálculo de tarifas disponibles en el sistema
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
            Nuevo Método
          </Button>
        </Group>
      </Group>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={metodos}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Buscar métodos..."
      />

      {/* Form Modal */}
      <Modal
        opened={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.selectedItem ? 'Editar Método de Tarifa' : 'Nuevo Método de Tarifa'}
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
                  placeholder="METODO_CODIGO"
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
                placeholder="Nombre del método"
                required
                mt="md"
                {...form.getInputProps('nombre')}
              />

              <Textarea
                label="Descripción"
                placeholder="Descripción detallada del método"
                required
                mt="md"
                {...form.getInputProps('descripcion')}
              />

              <Group mt="md">
                <Switch label="Activo" {...form.getInputProps('activo', { type: 'checkbox' })} />

                <Switch
                  label="Requiere Distancia"
                  {...form.getInputProps('requiereDistancia', { type: 'checkbox' })}
                />

                <Switch
                  label="Requiere Palets"
                  {...form.getInputProps('requierePalets', { type: 'checkbox' })}
                />

                <Switch
                  label="Permite Fórmulas Personalizadas"
                  {...form.getInputProps('permiteFormulasPersonalizadas', { type: 'checkbox' })}
                />
              </Group>
            </Paper>

            {/* Fórmula Base */}
            <Paper p="md" withBorder>
              <Group mb="md" align="center">
                <IconMath size={20} />
                <Text fw={600}>Fórmula Base</Text>
              </Group>

              <FormulaEditor
                value={form.values.formulaBase}
                onChange={(value) => form.setFieldValue('formulaBase', value)}
                variables={form.values.variables}
                height={120}
              />
            </Paper>

            {/* Variables */}
            <Paper p="md" withBorder>
              <Group mb="md" align="center">
                <IconVariable size={20} />
                <Text fw={600}>Variables Personalizadas</Text>
              </Group>

              {/* Lista de variables existentes */}
              {form.values.variables.length > 0 && (
                <Stack gap="xs" mb="md">
                  {form.values.variables.map((variable, index) => (
                    <Paper key={index} p="sm" withBorder bg="gray.0">
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Badge color="blue" variant="light" size="sm">
                            {variable.nombre}
                          </Badge>
                          <Text size="sm">{variable.descripcion}</Text>
                          <Badge size="xs" variant="outline">
                            {variable.tipo}
                          </Badge>
                          <Badge size="xs" variant="outline" color="gray">
                            {variable.origen}
                          </Badge>
                          {variable.requerido && (
                            <Badge size="xs" color="red" variant="light">
                              Requerido
                            </Badge>
                          )}
                        </Group>

                        <ActionIcon
                          color="red"
                          variant="light"
                          size="sm"
                          onClick={() => removeVariable(index)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Formulario para nueva variable */}
              <Accordion>
                <Accordion.Item value="nueva-variable">
                  <Accordion.Control icon={<IconPlus size={16} />}>
                    Agregar Nueva Variable
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      <Group grow>
                        <TextInput
                          label="Nombre"
                          placeholder="NombreVariable"
                          value={newVariable.nombre}
                          onChange={(e) =>
                            setNewVariable((prev) => ({
                              ...prev,
                              nombre: e.currentTarget.value,
                            }))
                          }
                        />

                        <Select
                          label="Tipo"
                          data={TIPOS_VARIABLE}
                          value={newVariable.tipo}
                          onChange={(value) =>
                            setNewVariable((prev) => ({
                              ...prev,
                              tipo: value as any,
                            }))
                          }
                        />
                      </Group>

                      <TextInput
                        label="Descripción"
                        placeholder="Descripción de la variable"
                        value={newVariable.descripcion}
                        onChange={(e) =>
                          setNewVariable((prev) => ({
                            ...prev,
                            descripcion: e.currentTarget.value,
                          }))
                        }
                      />

                      <Group grow>
                        <Select
                          label="Origen"
                          data={ORIGENES_VARIABLE}
                          value={newVariable.origen}
                          onChange={(value) =>
                            setNewVariable((prev) => ({
                              ...prev,
                              origen: value as any,
                            }))
                          }
                        />

                        <TextInput
                          label="Campo (opcional)"
                          placeholder="campo.subcampo"
                          value={newVariable.campo || ''}
                          onChange={(e) =>
                            setNewVariable((prev) => ({
                              ...prev,
                              campo: e.currentTarget.value,
                            }))
                          }
                        />
                      </Group>

                      <Switch
                        label="Es requerido"
                        checked={newVariable.requerido}
                        onChange={(e) =>
                          setNewVariable((prev) => ({
                            ...prev,
                            requerido: e.currentTarget.checked,
                          }))
                        }
                      />

                      <Group justify="flex-end">
                        <Button
                          size="sm"
                          onClick={addVariable}
                          leftSection={<IconPlus size={16} />}
                        >
                          Agregar Variable
                        </Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Paper>

            {/* Configuración avanzada */}
            <Paper p="md" withBorder>
              <Text fw={600} mb="md">
                Configuración Avanzada
              </Text>

              <JsonInput
                label="Configuración JSON"
                placeholder='{"opcion": "valor"}'
                formatOnBlur
                validationError="JSON inválido"
                value={JSON.stringify(form.values.configuracion, null, 2)}
                onChange={(value) => {
                  try {
                    const parsed = JSON.parse(value || '{}');
                    form.setFieldValue('configuracion', parsed);
                  } catch (e) {
                    // Mantener el valor para mostrar error
                  }
                }}
                rows={4}
              />
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
        title="Detalles del Método"
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

            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Fórmula Base
              </Text>
              <FormulaEditor
                value={viewModal.selectedItem.formulaBase}
                onChange={() => {
                  /* readonly */
                }}
                variables={viewModal.selectedItem.variables}
                readonly={true}
                showVariablePicker={false}
                showFunctionHelper={false}
              />
            </Paper>

            {viewModal.selectedItem.variables.length > 0 && (
              <Paper p="md" withBorder>
                <Text fw={600} mb="sm">
                  Variables ({viewModal.selectedItem.variables.length})
                </Text>
                <Stack gap="xs">
                  {viewModal.selectedItem.variables.map((variable, index) => (
                    <Group key={index} justify="space-between" p="sm" bg="gray.0">
                      <Group>
                        <Badge color="blue" variant="light">
                          {variable.nombre}
                        </Badge>
                        <Text size="sm">{variable.descripcion}</Text>
                      </Group>
                      <Group gap="xs">
                        <Badge size="xs" variant="outline">
                          {variable.tipo}
                        </Badge>
                        <Badge size="xs" variant="outline" color="gray">
                          {variable.origen}
                        </Badge>
                        {variable.requerido && (
                          <Badge size="xs" color="red" variant="light">
                            Requerido
                          </Badge>
                        )}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
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
              ¿Estás seguro que deseas eliminar el método &quot;{deleteModal.selectedItem.nombre}
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

export default TarifaMetodoManager;
