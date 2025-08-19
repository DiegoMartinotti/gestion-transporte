import { notifications } from '@mantine/notifications';
import { reportService } from '../../services/reportService';
import {
  ReportFilter,
  ReportGroupBy,
  ReportAggregation,
  ChartConfig,
  ReportField,
  DataSource,
  ReportDefinition,
} from '../../types';

export const REPORT_TYPES = [
  { value: 'table', label: 'Tabla' },
  { value: 'summary', label: 'Resumen' },
  { value: 'detailed', label: 'Detallado' },
  { value: 'pivot', label: 'Tabla dinámica' },
  { value: 'dashboard', label: 'Dashboard' },
];

export const DATE_RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes anterior' },
  { value: 'thisQuarter', label: 'Este trimestre' },
  { value: 'lastQuarter', label: 'Trimestre anterior' },
  { value: 'thisYear', label: 'Este año' },
  { value: 'lastYear', label: 'Año anterior' },
  { value: 'custom', label: 'Personalizado' },
];

export const FILTER_OPERATORS = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No contiene' },
  { value: 'starts_with', label: 'Empieza con' },
  { value: 'ends_with', label: 'Termina con' },
  { value: 'greater_than', label: 'Mayor que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'between', label: 'Entre' },
  { value: 'in', label: 'En lista' },
  { value: 'is_null', label: 'Es nulo' },
  { value: 'is_not_null', label: 'No es nulo' },
];

export const AGGREGATION_FUNCTIONS = [
  { value: 'sum', label: 'Suma' },
  { value: 'count', label: 'Contar' },
  { value: 'avg', label: 'Promedio' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
  { value: 'distinct', label: 'Valores únicos' },
];

export const CHART_TYPES = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'pie', label: 'Torta' },
  { value: 'area', label: 'Área' },
  { value: 'scatter', label: 'Dispersión' },
  { value: 'heatmap', label: 'Mapa de calor' },
  { value: 'gauge', label: 'Medidor' },
  { value: 'funnel', label: 'Embudo' },
];

// Función auxiliar para crear valores básicos del template
const createBasicTemplateValues = (template?: ReportDefinition | Record<string, unknown>) => ({
  name: template?.name || '',
  description: template?.description || '',
  type: template?.type || 'table',
  dataSource: template?.dataSource || '',
  fields: template?.fields || [],
  filters: template?.filters || [],
});

// Función auxiliar para crear valores de configuración del template
const createTemplateConfigValues = (template?: ReportDefinition | Record<string, unknown>) => ({
  groupBy: template?.groupBy || [],
  aggregations: template?.aggregations || [],
  sorting: template?.sorting || [],
  charts: template?.charts || [],
});

// Función auxiliar para crear valores de paginación y formato del template
const createTemplatePagingValues = (template?: ReportDefinition | Record<string, unknown>) => ({
  dateRange: template?.dateRange || 'last30days',
  customDateRange: template?.customDateRange || { from: null, to: null },
  pageSize: template?.pageSize || 25,
  exportFormats: template?.exportFormats || ['pdf', 'excel'],
  schedule: template?.schedule || null,
});
export const createInitialFormValues = (template?: ReportDefinition | Record<string, unknown>) => ({
  ...createBasicTemplateValues(template),
  ...createTemplateConfigValues(template),
  ...createTemplatePagingValues(template),
});

export const createFormValidationRules = () => ({
  name: (value: string) => (!value ? 'El nombre es requerido' : null),
  dataSource: (value: string) => (!value ? 'La fuente de datos es requerida' : null),
  fields: (value: ReportField[]) =>
    !value || value.length === 0 ? 'Debe seleccionar al menos un campo' : null,
});

export const loadDataSources = async (
  setLoading: (value: boolean) => void,
  setDataSources: (sources: DataSource[]) => void
) => {
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
};

export const loadReport = async (
  id: string,
  setLoading: (value: boolean) => void,
  form: { setValues: (values: ReportDefinition | Record<string, unknown>) => void }
) => {
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
};

export const createFilter = (
  availableFields: ReportField[],
  currentFilters: ReportFilter[] = []
): ReportFilter => ({
  id: `filter_${Date.now()}`,
  field: availableFields[0]?.key || '',
  operator: 'equals',
  value: '',
  label: `Filtro ${currentFilters.length + 1}`,
});

export const createGroupBy = (availableFields: ReportField[]): ReportGroupBy => ({
  field: availableFields[0]?.key || '',
  label: availableFields[0]?.label || '',
});

export const createAggregation = (availableFields: ReportField[]): ReportAggregation => {
  const numericFields = availableFields.filter((f) => f.type === 'number' || f.type === 'currency');
  const field = numericFields[0] || availableFields[0];

  return {
    field: field?.key || '',
    function: 'sum',
    label: `${AGGREGATION_FUNCTIONS[0].label} de ${field?.label || ''}`,
  };
};

export const createChart = (
  availableFields: ReportField[],
  currentCharts: ChartConfig[] = []
): ChartConfig => {
  const numericField = availableFields.find((f) => f.type === 'number');

  return {
    type: 'bar',
    title: `Gráfico ${currentCharts.length + 1}`,
    xAxis: availableFields[0]?.key || '',
    yAxis: [numericField?.key || availableFields[1]?.key || ''],
    showLegend: true,
    showGrid: true,
    showTooltip: true,
    height: 300,
  };
};

export const handleSaveReport = async (
  reportId: string | undefined,
  formValues: ReportDefinition | Record<string, unknown>,
  setLoading: (value: boolean) => void,
  onSave?: (report: ReportDefinition | Record<string, unknown>) => void
) => {
  try {
    setLoading(true);
    let result;

    if (reportId) {
      result = await reportService.updateReportDefinition(
        reportId,
        formValues as Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
      );
    } else {
      result = await reportService.createReportDefinition(
        formValues as Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
      );
    }

    onSave?.(result);

    notifications.show({
      title: 'Éxito',
      message: `Reporte ${reportId ? 'actualizado' : 'creado'} correctamente`,
      color: 'green',
    });

    return result;
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: `No se pudo ${reportId ? 'actualizar' : 'crear'} el reporte`,
      color: 'red',
    });
    throw error;
  } finally {
    setLoading(false);
  }
};

export const validatePreview = (
  formValues: ReportDefinition | Record<string, unknown>
): boolean => {
  if (
    !formValues.dataSource ||
    !formValues.fields ||
    (formValues.fields as ReportField[]).length === 0
  ) {
    notifications.show({
      title: 'Vista previa no disponible',
      message: 'Debe seleccionar una fuente de datos y al menos un campo',
      color: 'orange',
    });
    return false;
  }
  return true;
};
