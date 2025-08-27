import { Empresa } from '../../../types';
import { empresaService } from '../../../services/empresaService';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

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

export const processEmpresaData = (values: EmpresaFormData) => ({
  ...values,
  nombre: values.nombre.trim(),
  razonSocial: values.razonSocial.trim() || undefined,
  direccion: values.direccion.trim() || undefined,
  telefono: values.telefono.trim() || undefined,
  mail: values.mail.trim() || undefined,
  cuit: values.cuit.trim() || undefined,
  rut: values.rut.trim() || undefined,
  sitioWeb: values.sitioWeb.trim() || undefined,
  contactoPrincipal: values.contactoPrincipal.trim() || undefined,
  observaciones: values.observaciones.trim() || undefined,
});

export const saveEmpresa = async (
  values: EmpresaFormData,
  mode: 'create' | 'edit',
  empresaId?: string
): Promise<Empresa> => {
  const empresaData = processEmpresaData(values);

  if (mode === 'edit' && empresaId) {
    const result = await empresaService.update(empresaId, empresaData);
    notifications.show({
      title: 'Empresa actualizada',
      message: `La empresa "${result.nombre}" ha sido actualizada correctamente`,
      color: 'green',
      icon: <IconCheck size="1rem" />,
    });
    return result;
  } else {
    const result = await empresaService.create(empresaData);
    notifications.show({
      title: 'Empresa creada',
      message: `La empresa "${result.nombre}" ha sido creada correctamente`,
      color: 'green',
      icon: <IconCheck size="1rem" />,
    });
    return result;
  }
};

export const handleEmpresaError = (error: unknown) => {
  console.error('Error saving empresa:', error);

  const errorMessage =
    error.response?.data?.message || error.message || 'Error al guardar la empresa';

  notifications.show({
    title: 'Error',
    message: errorMessage,
    color: 'red',
    icon: <IconX size="1rem" />,
  });
};

export const TIPO_EMPRESA_OPTIONS = [
  { value: 'Propia', label: 'Propia' },
  { value: 'Subcontratada', label: 'Subcontratada' },
];
