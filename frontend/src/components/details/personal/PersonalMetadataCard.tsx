import React from 'react';
import { Title, Text, Grid, Card } from '@mantine/core';
import type { PersonalCardProps } from './PersonalDetailTypes';
import { formatDate } from './PersonalDetailHelpers';

export const PersonalObservationsCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (!personal.observaciones) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        Observaciones
      </Title>
      <Text size="sm">{personal.observaciones}</Text>
    </Card>
  );
};

export const PersonalMetadataCard: React.FC<PersonalCardProps> = ({ personal }) => (
  <Card withBorder p="md">
    <Title order={4} mb="md">
      Información del Sistema
    </Title>
    <Grid>
      <Grid.Col span={6}>
        <Text size="sm" c="dimmed">
          Fecha de Creación:
        </Text>
        <Text size="sm">{formatDate(personal.createdAt)}</Text>
      </Grid.Col>
      <Grid.Col span={6}>
        <Text size="sm" c="dimmed">
          Última Actualización:
        </Text>
        <Text size="sm">{formatDate(personal.updatedAt)}</Text>
      </Grid.Col>
    </Grid>
  </Card>
);
