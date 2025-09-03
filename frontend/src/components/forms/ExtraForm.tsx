import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Select,
  Textarea,
  NumberInput,
  Alert,
  Paper,
  Title,
  Divider,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCalendar, IconCoin, IconDeviceFloppy } from '@tabler/icons-react';
import { ClienteSelector } from '../selectors/ClienteSelector';
import { extraService, type ExtraFormData, type Extra } from '../../services/extraService';
import { clienteService } from '../../services/clienteService';
import { Cliente } from '../../types';
import { showNotification } from '@mantine/notifications';

interface ExtraFormProps {
  extraId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TIPOS_EXTRA = [
  { value: 'PEAJE', label: 'Peaje' },
  { value: 'COMBUSTIBLE', label: 'Combustible' },
  { value: 'ESTADIA', label: 'Estadía' },
  { value: 'CARGA_DESCARGA', label: 'Carga/Descarga' },
  { value: 'SEGURO', label: 'Seguro' },
  { value: 'OTROS', label: 'Otros' },
];

// Custom hooks for ExtraForm
function useExtraFormSetup(extraId?: string) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [, setClientes] = useState<Cliente[]>([]);
  const [vigenciaError, setVigenciaError] = useState<string>('');

  const form = useForm<ExtraFormData>({
    initialValues: {
      tipo: '',
      cliente: '',
      descripcion: '',
      vigenciaDesde: new Date(),
      vigenciaHasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año por defecto
      valor: 0,
    },
    validate: {
      tipo: (value) => (!value ? 'El tipo es obligatorio' : null),
      cliente: (value) => (!value ? 'El cliente es obligatorio' : null),
      vigenciaDesde: (value) => (!value ? 'La fecha de inicio es obligatoria' : null),
      vigenciaHasta: (value, values) => {
        if (!value) return 'La fecha de fin es obligatoria';
        if (values.vigenciaDesde && new Date(value) <= new Date(values.vigenciaDesde)) {
          return 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        return null;
      },
      valor: (value) => {
        if (value === undefined || value === null) return 'El valor es obligatorio';
        if (value < 0) return 'El valor debe ser mayor o igual a 0';
        return null;
      },
    },
  });

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll();
      setClientes(data.data || data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const loadExtra = useCallback(async () => {
    if (!extraId) return;

    try {
      setLoading(true);
      const extra = (await extraService.getExtraById(extraId)) as Extra;
      form.setValues({
        tipo: extra.tipo,
        cliente: extra.cliente,
        descripcion: extra.descripcion || '',
        vigenciaDesde: new Date(extra.vigenciaDesde),
        vigenciaHasta: new Date(extra.vigenciaHasta),
        valor: extra.valor,
      });
    } catch (error) {
      console.error('Error cargando extra:', error);
      showNotification({
        title: 'Error',
        message: 'No se pudo cargar el extra',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [extraId, form, setLoading]);

  useEffect(() => {
    loadClientes();
    if (extraId) {
      loadExtra();
    }
  }, [extraId, loadExtra]);

  return {
    form,
    loading,
    setLoading,
    validating,
    setValidating,
    vigenciaError,
    setVigenciaError,
    loadClientes,
    loadExtra,
  };
}

interface ExtraFormActionsConfig {
  extraId?: string;
  setLoading: (loading: boolean) => void;
  setValidating: (validating: boolean) => void;
  setVigenciaError: (error: string) => void;
  onSuccess?: () => void;
}

function useExtraFormActions(config: ExtraFormActionsConfig) {
  const { extraId, setLoading, setValidating, setVigenciaError, onSuccess } = config;
  const validateVigencia = async (values: ExtraFormData) => {
    if (!values.tipo || !values.cliente || !values.vigenciaDesde || !values.vigenciaHasta) {
      return true; // No validar si faltan campos básicos
    }

    try {
      setValidating(true);
      setVigenciaError('');

      await extraService.validateVigencia({
        tipo: values.tipo,
        cliente: values.cliente,
        vigenciaDesde: values.vigenciaDesde,
        vigenciaHasta: values.vigenciaHasta,
        excludeId: extraId,
      });

      return true;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error validando vigencia';
      setVigenciaError(message);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (values: ExtraFormData) => {
    const isValidVigencia = await validateVigencia(values);
    if (!isValidVigencia) return;

    try {
      setLoading(true);

      if (extraId) {
        await extraService.updateExtra(extraId, values);
        showNotification({
          title: 'Éxito',
          message: 'Extra actualizado correctamente',
          color: 'green',
        });
      } else {
        await extraService.createExtra(values);
        showNotification({
          title: 'Éxito',
          message: 'Extra creado correctamente',
          color: 'green',
        });
      }

      onSuccess?.();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al guardar el extra';
      showNotification({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, validateVigencia };
}

interface ExtraFormBasicInfoProps {
  form: ReturnType<typeof useForm<ExtraFormData>>;
}

function ExtraFormBasicInfo({ form }: ExtraFormBasicInfoProps) {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={500} c="dimmed">
        INFORMACIÓN BÁSICA
      </Text>

      <Group grow>
        <Select
          label="Tipo de Extra"
          placeholder="Selecciona el tipo"
          required
          data={TIPOS_EXTRA}
          leftSection={<IconCoin size={16} />}
          {...form.getInputProps('tipo')}
        />

        <ClienteSelector
          label="Cliente"
          placeholder="Selecciona el cliente"
          required
          {...form.getInputProps('cliente')}
        />
      </Group>

      <Textarea
        label="Descripción"
        placeholder="Descripción opcional del extra..."
        rows={3}
        {...form.getInputProps('descripcion')}
      />

      <NumberInput
        label="Valor"
        placeholder="0"
        required
        min={0}
        decimalScale={2}
        fixedDecimalScale
        thousandSeparator=","
        prefix="$"
        leftSection={<IconCoin size={16} />}
        {...form.getInputProps('valor')}
      />
    </Stack>
  );
}

interface ExtraFormVigenciaProps {
  form: ReturnType<typeof useForm<ExtraFormData>>;
  vigenciaError: string;
  onVigenciaChange: () => void;
}

function ExtraFormVigencia({ form, vigenciaError, onVigenciaChange }: ExtraFormVigenciaProps) {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={500} c="dimmed">
        VIGENCIA
      </Text>

      <Group grow>
        <DateInput
          label="Vigencia Desde"
          placeholder="Fecha de inicio"
          required
          leftSection={<IconCalendar size={16} />}
          {...form.getInputProps('vigenciaDesde')}
          onChange={(value) => {
            form.setFieldValue('vigenciaDesde', value || new Date());
            onVigenciaChange();
          }}
        />

        <DateInput
          label="Vigencia Hasta"
          placeholder="Fecha de fin"
          required
          leftSection={<IconCalendar size={16} />}
          {...form.getInputProps('vigenciaHasta')}
          onChange={(value) => {
            form.setFieldValue('vigenciaHasta', value || new Date());
            onVigenciaChange();
          }}
        />
      </Group>

      {vigenciaError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {vigenciaError}
        </Alert>
      )}
    </Stack>
  );
}

interface ExtraFormActionsProps {
  onCancel?: () => void;
  loading: boolean;
  validating: boolean;
}

function ExtraFormActions({ onCancel, loading, validating }: ExtraFormActionsProps) {
  return (
    <Group justify="flex-end" gap="sm">
      {onCancel && (
        <Button variant="subtle" onClick={onCancel}>
          Cancelar
        </Button>
      )}

      <Button
        type="submit"
        loading={loading || validating}
        leftSection={<IconDeviceFloppy size={16} />}
      >
        {loading || validating ? 'Guardando...' : 'Guardar Extra'}
      </Button>
    </Group>
  );
}

export function ExtraForm({ extraId, onSuccess, onCancel }: ExtraFormProps) {
  const { form, loading, setLoading, validating, setValidating, vigenciaError, setVigenciaError } =
    useExtraFormSetup(extraId);

  const { handleSubmit } = useExtraFormActions({
    extraId,
    setLoading,
    setValidating,
    setVigenciaError,
    onSuccess,
  });

  const handleVigenciaChange = () => {
    if (vigenciaError) {
      setVigenciaError('');
    }
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>{extraId ? 'Editar Extra' : 'Nuevo Extra'}</Title>
        </Group>

        <Divider />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <ExtraFormBasicInfo form={form} />
            <Divider />
            <ExtraFormVigencia
              form={form}
              vigenciaError={vigenciaError}
              onVigenciaChange={handleVigenciaChange}
            />
            <Divider />
            <ExtraFormActions onCancel={onCancel} loading={loading} validating={validating} />
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
