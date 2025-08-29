import React, { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { ReportDefinition, ReportTemplate } from '../../types/reports';
import { reportService } from '../../services/reportService';
import { useReportBuilderLogic, ReportFormData } from './hooks/useReportBuilderLogic';
import { useReportBuilderHandlers } from './hooks/useReportBuilderHandlers';
import { ReportBuilderLayout } from './components/ReportBuilderLayout';

interface ReportBuilderProps {
  reportId?: string;
  template?: ReportTemplate;
  onSave?: (report: ReportDefinition) => void;
  onPreview?: (definition: ReportFormData) => void;
}

// Funciones auxiliares del ReportBuilder
const ReportBuilderHelpers = {
  createNewReportDefinition: (
    formValues: ReportFormData
  ): Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> => ({
    name: formValues.name,
    description: formValues.description,
    type: formValues.type,
    dataSource: formValues.dataSource,
    fields: formValues.fields,
    filters: formValues.filters || [],
    groupBy: formValues.groupBy,
    aggregations: formValues.aggregations,
    sorting: formValues.sorting,
    charts: formValues.charts,
    defaultDateRange: formValues.defaultDateRange,
    limit: formValues.limit,
    tags: formValues.tags,
    isTemplate: false,
  }),

  showSuccessNotification: (isUpdate: boolean) => {
    notifications.show({
      title: 'Éxito',
      message: `Reporte ${isUpdate ? 'actualizado' : 'creado'} correctamente`,
      color: 'green',
    });
  },

  showErrorNotification: (isUpdate: boolean) => {
    notifications.show({
      title: 'Error',
      message: `No se pudo ${isUpdate ? 'actualizar' : 'crear'} el reporte`,
      color: 'red',
    });
  },

  showIncompleteNotification: () => {
    notifications.show({
      title: 'Información incompleta',
      message: 'Debe seleccionar una fuente de datos y al menos un campo para previsualizar',
      color: 'orange',
    });
  },
};

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  reportId,
  template,
  onSave,
  onPreview,
}) => {
  const builderLogic = useReportBuilderLogic(reportId, template);
  const handlers = useReportBuilderHandlers(builderLogic.form, builderLogic.availableFields);

  const handleSave = useCallback(async () => {
    if (!builderLogic.form.validate().hasErrors) {
      try {
        builderLogic.setLoading(true);
        if (reportId) {
          const updated = await reportService.updateReportDefinition(
            reportId,
            builderLogic.form.values
          );
          onSave?.(updated);
        } else {
          const reportDefinition = ReportBuilderHelpers.createNewReportDefinition(
            builderLogic.form.values
          );
          const created = await reportService.createReportDefinition(reportDefinition);
          onSave?.(created);
        }
        ReportBuilderHelpers.showSuccessNotification(!!reportId);
      } catch (error) {
        ReportBuilderHelpers.showErrorNotification(!!reportId);
      } finally {
        builderLogic.setLoading(false);
      }
    }
  }, [builderLogic, reportId, onSave]);

  const handlePreview = useCallback(() => {
    const { dataSource, fields } = builderLogic.form.values;
    if (dataSource && fields && fields.length > 0) {
      onPreview?.(builderLogic.form.values);
      builderLogic.openPreviewModal();
    } else {
      ReportBuilderHelpers.showIncompleteNotification();
    }
  }, [builderLogic, onPreview]);

  return (
    <ReportBuilderLayout
      reportId={reportId}
      loading={builderLogic.loading}
      onPreview={handlePreview}
      onSave={handleSave}
      activeTab={builderLogic.activeTab}
      onTabChange={builderLogic.setActiveTab}
      form={builderLogic.form}
      dataSources={builderLogic.dataSources}
      selectedDataSource={builderLogic.selectedDataSource}
      availableFields={builderLogic.availableFields}
      filterHandlers={handlers.filterHandlers}
      groupByHandlers={handlers.groupByHandlers}
      aggregationHandlers={handlers.aggregationHandlers}
      chartHandlers={handlers.chartHandlers}
      previewModalOpened={builderLogic.previewModalOpened}
      closePreviewModal={builderLogic.closePreviewModal}
    />
  );
};
