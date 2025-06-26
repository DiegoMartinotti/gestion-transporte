import {
  Paper,
  Stack,
  TextInput,
  Textarea,
  Switch,
  Group,
  Button,
  Title,
  Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { Cliente } from '../../types';
import { clienteService } from '../../services/clienteService';
import { FieldWrapper } from '../base';

interface ClienteFormProps {
  cliente?: Cliente;
  onSuccess?: (cliente: Cliente) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

interface ClienteFormData {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  activo: boolean;
}

export function ClienteForm({ cliente, onSuccess, onCancel, mode = 'create' }: ClienteFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ClienteFormData>({
    initialValues: {
      nombre: cliente?.nombre || '',
      email: cliente?.email || '',
      telefono: cliente?.telefono || '',
      direccion: cliente?.direccion || '',
      contacto: cliente?.contacto || '',
      activo: cliente?.activo ?? true
    },
    validate: {
      nombre: (value) => {
        if (!value.trim()) return 'El nombre es obligatorio';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.trim().length > 100) return 'El nombre no puede tener más de 100 caracteres';
        return null;
      },
      email: (value) => {
        if (value && !/^\S+@\S+\.\S+$/.test(value)) {
          return 'Formato de email inválido';
        }
        return null;
      },
      telefono: (value) => {
        if (value && value.trim().length > 20) {
          return 'El teléfono no puede tener más de 20 caracteres';
        }
        return null;
      },
      direccion: (value) => {
        if (value && value.trim().length > 200) {
          return 'La dirección no puede tener más de 200 caracteres';
        }
        return null;
      },
      contacto: (value) => {
        if (value && value.trim().length > 100) {
          return 'El contacto no puede tener más de 100 caracteres';
        }
        return null;
      }
    }
  });

  const handleSubmit = async (values: ClienteFormData) => {
    try {
      setLoading(true);
      
      const clienteData = {
        ...values,
        nombre: values.nombre.trim(),
        email: values.email.trim() || undefined,
        telefono: values.telefono.trim() || undefined,
        direccion: values.direccion.trim() || undefined,
        contacto: values.contacto.trim() || undefined
      };

      let result: Cliente;
      
      if (mode === 'edit' && cliente?._id) {
        result = await clienteService.update(cliente._id, clienteData);
        notifications.show({
          title: 'Cliente actualizado',
          message: `El cliente "${result.nombre}" ha sido actualizado correctamente`,
          color: 'green',
          icon: <IconCheck size="1rem" />
        });
      } else {
        result = await clienteService.create(clienteData);
        notifications.show({
          title: 'Cliente creado',
          message: `El cliente "${result.nombre}" ha sido creado correctamente`,
          color: 'green',
          icon: <IconCheck size="1rem" />
        });
      }

      onSuccess?.(result);
    } catch (error: any) {
      console.error('Error saving cliente:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al guardar el cliente';
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        icon: <IconX size="1rem" />
      });
    } finally {
      setLoading(false);
    }
  };

  const isEditing = mode === 'edit';
  const title = isEditing ? 'Editar Cliente' : 'Nuevo Cliente';

  return (
    <Paper p="lg" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={3}>{title}</Title>

          <Stack gap="md">
            <FieldWrapper
              label="Nombre"
              required
              description="Nombre o razón social del cliente"
            >
              <TextInput
                placeholder="Ingrese el nombre del cliente"
                {...form.getInputProps('nombre')}
                disabled={loading}
              />
            </FieldWrapper>

            <Group grow>
              <FieldWrapper
                label="Email"
                description="Email de contacto principal"
              >
                <TextInput
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  {...form.getInputProps('email')}
                  disabled={loading}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Teléfono"
                description="Número de teléfono de contacto"
              >
                <TextInput
                  placeholder="+54 11 4444-5555"
                  {...form.getInputProps('telefono')}
                  disabled={loading}
                />
              </FieldWrapper>
            </Group>

            <FieldWrapper
              label="Dirección"
              description="Dirección física del cliente"
            >
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

            <FieldWrapper
              label="Estado"
              description="Define si el cliente está activo para operaciones"
            >
              <Switch
                label={form.values.activo ? 'Cliente Activo' : 'Cliente Inactivo'}
                {...form.getInputProps('activo', { type: 'checkbox' })}
                disabled={loading}
              />
            </FieldWrapper>

            {!form.values.activo && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                color="yellow"
                variant="light"
              >
                <strong>Atención:</strong> Un cliente inactivo no podrá ser utilizado 
                para crear nuevos viajes, tramos o sites.
              </Alert>
            )}
          </Stack>

          <Group justify="flex-end" gap="sm">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            
            <Button
              type="submit"
              loading={loading}
              leftSection={<IconCheck size="1rem" />}
            >
              {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}