import React from 'react';
import { Title, Text, Badge, Group, Card, Avatar, Alert, ActionIcon, Tooltip } from '@mantine/core';
import { IconUser, IconId, IconAlertTriangle, IconEdit } from '@tabler/icons-react';
import type { PersonalHeaderCardProps } from './PersonalDetailTypes';
import { getTipoColor } from './PersonalDetailHelpers';

export const PersonalHeaderCard: React.FC<PersonalHeaderCardProps> = ({
  personal,
  onEdit,
  showEditButton,
  isEmployed,
}) => (
  <Card withBorder p="lg">
    <Group justify="space-between" mb="md">
      <Group>
        <Avatar size="xl" radius="xl">
          <IconUser size={32} />
        </Avatar>
        <div>
          <Group gap="xs" align="center">
            <Title order={2}>
              {personal.nombre} {personal.apellido}
            </Title>
            <Badge size="lg" color={getTipoColor(personal.tipo)} variant="light">
              {personal.tipo}
            </Badge>
            <Badge
              size="lg"
              color={personal.activo ? 'green' : 'gray'}
              variant={personal.activo ? 'light' : 'outline'}
            >
              {personal.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Group>
          <Group gap="md" mt="xs">
            <Text size="sm" c="dimmed">
              <IconId size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              DNI: {personal.dni}
            </Text>
            {personal.cuil && (
              <Text size="sm" c="dimmed">
                CUIL: {personal.cuil}
              </Text>
            )}
            {personal.numeroLegajo && (
              <Text size="sm" c="dimmed">
                Legajo: {personal.numeroLegajo}
              </Text>
            )}
          </Group>
        </div>
      </Group>

      {showEditButton && onEdit && (
        <Tooltip label="Editar personal">
          <ActionIcon size="lg" color="blue" onClick={() => onEdit(personal)}>
            <IconEdit size={20} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>

    {!isEmployed && (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        title="Empleado sin período activo"
        color="yellow"
        mb="md"
      >
        Este empleado no tiene un período de empleo activo actualmente.
      </Alert>
    )}
  </Card>
);
