import { useState, useEffect, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  DataSource,
  ReportField,
  ReportTemplate,
  ReportType,
  DateRange,
  ReportFilter,
  ReportGroupBy,
  ReportAggregation,
  ReportSorting,
  ChartConfig,
} from '../../../types/reports';

// Tipo específico para el formulario del Report Builder
export interface ReportFormData {
  name: string;
  description?: string;
  type: ReportType;
  dataSource: string;
  fields: ReportField[];
  filters?: ReportFilter[];
  groupBy?: ReportGroupBy[];
  aggregations?: ReportAggregation[];
  sorting?: ReportSorting[];
  charts?: ChartConfig[];
  defaultDateRange?: DateRange;
  limit?: number;
  tags?: string[];
}

import { reportService } from '../../../services/reportService';

const getFormValidation = () => ({
  name: (value: string | undefined) => (!value ? 'El nombre es requerido' : null),
  dataSource: (value: string | undefined) =>
    !value ? 'Debe seleccionar una fuente de datos' : null,
  fields: (value: ReportField[] | undefined) =>
    !value || value.length === 0 ? 'Debe seleccionar al menos un campo' : null,
});

const getInitialValues = (template: ReportTemplate | undefined) => {
  if (!template) {
    return {
      name: '',
      description: '',
      type: 'custom' as const,
      dataSource: '',
      fields: [],
      filters: [],
      groupBy: [],
      aggregations: [],
      sorting: [],
      charts: [],
      defaultDateRange: 'last30days' as const,
      limit: 1000,
      tags: [],
    };
  }

  return {
    name: template.name,
    description: template.description,
    type: template.type,
    dataSource: template.definition.dataSource,
    fields: template.definition.fields,
    filters: template.definition.filters,
    groupBy: template.definition.groupBy,
    aggregations: template.definition.aggregations,
    sorting: template.definition.sorting,
    charts: template.definition.charts,
    defaultDateRange: template.definition.defaultDateRange,
    limit: template.definition.limit,
    tags: template.tags,
  };
};

export const useReportBuilderLogic = (
  reportId: string | undefined,
  template: ReportTemplate | undefined
) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] =
    useDisclosure(false);

  const form = useForm<ReportFormData>({
    initialValues: getInitialValues(template) as ReportFormData,
    validate: getFormValidation(),
  });

  const loadDataSources = useCallback(async () => {
    try {
      setLoading(true);
      const sources = await reportService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las fuentes de datos',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const report = await reportService.getReportDefinition(id);
        form.setValues(report);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'No se pudo cargar el reporte',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
  }, [reportId, loadReport]);

  useEffect(() => {
    if (form.values.dataSource && dataSources.length > 0) {
      const dataSource = dataSources.find((ds) => ds.key === form.values.dataSource);
      setSelectedDataSource(dataSource || null);
      setAvailableFields(dataSource?.fields || []);
    }
  }, [form.values.dataSource, dataSources]);

  return {
    dataSources,
    selectedDataSource,
    availableFields,
    loading,
    setLoading,
    activeTab,
    setActiveTab,
    previewModalOpened,
    openPreviewModal,
    closePreviewModal,
    form,
  };
};
