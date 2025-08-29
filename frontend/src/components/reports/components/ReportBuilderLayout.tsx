import React from 'react';
import { Card, Text, Modal, Paper } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ReportFormData } from '../hooks/useReportBuilderLogic';
import { ReportBuilderHeader } from './ReportBuilderHeader';
import { ReportBuilderTabs } from './ReportBuilderTabs';

interface ReportBuilderLayoutProps {
  reportId?: string;
  loading: boolean;
  onPreview: () => void;
  onSave: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  form: UseFormReturnType<ReportFormData>;
  dataSources: Array<{ value: string; label: string }>;
  selectedDataSource: string | null;
  availableFields: Array<{ value: string; label: string; type?: string }>;
  filterHandlers: {
    add: () => void;
    remove: (index: number) => void;
    update: (index: number, field: string, value: string) => void;
  };
  groupByHandlers: {
    add: () => void;
    remove: (index: number) => void;
  };
  aggregationHandlers: {
    add: () => void;
    remove: (index: number) => void;
  };
  chartHandlers: {
    add: () => void;
    remove: (index: number) => void;
  };
  previewModalOpened: boolean;
  closePreviewModal: () => void;
}

export const ReportBuilderLayout: React.FC<ReportBuilderLayoutProps> = ({
  reportId,
  loading,
  onPreview,
  onSave,
  activeTab,
  onTabChange,
  form,
  dataSources,
  selectedDataSource,
  availableFields,
  filterHandlers,
  groupByHandlers,
  aggregationHandlers,
  chartHandlers,
  previewModalOpened,
  closePreviewModal,
}) => (
  <Paper p="md" shadow="sm">
    <ReportBuilderHeader
      reportId={reportId}
      loading={loading}
      onPreview={onPreview}
      onSave={onSave}
    />

    <ReportBuilderTabs
      activeTab={activeTab}
      onTabChange={onTabChange}
      form={form}
      dataSources={dataSources}
      selectedDataSource={selectedDataSource}
      availableFields={availableFields}
      filterHandlers={filterHandlers}
      groupByHandlers={groupByHandlers}
      aggregationHandlers={aggregationHandlers}
      chartHandlers={chartHandlers}
    />

    <Modal
      opened={previewModalOpened}
      onClose={closePreviewModal}
      title="Vista Previa del Reporte"
      size="xl"
      centered
    >
      <Card>
        <Text size="sm" c="dimmed" ta="center">
          La vista previa del reporte se mostrará aquí
        </Text>
      </Card>
    </Modal>
  </Paper>
);
