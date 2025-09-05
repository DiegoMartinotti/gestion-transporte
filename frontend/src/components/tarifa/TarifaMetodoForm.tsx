import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Paper,
  Group,
  Button,
  TextInput,
  Textarea,
  Switch,
  NumberInput,
  Select,
  Text,
  ActionIcon,
  Badge,
  Accordion,
  JsonInput,
} from '@mantine/core';
import { IconPlus, IconTrash, IconMath, IconVariable } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import FormulaEditor from './FormulaEditor';
import { useModal } from '../../hooks/useModal';
import {
  ITarifaMetodo,
  IVariableDefinition,
  TarifaMetodoFormData,
  TIPOS_VARIABLE,
  ORIGENES_VARIABLE,
} from '../../types/tarifa';
import { tarifaMetodoService } from '../../services/TarifaMetodoService';

interface TarifaMetodoFormProps {
  formModal: ReturnType<typeof useModal<ITarifaMetodo>>;
  onSuccess: () => void;
}

/* eslint-disable max-lines-per-function */
const TarifaMetodoForm: React.FC<TarifaMetodoFormProps> = ({ formModal, onSuccess }) => {
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

  // Update form when modal opens with existing data
  React.useEffect(() => {
    if (formModal.selectedItem) {
      form.setValues({
        codigo: formModal.selectedItem.codigo,
        nombre: formModal.selectedItem.nombre,
        descripcion: formModal.selectedItem.descripcion,
        formulaBase: formModal.selectedItem.formulaBase,
        variables: formModal.selectedItem.variables,
        activo: formModal.selectedItem.activo,
        prioridad: formModal.selectedItem.prioridad,
        requiereDistancia: formModal.selectedItem.requiereDistancia,
        requierePalets: formModal.selectedItem.requierePalets,
        permiteFormulasPersonalizadas: formModal.selectedItem.permiteFormulasPersonalizadas,
        configuracion: formModal.selectedItem.configuracion,
      });
    } else {
      form.reset();
    }
  }, [formModal.selectedItem, form]);

  const handleSubmit = async (values: TarifaMetodoFormData) => {
    try {
      formModal.setLoading(true);

      if (formModal.selectedItem) {
        await tarifaMetodoService.update(formModal.selectedItem._id, values);
      } else {
        await tarifaMetodoService.create(values);
      }

      onSuccess();
      formModal.close();
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

  return (
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
                            tipo: value as 'string' | 'number' | 'boolean' | 'date',
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
                            origen: value as
                              | 'cliente'
                              | 'tramo'
                              | 'viaje'
                              | 'vehiculo'
                              | 'calculado'
                              | 'constante',
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
                      <Button size="sm" onClick={addVariable} leftSection={<IconPlus size={16} />}>
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
  );
};

export default TarifaMetodoForm;
