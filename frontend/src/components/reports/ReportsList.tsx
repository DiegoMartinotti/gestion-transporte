import React from 'react';
import { Paper, Title, Group, Button, Loader, Text, Alert, Grid } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { ReportDefinition } from '../../types/reports';
import { ReportCard } from './ReportCard';

interface ReportsListProps {
  reportDefinitions: ReportDefinition[];
  loading: boolean;
  reportLoading: boolean;
  selectedReportId?: string;
  onRefresh: () => void;
  onExecuteReport: (report: ReportDefinition) => void;
  onEditReport: (report: ReportDefinition) => void;
  onDeleteReport: (report: ReportDefinition) => void;
}

export const ReportsList: React.FC<ReportsListProps> = ({
  reportDefinitions,
  loading,
  reportLoading,
  selectedReportId,
  onRefresh,
  onExecuteReport,
  onEditReport,
  onDeleteReport,
}) => (
  <Paper p="md" withBorder>
    <Group justify="space-between" mb="md">
      <Title order={4}>Mis Reportes</Title>
      <Group gap="xs">
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={onRefresh}
          loading={loading}
        >
          Actualizar
        </Button>
      </Group>
    </Group>

    {loading ? (
      <Group justify="center" py="xl">
        <Loader />
        <Text>Cargando reportes...</Text>
      </Group>
    ) : reportDefinitions.length === 0 ? (
      <Alert color="blue" title="Sin reportes">
        No hay reportes creados. Haga clic en &quot;Nuevo Reporte&quot; o use una plantilla para
        comenzar.
      </Alert>
    ) : (
      <Grid>
        {reportDefinitions.map((report) => (
          <Grid.Col key={report.id} span={6}>
            <ReportCard
              report={report}
              reportLoading={reportLoading}
              selectedReportId={selectedReportId}
              onExecuteReport={onExecuteReport}
              onEditReport={onEditReport}
              onDeleteReport={onDeleteReport}
            />
          </Grid.Col>
        ))}
      </Grid>
    )}
  </Paper>
);
