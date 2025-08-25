import React from 'react';
import { Title, Text, Badge, Stack, Group, Card } from '@mantine/core';
import { IconUser, IconPhone, IconMapPin } from '@tabler/icons-react';
import type { PersonalCardProps, PersonalInfoCardProps } from './PersonalDetailTypes';
import {
  formatDate,
  getTipoColor,
  hasValidAddress,
  buildAddressString,
} from './PersonalDetailHelpers';

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({ personal, empresa, age }) => (
  <Card withBorder p="md">
    <Title order={4} mb="md">
      <IconUser size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
      Información Personal
    </Title>
    <Stack gap="sm">
      {personal.fechaNacimiento && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Fecha de Nacimiento:
          </Text>
          <Text size="sm">
            {formatDate(personal.fechaNacimiento)}
            {age && (
              <Text span c="dimmed">
                {' '}
                ({age} años)
              </Text>
            )}
          </Text>
        </Group>
      )}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Tipo:
        </Text>
        <Badge color={getTipoColor(personal.tipo)} variant="light">
          {personal.tipo}
        </Badge>
      </Group>
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Estado:
        </Text>
        <Badge color={personal.activo ? 'green' : 'gray'}>
          {personal.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </Group>
      {empresa && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Empresa:
          </Text>
          <Text size="sm">{empresa.nombre}</Text>
        </Group>
      )}
    </Stack>
  </Card>
);

export const PersonalContactInfoCard: React.FC<PersonalCardProps> = ({ personal }) => (
  <Card withBorder p="md">
    <Title order={4} mb="md">
      <IconPhone size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
      Información de Contacto
    </Title>
    <Stack gap="sm">
      {personal.contacto?.telefono && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Teléfono:
          </Text>
          <Text size="sm">{personal.contacto.telefono}</Text>
        </Group>
      )}
      {personal.contacto?.telefonoEmergencia && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Tel. Emergencia:
          </Text>
          <Text size="sm">{personal.contacto.telefonoEmergencia}</Text>
        </Group>
      )}
      {personal.contacto?.email && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Email:
          </Text>
          <Text size="sm">{personal.contacto.email}</Text>
        </Group>
      )}
    </Stack>
  </Card>
);

export const PersonalAddressCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (!hasValidAddress(personal.direccion)) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconMapPin size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Dirección
      </Title>
      <Text size="sm">
        {personal.direccion ? buildAddressString(personal.direccion) : 'Sin dirección'}
      </Text>
    </Card>
  );
};
