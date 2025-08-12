import { Paper, Title, Text, Group, Stack, Badge, Avatar, Button, Alert } from '@mantine/core';
import { IconEdit, IconTrash, IconAlertCircle, IconBuilding } from '@tabler/icons-react';
import { Empresa } from '../../types';

interface EmpresaDetailHeaderProps {
  empresa: Empresa;
  onEdit?: (empresa: Empresa) => void;
  onDelete?: (empresa: Empresa) => void;
}

export function EmpresaDetailHeader({ empresa, onEdit, onDelete }: EmpresaDetailHeaderProps) {
  const initials = empresa.nombre
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const tipoColor = empresa.tipo === 'Propia' ? 'blue' : 'orange';

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Paper p="lg" withBorder>
      <Group justify="space-between" align="flex-start">
        <Group gap="lg">
          <Avatar color={tipoColor} radius="xl" size="xl">
            {initials}
          </Avatar>

          <Stack gap="xs">
            <Group gap="sm" align="center">
              <Title order={2}>{empresa.nombre}</Title>
              <Badge color={tipoColor} variant="light" size="lg">
                {empresa.tipo}
              </Badge>
              <Badge color={empresa.activa ? 'green' : 'red'} variant="light" size="lg">
                {empresa.activa ? 'Activa' : 'Inactiva'}
              </Badge>
            </Group>

            {empresa.razonSocial && (
              <Text c="dimmed" size="md" fw={500}>
                {empresa.razonSocial}
              </Text>
            )}

            <Text c="dimmed" size="sm">
              Empresa registrada el {formatDate(empresa.createdAt)}
            </Text>
          </Stack>
        </Group>

        <Group gap="sm">
          {onEdit && (
            <Button
              variant="outline"
              leftSection={<IconEdit size="1rem" />}
              onClick={() => onEdit(empresa)}
            >
              Editar
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              color="red"
              leftSection={<IconTrash size="1rem" />}
              onClick={() => onDelete(empresa)}
            >
              Eliminar
            </Button>
          )}
        </Group>
      </Group>

      {!empresa.activa && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="yellow" variant="light" mt="md">
          <strong>Empresa Inactiva:</strong> Esta empresa no puede ser utilizada para asignar
          personal o vehículos a viajes.
        </Alert>
      )}

      {empresa.tipo === 'Subcontratada' && (
        <Alert icon={<IconBuilding size="1rem" />} color="blue" variant="light" mt="md">
          <strong>Empresa Subcontratada:</strong> Esta empresa es utilizada para servicios externos
          y puede tener personal y vehículos asignados.
        </Alert>
      )}
    </Paper>
  );
}
