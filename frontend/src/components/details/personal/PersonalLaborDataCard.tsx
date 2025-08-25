import React from 'react';
import { Title, Text, Grid, Card } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import type { PersonalCardProps } from './PersonalDetailTypes';
import { hasValidDatosLaborales } from './PersonalDetailHelpers';

export const PersonalLaborDataCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (!hasValidDatosLaborales(personal.datosLaborales)) return null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconBuilding size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Datos Laborales
      </Title>
      <Grid>
        {personal.datosLaborales?.categoria && (
          <Grid.Col span={4}>
            <Text size="sm" c="dimmed">
              Categoría:
            </Text>
            <Text size="sm">{personal.datosLaborales?.categoria}</Text>
          </Grid.Col>
        )}
        {personal.datosLaborales?.obraSocial && (
          <Grid.Col span={4}>
            <Text size="sm" c="dimmed">
              Obra Social:
            </Text>
            <Text size="sm">{personal.datosLaborales?.obraSocial}</Text>
          </Grid.Col>
        )}
        {personal.datosLaborales?.art && (
          <Grid.Col span={4}>
            <Text size="sm" c="dimmed">
              ART:
            </Text>
            <Text size="sm">{personal.datosLaborales?.art}</Text>
          </Grid.Col>
        )}
      </Grid>
    </Card>
  );
};
