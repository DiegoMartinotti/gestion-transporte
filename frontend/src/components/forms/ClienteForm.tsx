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

export function ClienteForm({ cliente, onSuccess, onCancel, mode = 'create' }: ClienteFormProps) {
  const [loading, setLoading] = useState(false);

  // Use imported validation rules
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

  // Simplified submit handler using helpers
  const handleSubmit = useCallback(
    async (values: ClienteFormData) => {
      try {
        setLoading(true);
        const result = await saveCliente(values, mode, cliente?._id);
        onSuccess?.(result);
      } catch (error: any) {
        handleClienteError(error);
      } finally {
        setLoading(false);
      }
    },
    [mode, cliente?._id, onSuccess]
  );

  // Memoize computed values
  const isEditing = useMemo(() => mode === 'edit', [mode]);
  const title = useMemo(() => (isEditing ? 'Editar Cliente' : 'Nuevo Cliente'), [isEditing]);

  // Extract form fields rendering
  const renderBasicFields = () => (
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

  const renderContactFields = () => (
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

  const renderStatusFields = () => (
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

  const renderActionButtons = () => (
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

  return (
    <Paper p="lg" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={3}>{title}</Title>

          <Stack gap="md">
            {renderBasicFields()}
            {renderContactFields()}
            {renderStatusFields()}
          </Stack>

          {renderActionButtons()}
        </Stack>
      </form>
    </Paper>
  );
}
