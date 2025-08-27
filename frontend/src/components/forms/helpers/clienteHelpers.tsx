import { Cliente } from '../../../types';
import { clienteService } from '../../../services/clienteService';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

interface ClienteFormData {
  nombre: string;
  cuit: string;
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  activo: boolean;
}

export const processClienteData = (values: ClienteFormData) => ({
  ...values,
  nombre: values.nombre.trim(),
  cuit: values.cuit.trim(),
  email: values.email.trim() || undefined,
  telefono: values.telefono.trim() || undefined,
  direccion: values.direccion.trim() || undefined,
  contacto: values.contacto.trim() || undefined,
});

export const saveCliente = async (
  values: ClienteFormData,
  mode: 'create' | 'edit',
  clienteId?: string
): Promise<Cliente> => {
  const clienteData = processClienteData(values);

  if (mode === 'edit' && clienteId) {
    const result = await clienteService.update(clienteId, clienteData);
    notifications.show({
      title: 'Cliente actualizado',
      message: `El cliente "${result.nombre}" ha sido actualizado correctamente`,
      color: 'green',
      icon: <IconCheck size="1rem" />,
    });
    return result;
  } else {
    const result = await clienteService.create(clienteData);
    notifications.show({
      title: 'Cliente creado',
      message: `El cliente "${result.nombre}" ha sido creado correctamente`,
      color: 'green',
      icon: <IconCheck size="1rem" />,
    });
    return result;
  }
};

export const handleClienteError = (error: unknown) => {
  console.error('Error saving cliente:', error);

  const errorMessage =
    error.response?.data?.message || error.message || 'Error al guardar el cliente';

  notifications.show({
    title: 'Error',
    message: errorMessage,
    color: 'red',
    icon: <IconX size="1rem" />,
  });
};
