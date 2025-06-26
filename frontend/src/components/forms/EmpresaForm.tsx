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
  Select
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { Empresa } from '../../types';
import { empresaService } from '../../services/empresaService';
import { FieldWrapper } from '../base';

interface EmpresaFormProps {
  empresa?: Empresa;
  onSuccess?: (empresa: Empresa) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

interface EmpresaFormData {
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  activo: boolean;
}

export function EmpresaForm({ empresa, onSuccess, onCancel, mode = 'create' }: EmpresaFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<EmpresaFormData>({
    initialValues: {
      nombre: empresa?.nombre || '',
      tipo: empresa?.tipo || 'Propia',
      email: empresa?.email || '',
      telefono: empresa?.telefono || '',
      direccion: empresa?.direccion || '',
      contacto: empresa?.contacto || '',
      activo: empresa?.activo ?? true
    },
    validate: {
      nombre: (value) => {
        if (!value.trim()) return 'El nombre es obligatorio';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.trim().length > 100) return 'El nombre no puede tener más de 100 caracteres';
        return null;
      },
      tipo: (value) => {
        if (!value) return 'El tipo de empresa es obligatorio';
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

  const handleSubmit = async (values: EmpresaFormData) => {
    try {
      setLoading(true);
      
      const empresaData = {
        ...values,
        nombre: values.nombre.trim(),
        email: values.email.trim() || undefined,
        telefono: values.telefono.trim() || undefined,
        direccion: values.direccion.trim() || undefined,
        contacto: values.contacto.trim() || undefined
      };

      let result: Empresa;
      
      if (mode === 'edit' && empresa?._id) {
        result = await empresaService.update(empresa._id, empresaData);
        notifications.show({
          title: 'Empresa actualizada',
          message: `La empresa "${result.nombre}" ha sido actualizada correctamente`,
          color: 'green',
          icon: <IconCheck size="1rem" />
        });
      } else {
        result = await empresaService.create(empresaData);
        notifications.show({
          title: 'Empresa creada',
          message: `La empresa "${result.nombre}" ha sido creada correctamente`,
          color: 'green',
          icon: <IconCheck size="1rem" />
        });
      }

      onSuccess?.(result);
    } catch (error: any) {
      console.error('Error saving empresa:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al guardar la empresa';
      
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
  const title = isEditing ? 'Editar Empresa' : 'Nueva Empresa';

  return (
    <Paper p="lg" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={3}>{title}</Title>

          <Stack gap="md">
            <Group grow>
              <FieldWrapper
                label="Nombre"
                required
                description="Nombre o razón social de la empresa"
              >
                <TextInput
                  placeholder="Ingrese el nombre de la empresa"
                  {...form.getInputProps('nombre')}
                  disabled={loading}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Tipo de Empresa"
                required
                description="Clasificación de la empresa"
              >
                <Select
                  placeholder="Seleccione el tipo"
                  data={[
                    { value: 'Propia', label: 'Propia' },
                    { value: 'Subcontratada', label: 'Subcontratada' }
                  ]}
                  {...form.getInputProps('tipo')}
                  disabled={loading}
                />
              </FieldWrapper>
            </Group>

            <Group grow>
              <FieldWrapper
                label="Email"
                description="Email de contacto principal"
              >
                <TextInput
                  type="email"
                  placeholder="empresa@ejemplo.com"
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
              description="Dirección física de la empresa"
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
              description="Define si la empresa está activa para operaciones"
            >
              <Switch
                label={form.values.activo ? 'Empresa Activa' : 'Empresa Inactiva'}
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
                <strong>Atención:</strong> Una empresa inactiva no podrá ser utilizada 
                para asignar personal o vehículos a viajes.
              </Alert>
            )}

            {form.values.tipo === 'Subcontratada' && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                color="blue"
                variant="light"
              >
                <strong>Empresa Subcontratada:</strong> Esta empresa será utilizada 
                para servicios externos y podrá tener personal y vehículos asignados.
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
              {isEditing ? 'Actualizar Empresa' : 'Crear Empresa'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}