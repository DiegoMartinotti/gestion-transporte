import React, { useState } from 'react';
import { Title, Group, Button, Stack, Tabs, Container, Alert, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCalendarStats, IconHistory } from '@tabler/icons-react';
import { ScheduledReport, ReportDefinition } from '../../types/reports';
import { SchedulesList } from './scheduled/SchedulesList';
import { ScheduleModal } from './scheduled/ScheduleModal';
import { useScheduleForm } from './scheduled/useScheduleForm';
import { useScheduleHandlers } from './scheduled/useScheduleHandlers';
import { useScheduledReports } from '../../hooks/useScheduledReports';
import { getNextRunDate, getScheduleStatus } from '../../utils/scheduleUtils';

interface ScheduledReportsProps {
  reportDefinitions: ReportDefinition[];
  onScheduleCreate?: (schedule: ScheduledReport) => void;
  onScheduleUpdate?: (schedule: ScheduledReport) => void;
  onScheduleDelete?: (scheduleId: string) => void;
}

export const ScheduledReports: React.FC<ScheduledReportsProps> = ({
  reportDefinitions,
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete,
}) => {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');

  const {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleActive,
  } = useScheduledReports();

  const form = useScheduleForm();

  const {
    handleSubmit,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleCreateNew,
    handleCloseModal,
  } = useScheduleHandlers({
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleActive,
    editingSchedule,
    setEditingSchedule,
    form,
    openModal,
    closeModal,
    onScheduleCreate,
    onScheduleUpdate,
    onScheduleDelete,
  });

  const renderExecutionHistory = () => (
    <Alert color="blue" icon={<IconHistory size={16} />}>
      El historial de ejecuciones estará disponible próximamente. Podrá ver todas las ejecuciones
      pasadas, estados y archivos generados.
    </Alert>
  );

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Reportes Programados</Title>
            <Text c="dimmed" size="sm">
              Configure y gestione la ejecución automática de reportes
            </Text>
          </div>

          <Button leftSection={<IconPlus size={16} />} onClick={handleCreateNew}>
            Programar Reporte
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'list')}>
          <Tabs.List>
            <Tabs.Tab value="list" leftSection={<IconCalendarStats size={16} />}>
              Programaciones
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Historial
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="list" pt="md">
            <SchedulesList
              schedules={schedules}
              reportDefinitions={reportDefinitions}
              loading={loading}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onCreateNew={handleCreateNew}
              getNextRunDate={getNextRunDate}
              getScheduleStatus={getScheduleStatus}
            />
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            {renderExecutionHistory()}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <ScheduleModal
        opened={modalOpened}
        onClose={handleCloseModal}
        form={form}
        reportDefinitions={reportDefinitions}
        isEditing={!!editingSchedule}
        onSubmit={handleSubmit}
      />
    </Container>
  );
};
