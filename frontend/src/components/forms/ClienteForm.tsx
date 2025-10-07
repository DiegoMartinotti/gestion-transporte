import {
  Paper,
  Stack,
  TextInput,
  Textarea,
  Switch,
  Group,
  Button,
  Title,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, useMemo, useCallback } from 'react';
import { Cliente } from '../../types';
import { FieldWrapper } from '../base';
import { clienteValidationRules } from './validation/clienteValidation';
import { saveCliente, handleClienteError } from './helpers/clienteHelpers';

interface ClienteFormProps {
  cliente?: Cliente;
  onSuccess?: (cliente: Cliente) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

interface ClienteFormData {
  nombre: string;
  cuit: string;
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  activo: boolean;
}

// Component hooks
function useClienteFormSetup(cliente?: Cliente, mode: 'create' | 'edit' = 'create') {
  const [loading, setLoading] = useState(false);
  const validationRules = useMemo(() => clienteValidationRules, []);

  const form = useForm<ClienteFormData>({
    initialValues: {
      nombre: cliente?.nombre || '',
      cuit: cliente?.cuit || '',
      email: cliente?.email || '',
      telefono: cliente?.telefono || '',
      direccion: cliente?.direccion || '',
      contacto: cliente?.contacto || '',
      activo: cliente?.activo ?? true,
    },
    validate: validationRules,
  });

  const isEditing = useMemo(() => mode === 'edit', [mode]);
  const title = useMemo(() => (isEditing ? 'Editar Cliente' : 'Nuevo Cliente'), [isEditing]);

  return { form, loading, setLoading, isEditing, title };
}

// Submit handler hook
function useClienteSubmit(
  mode: 'create' | 'edit',
  setLoading: (loading: boolean) => void,
  clienteId?: string,
  onSuccess?: (cliente: Cliente) => void
) {
  return useCallback(
    async (values: ClienteFormData) => {
      try {
        setLoading(true);
        const result = await saveCliente(values, mode, clienteId);
        onSuccess?.(result);
      } catch (error: unknown) {
        handleClienteError(error);
      } finally {
        setLoading(false);
      }
    },
    [mode, setLoading, clienteId, onSuccess]
  );
}

// Form field renderers
interface ClienteFormRenderProps {
  form: ReturnType<typeof useForm<ClienteFormData>>;
  loading: boolean;
}

function ClienteBasicFields({ form, loading }: Readonly<ClienteFormRenderProps>) {
  return (
    <>
      <FieldWrapper label="Nombre" required description="Nombre o razón social del cliente">
        <TextInput
          placeholder="Ingrese el nombre del cliente"
          {...form.getInputProps('nombre')}
          disabled={loading}
        />
      </FieldWrapper>

      <FieldWrapper label="CUIT" required description="CUIT del cliente (formato: XX-XXXXXXXX-X)">
        <TextInput placeholder="20-12345678-9" {...form.getInputProps('cuit')} disabled={loading} />
      </FieldWrapper>
    </>
  );
}

function ClienteContactFields({ form, loading }: Readonly<ClienteFormRenderProps>) {
  return (
    <>
      <Group grow>
        <FieldWrapper label="Email" description="Email de contacto principal">
          <TextInput
            type="email"
            placeholder="cliente@ejemplo.com"
            {...form.getInputProps('email')}
            disabled={loading}
          />
        </FieldWrapper>

        <FieldWrapper label="Teléfono" description="Número de teléfono de contacto">
          <TextInput
            placeholder="+54 11 4444-5555"
            {...form.getInputProps('telefono')}
            disabled={loading}
          />
        </FieldWrapper>
      </Group>

      <FieldWrapper label="Dirección" description="Dirección física del cliente">
        <Textarea
          placeholder="Ingrese la dirección completa"
          rows={2}
          {...form.getInputProps('direccion')}
          disabled={loading}
        />
      </FieldWrapper>

      <FieldWrapper
        label="Persona de Contacto"
        description="Nombre de la persona de contacto principal"
      >
        <TextInput
          placeholder="Nombre del contacto"
          {...form.getInputProps('contacto')}
          disabled={loading}
        />
      </FieldWrapper>
    </>
  );
}

function ClienteStatusFields({ form, loading }: Readonly<ClienteFormRenderProps>) {
  return (
    <>
      <FieldWrapper label="Estado" description="Define si el cliente está activo para operaciones">
        <Switch
          label={form.values.activo ? 'Cliente Activo' : 'Cliente Inactivo'}
          {...form.getInputProps('activo', { type: 'checkbox' })}
          disabled={loading}
        />
      </FieldWrapper>

      {!form.values.activo && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="yellow" variant="light">
          <strong>Atención:</strong> Un cliente inactivo no podrá ser utilizado para crear nuevos
          viajes, tramos o sites.
        </Alert>
      )}
    </>
  );
}

interface ClienteActionButtonsProps {
  onCancel?: () => void;
  loading: boolean;
  isEditing: boolean;
}

function ClienteActionButtons({
  onCancel,
  loading,
  isEditing,
}: Readonly<ClienteActionButtonsProps>) {
  return (
    <Group justify="flex-end" gap="sm">
      {onCancel && (
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      )}
      <Button type="submit" loading={loading} leftSection={<IconDeviceFloppy size="1rem" />}>
        {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
      </Button>
    </Group>
  );
}

export function ClienteForm({
  cliente,
  onSuccess,
  onCancel,
  mode = 'create',
}: Readonly<ClienteFormProps>) {
  const { form, loading, setLoading, isEditing, title } = useClienteFormSetup(cliente, mode);
  const handleSubmit = useClienteSubmit(mode, setLoading, cliente?._id, onSuccess);

  return (
    <Paper p="lg" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={3}>{title}</Title>

          <Stack gap="md">
            <ClienteBasicFields form={form} loading={loading} />
            <ClienteContactFields form={form} loading={loading} />
            <ClienteStatusFields form={form} loading={loading} />
          </Stack>

          <ClienteActionButtons onCancel={onCancel} loading={loading} isEditing={isEditing} />
        </Stack>
      </form>
    </Paper>
  );
}
