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
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, useMemo, useCallback } from 'react';
import { Empresa } from '../../types';
import { FieldWrapper } from '../base';
import { empresaValidationRules } from './validation/empresaValidation';
import { saveEmpresa, handleEmpresaError, TIPO_EMPRESA_OPTIONS } from './helpers/empresaHelpers';

// Custom hooks to reduce EmpresaForm complexity
const useEmpresaSubmit = (
  empresa?: Empresa,
  mode: 'create' | 'edit' = 'create',
  onSuccess?: (empresa: Empresa) => void
) => {
  return useCallback(
    async (values: EmpresaFormData, setLoading: (loading: boolean) => void) => {
      try {
        setLoading(true);
        const result = await saveEmpresa(values, mode, empresa?._id);
        onSuccess?.(result);
      } catch (error: unknown) {
        handleEmpresaError(error);
      } finally {
        setLoading(false);
      }
    },
    [mode, empresa?._id, onSuccess]
  );
};

// Helper functions for empresa initial values
const getEmpresaBasicData = (empresa?: Empresa) => ({
  nombre: empresa?.nombre || '',
  tipo: empresa?.tipo || 'Propia',
  razonSocial: empresa?.razonSocial || '',
});

const getEmpresaContactData = (empresa?: Empresa) => ({
  telefono: empresa?.telefono || '',
  mail: empresa?.mail || '',
  sitioWeb: empresa?.sitioWeb || '',
  contactoPrincipal: empresa?.contactoPrincipal || '',
});

const getEmpresaLegalData = (empresa?: Empresa) => ({
  cuit: empresa?.cuit || '',
  rut: empresa?.rut || '',
});

const getEmpresaAdditionalData = (empresa?: Empresa) => ({
  direccion: empresa?.direccion || '',
  observaciones: empresa?.observaciones || '',
  activa: empresa?.activa ?? true,
});

// Helper function to create initial values for empresa form
const createEmpresaInitialValues = (empresa?: Empresa): EmpresaFormData => ({
  ...getEmpresaBasicData(empresa),
  ...getEmpresaContactData(empresa),
  ...getEmpresaLegalData(empresa),
  ...getEmpresaAdditionalData(empresa),
});

const useEmpresaForm = (empresa?: Empresa) => {
  const [loading, setLoading] = useState(false);
  const validationRules = useMemo(() => empresaValidationRules, []);

  const form = useForm<EmpresaFormData>({
    initialValues: createEmpresaInitialValues(empresa),
    validate: validationRules,
  });

  return { form, loading, setLoading };
};

interface EmpresaFormProps {
  empresa?: Empresa;
  onSuccess?: (empresa: Empresa) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

interface EmpresaFormData {
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  razonSocial: string;
  direccion: string;
  telefono: string;
  mail: string;
  cuit: string;
  rut: string;
  sitioWeb: string;
  contactoPrincipal: string;
  activa: boolean;
  observaciones: string;
}

export function EmpresaForm({ empresa, onSuccess, onCancel, mode = 'create' }: EmpresaFormProps) {
  // Use custom hooks for form management
  const { form, loading, setLoading } = useEmpresaForm(empresa);
  const submitHandler = useEmpresaSubmit(empresa, mode, onSuccess);
  const handleSubmit = useCallback(
    (values: EmpresaFormData) => {
      submitHandler(values, setLoading);
    },
    [submitHandler, setLoading]
  );

  // Memoize computed values
  const isEditing = useMemo(() => mode === 'edit', [mode]);
  const title = useMemo(() => (isEditing ? 'Editar Empresa' : 'Nueva Empresa'), [isEditing]);

  // Extract form sections for better organization
  const renderBasicInfo = () => (
    <>
      <Group grow>
        <FieldWrapper label="Nombre" required description="Nombre o razón social de la empresa">
          <TextInput
            placeholder="Ingrese el nombre de la empresa"
            {...form.getInputProps('nombre')}
            disabled={loading}
          />
        </FieldWrapper>

        <FieldWrapper label="Tipo de Empresa" required description="Clasificación de la empresa">
          <Select
            placeholder="Seleccione el tipo"
            data={TIPO_EMPRESA_OPTIONS}
            {...form.getInputProps('tipo')}
            disabled={loading}
          />
        </FieldWrapper>
      </Group>

      <FieldWrapper label="Razón Social" description="Razón social completa de la empresa">
        <TextInput
          placeholder="Ingrese la razón social"
          {...form.getInputProps('razonSocial')}
          disabled={loading}
        />
      </FieldWrapper>
    </>
  );

  const renderContactInfo = () => (
    <>
      <Group grow>
        <FieldWrapper label="Email" description="Email de contacto principal">
          <TextInput
            type="email"
            placeholder="empresa@ejemplo.com"
            {...form.getInputProps('mail')}
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

      <Group grow>
        <FieldWrapper label="Sitio Web" description="Sitio web oficial de la empresa">
          <TextInput
            placeholder="https://www.empresa.com"
            {...form.getInputProps('sitioWeb')}
            disabled={loading}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Persona de Contacto"
          description="Nombre de la persona de contacto principal"
        >
          <TextInput
            placeholder="Nombre del contacto"
            {...form.getInputProps('contactoPrincipal')}
            disabled={loading}
          />
        </FieldWrapper>
      </Group>
    </>
  );

  const renderLegalInfo = () => (
    <Group grow>
      <FieldWrapper
        label="CUIT"
        description="Número de CUIT de la empresa (formato: XX-XXXXXXXX-X)"
      >
        <TextInput placeholder="20-12345678-9" {...form.getInputProps('cuit')} disabled={loading} />
      </FieldWrapper>

      <FieldWrapper label="RUT" description="RUT de la empresa (si corresponde)">
        <TextInput placeholder="Ingrese el RUT" {...form.getInputProps('rut')} disabled={loading} />
      </FieldWrapper>
    </Group>
  );

  const renderAdditionalInfo = () => (
    <>
      <FieldWrapper label="Dirección" description="Dirección física de la empresa">
        <Textarea
          placeholder="Ingrese la dirección completa"
          rows={2}
          {...form.getInputProps('direccion')}
          disabled={loading}
        />
      </FieldWrapper>

      <FieldWrapper label="Observaciones" description="Observaciones adicionales sobre la empresa">
        <Textarea
          placeholder="Ingrese observaciones adicionales"
          rows={2}
          {...form.getInputProps('observaciones')}
          disabled={loading}
        />
      </FieldWrapper>

      <FieldWrapper label="Estado" description="Define si la empresa está activa para operaciones">
        <Switch
          label={form.values.activa ? 'Empresa Activa' : 'Empresa Inactiva'}
          {...form.getInputProps('activa', { type: 'checkbox' })}
          disabled={loading}
        />
      </FieldWrapper>
    </>
  );

  const renderStatusAlert = () =>
    !form.values.activa && (
      <Alert icon={<IconAlertCircle size="1rem" />} color="yellow" variant="light">
        <strong>Atención:</strong> Una empresa inactiva no podrá ser utilizada para asignar personal
        o vehículos a viajes.
      </Alert>
    );

  const renderActionButtons = () => (
    <Group justify="flex-end" gap="sm">
      {onCancel && (
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      )}
      <Button type="submit" loading={loading} leftSection={<IconDeviceFloppy size="1rem" />}>
        {isEditing ? 'Actualizar Empresa' : 'Crear Empresa'}
      </Button>
    </Group>
  );

  return (
    <Paper p="lg" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={3}>{title}</Title>

          <Stack gap="md">
            {renderBasicInfo()}
            {renderContactInfo()}
            {renderLegalInfo()}
            {renderAdditionalInfo()}
            {renderStatusAlert()}
          </Stack>

          {renderActionButtons()}
        </Stack>
      </form>
    </Paper>
  );
}
