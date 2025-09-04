import React from 'react';
import { Grid, Card, Text } from '@mantine/core';
import { ReportDefinition, ReportTemplate } from '../../types/reports';

interface ReportSummaryCardsProps {
  reportDefinitions: ReportDefinition[];
  templates: ReportTemplate[];
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  reportDefinitions,
  templates,
}) => (
  <Grid>
    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Total de Reportes
        </Text>
        <Text size="xl" fw={700}>
          {reportDefinitions.length}
        </Text>
      </Card>
    </Grid.Col>
    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Plantillas Disponibles
        </Text>
        <Text size="xl" fw={700} c="blue">
          {templates.length}
        </Text>
      </Card>
    </Grid.Col>
    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Reportes Activos
        </Text>
        <Text size="xl" fw={700} c="green">
          {reportDefinitions.filter((r) => !r.isTemplate).length}
        </Text>
      </Card>
    </Grid.Col>
    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Tipos Únicos
        </Text>
        <Text size="xl" fw={700} c="orange">
          {new Set(reportDefinitions.map((r) => r.type)).size}
        </Text>
      </Card>
    </Grid.Col>
  </Grid>
);
