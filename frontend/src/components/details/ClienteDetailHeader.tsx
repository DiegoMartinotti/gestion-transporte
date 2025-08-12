import { Paper, Title, Text, Group, Stack, Badge, Avatar, Button, Alert } from '@mantine/core';
import { IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { Cliente } from '../../types';

interface ClienteDetailHeaderProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
}

export function ClienteDetailHeader({ cliente, onEdit, onDelete }: ClienteDetailHeaderProps) {
  const initials = cliente.nombre
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" align="flex-start">
        <Group gap="lg">
          <Avatar color="blue" radius="xl" size="xl">
            {initials}
          </Avatar>

          <Stack gap="xs">
            <Group gap="sm" align="center">
              <Title order={2}>{cliente.nombre}</Title>
              <Badge color={cliente.activo ? 'green' : 'red'} variant="light" size="lg">
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </Group>

            <Text c="dimmed" size="sm">
              Cliente registrado el {formatDate(cliente.createdAt)}
            </Text>
          </Stack>
        </Group>

        <Group gap="sm">
          {onEdit && (
            <Button
              variant="outline"
              leftSection={<IconEdit size="1rem" />}
              onClick={() => onEdit(cliente)}
            >
              Editar
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              color="red"
              leftSection={<IconTrash size="1rem" />}
              onClick={() => onDelete(cliente)}
            >
              Eliminar
            </Button>
          )}
        </Group>
      </Group>

      {!cliente.activo && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="yellow" variant="light" mt="md">
          <strong>Cliente Inactivo:</strong> Este cliente no puede ser utilizado para crear nuevos
          viajes, tramos o sites.
        </Alert>
      )}
    </Paper>
  );
}
