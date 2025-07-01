import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Select,
  TextInput,
  Textarea,
  Text,
  Alert,
  Card,
  Stack,
  Divider,
  Badge,
  ActionIcon,
  Code,
  Paper,
  Grid
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconCalculator, IconHelp } from '@tabler/icons-react';
import { formulaService } from '../../services/formulaService';
import { clienteService } from '../../services/clienteService';
import { FormulaValidator } from '../validators/FormulaValidator';
import { FormulaPreview } from '../preview/FormulaPreview';
import { VariableHelper } from '../helpers/VariableHelper';

interface FormulaFormProps {
  clienteId?: string;
  formulaId?: string;
  onSave: () => void;
  onCancel: () => void;
}

interface FormValues {
  clienteId: string;
  tipoUnidad: 'Sider' | 'Bitren' | 'General';
  formula: string;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}

const TIPOS_UNIDAD = [
  { value: 'General', label: 'General (Aplica a todos)' },
  { value: 'Sider', label: 'Sider' },
  { value: 'Bitren', label: 'Bitren' }
];

const FORMULAS_EJEMPLO = [
  {
    name: 'Estándar',
    formula: 'Valor * Palets + Peaje',
    description: 'Fórmula básica del sistema'
  },
  {
    name: 'Descuento por volumen',
    formula: 'SI(Palets > 20; Valor * Palets * 0.85; Valor * Palets) + Peaje',
    description: '15% descuento para más de 20 palets'
  },
  {
    name: 'Tarifa mínima',
    formula: 'max(Valor * Palets, 5000) + Peaje',
    description: 'Garantiza un mínimo de $5000'
  },
  {
    name: 'Recargo por pocos palets',
    formula: 'SI(Palets < 5; Valor * Palets * 1.2; Valor * Palets) + Peaje',
    description: '20% recargo para menos de 5 palets'
  }
];

export const FormulaForm: React.FC<FormulaFormProps> = ({
  clienteId,
  formulaId,
  onSave,
  onCancel
}) => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showHelper, setShowHelper] = useState(false);
  const [conflictos, setConflictos] = useState<any[]>([]);

  const form = useForm<FormValues>({
    initialValues: {
      clienteId: clienteId || '',
      tipoUnidad: 'General',
      formula: 'Valor * Palets + Peaje',
      vigenciaDesde: new Date(),
      vigenciaHasta: null
    },
    validate: {
      clienteId: (value) => (!value ? 'Cliente es requerido' : null),
      formula: (value) => (!value ? 'Fórmula es requerida' : null),
      vigenciaDesde: (value) => (!value ? 'Fecha de inicio es requerida' : null),
      vigenciaHasta: (value, values) => {
        if (value && values.vigenciaDesde && value <= values.vigenciaDesde) {
          return 'Fecha de fin debe ser posterior a la fecha de inicio';
        }
        return null;
      }
    }
  });

  useEffect(() => {
    loadClientes();
    if (formulaId) {
      loadFormula();
    }
  }, [formulaId]);

  useEffect(() => {
    if (form.values.formula) {
      validateFormula(form.values.formula);
    }
  }, [form.values.formula]);

  useEffect(() => {
    if (form.values.clienteId && form.values.tipoUnidad && form.values.vigenciaDesde) {
      checkConflictos();
    }
  }, [form.values.clienteId, form.values.tipoUnidad, form.values.vigenciaDesde, form.values.vigenciaHasta]);

  const loadClientes = async () => {
    try {
      const response = await clienteService.getAll();
      setClientes(response.data || response || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
      setClientes([]);
    }
  };

  const loadFormula = async () => {
    if (!formulaId) return;
    
    try {
      setLoading(true);
      const response = await formulaService.getById(formulaId);
      const formula = response.data;
      
      if (formula) {
        form.setValues({
          clienteId: formula.clienteId,
          tipoUnidad: formula.tipoUnidad,
          formula: formula.formula,
          vigenciaDesde: new Date(formula.vigenciaDesde),
          vigenciaHasta: formula.vigenciaHasta ? new Date(formula.vigenciaHasta) : null
        });
      }
    } catch (error) {
      console.error('Error loading formula:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar la fórmula',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateFormula = async (formula: string) => {
    try {
      const result = await formulaService.validate(formula);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Error al validar la fórmula']
      });
    }
  };

  const checkConflictos = async () => {
    try {
      const response = await formulaService.checkConflictos({
        clienteId: form.values.clienteId,
        tipoUnidad: form.values.tipoUnidad,
        vigenciaDesde: form.values.vigenciaDesde,
        vigenciaHasta: form.values.vigenciaHasta,
        excludeId: formulaId
      });
      setConflictos(response.data || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!validationResult?.isValid) {
      notifications.show({
        title: 'Error',
        message: 'La fórmula contiene errores. Por favor corrígela antes de guardar.',
        color: 'red'
      });
      return;
    }

    if (conflictos.length > 0) {
      notifications.show({
        title: 'Conflicto de vigencias',
        message: 'Existen fórmulas que se superponen en las fechas seleccionadas',
        color: 'red'
      });
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        ...values,
        vigenciaDesde: values.vigenciaDesde.toISOString(),
        vigenciaHasta: values.vigenciaHasta?.toISOString() || null
      };

      if (formulaId) {
        await formulaService.update(formulaId, data);
        notifications.show({
          title: 'Éxito',
          message: 'Fórmula actualizada correctamente',
          color: 'green'
        });
      } else {
        await formulaService.create(data);
        notifications.show({
          title: 'Éxito',
          message: 'Fórmula creada correctamente',
          color: 'green'
        });
      }
      
      onSave();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al guardar la fórmula',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const insertExample = (formula: string) => {
    form.setFieldValue('formula', formula);
  };

  const selectedCliente = clientes.find(c => c._id === form.values.clienteId);

  return (
    <Box>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Cliente y Tipo de Unidad */}
          <Grid>
            <Grid.Col span={8}>
              <Select
                label="Cliente"
                placeholder="Seleccionar cliente"
                required
                data={clientes.map(c => ({ value: c._id, label: c.nombre || c.razonSocial || 'Sin nombre' }))}
                searchable
                disabled={!!clienteId}
                {...form.getInputProps('clienteId')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Tipo de Unidad"
                required
                data={TIPOS_UNIDAD}
                {...form.getInputProps('tipoUnidad')}
              />
            </Grid.Col>
          </Grid>

          {/* Vigencia */}
          <Grid>
            <Grid.Col span={6}>
              <DatePickerInput
                label="Vigencia desde"
                placeholder="Seleccionar fecha"
                required
                {...form.getInputProps('vigenciaDesde')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DatePickerInput
                label="Vigencia hasta"
                placeholder="Sin fecha límite"
                clearable
                {...form.getInputProps('vigenciaHasta')}
              />
            </Grid.Col>
          </Grid>

          {/* Conflictos de vigencia */}
          {conflictos.length > 0 && (
            <Alert icon={<IconX size={16} />} title="Conflictos detectados" color="red">
              <Text size="sm">
                Existen {conflictos.length} fórmula(s) que se superponen con las fechas seleccionadas:
              </Text>
              {conflictos.map((conflicto, index) => (
                <Text key={index} size="xs" c="dimmed">
                  • {conflicto.tipoUnidad} ({new Date(conflicto.vigenciaDesde).toLocaleDateString()} - {conflicto.vigenciaHasta ? new Date(conflicto.vigenciaHasta).toLocaleDateString() : 'Sin límite'})
                </Text>
              ))}
            </Alert>
          )}

          {/* Editor de fórmula */}
          <Card withBorder>
            <Stack gap="sm">
              <Group justify="apart">
                <Text fw={500}>Editor de Fórmula</Text>
                <ActionIcon
                  variant="light"
                  onClick={() => setShowHelper(!showHelper)}
                  title="Ayuda de variables"
                >
                  <IconHelp size={16} />
                </ActionIcon>
              </Group>

              <Textarea
                label="Fórmula"
                placeholder="Ejemplo: Valor * Palets + Peaje"
                required
                minRows={3}
                autosize
                {...form.getInputProps('formula')}
              />

              {/* Validación en tiempo real */}
              <FormulaValidator result={validationResult} />

              {/* Helper de variables */}
              {showHelper && <VariableHelper />}
            </Stack>
          </Card>

          {/* Fórmulas de ejemplo */}
          <Card withBorder>
            <Text fw={500} mb="sm">Fórmulas de Ejemplo</Text>
            <Stack gap="xs">
              {FORMULAS_EJEMPLO.map((ejemplo, index) => (
                <Paper key={index} p="xs" withBorder>
                  <Group justify="apart" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" mb={4}>
                        <Badge size="sm" variant="light">{ejemplo.name}</Badge>
                      </Group>
                      <Code block fz="sm" mb={4}>{ejemplo.formula}</Code>
                      <Text size="xs" c="dimmed">{ejemplo.description}</Text>
                    </Box>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => insertExample(ejemplo.formula)}
                    >
                      Usar
                    </Button>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Card>

          {/* Vista previa */}
          {validationResult?.isValid && (
            <FormulaPreview
              formula={form.values.formula}
              clienteNombre={selectedCliente?.razonSocial}
              tipoUnidad={form.values.tipoUnidad}
            />
          )}

          {/* Botones */}
          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!validationResult?.isValid || conflictos.length > 0}
              leftSection={<IconCheck size={16} />}
            >
              {formulaId ? 'Actualizar' : 'Crear'} Fórmula
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};