import { notifications } from '@mantine/notifications';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { IconFileTypePdf, IconFileTypeXls, IconFileTypeCsv, IconPhoto } from '@tabler/icons-react';
import { reportService } from '../../services/reportService';
import { ReportExecution, ReportExecutionStatus, ExportFormat } from '../../types/reports';

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'orange' },
  { value: 'running', label: 'Ejecutando', color: 'blue' },
  { value: 'completed', label: 'Completado', color: 'green' },
  { value: 'failed', label: 'Fallido', color: 'red' },
  { value: 'cancelled', label: 'Cancelado', color: 'gray' },
];

export const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF', icon: IconFileTypePdf, color: 'red' },
  { value: 'excel', label: 'Excel', icon: IconFileTypeXls, color: 'green' },
  { value: 'csv', label: 'CSV', icon: IconFileTypeCsv, color: 'blue' },
  { value: 'json', label: 'JSON', icon: IconPhoto, color: 'purple' },
];

export const formatExecutionDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
};

export const formatRelativeTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
};

export const getStatusBadgeColor = (status: ReportExecutionStatus) => {
  const option = STATUS_OPTIONS.find((o) => o.value === status);
  return option?.color || 'gray';
};

export const getFormatIcon = (format: ExportFormat) => {
  const option = FORMAT_OPTIONS.find((o) => o.value === format);
  return option?.icon || IconPhoto;
};

export const getFormatColor = (format: ExportFormat) => {
  const option = FORMAT_OPTIONS.find((o) => o.value === format);
  return option?.color || 'gray';
};

export const downloadReport = async (execution: ReportExecution) => {
  try {
    const blob = await reportService.downloadReportExecution(execution.id);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${execution.reportName}_${formatExecutionDate(execution.createdAt)}.${execution.format}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: 'Descarga iniciada',
      message: 'El reporte se está descargando',
      color: 'green',
    });
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'No se pudo descargar el reporte',
      color: 'red',
    });
    throw error;
  }
};

export const viewReport = async (execution: ReportExecution) => {
  try {
    const blob = await reportService.downloadReportExecution(execution.id);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    window.URL.revokeObjectURL(url);
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'No se pudo abrir el reporte',
      color: 'red',
    });
    throw error;
  }
};

export const deleteReportExecution = async (executionId: string) => {
  try {
    await reportService.deleteReportExecutions([executionId]);
    notifications.show({
      title: 'Éxito',
      message: 'Ejecución eliminada correctamente',
      color: 'green',
    });
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'No se pudo eliminar la ejecución',
      color: 'red',
    });
    throw error;
  }
};

export const shareReport = async (execution: ReportExecution) => {
  try {
    // TODO: Implement generateShareLink method in ReportService
    const shareLink = `${window.location.origin}/reports/executions/${execution.id}`;
    await navigator.clipboard.writeText(shareLink);
    notifications.show({
      title: 'Enlace copiado',
      message: 'El enlace para compartir se ha copiado al portapapeles',
      color: 'green',
    });
  } catch (error) {
    notifications.show({
      title: 'Error',
      message: 'No se pudo generar el enlace para compartir',
      color: 'red',
    });
    throw error;
  }
};

// Interface for execution filters
interface ExecutionFilters {
  reportId?: string;
  status?: string;
  format?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export const filterExecutions = (
  executions: ReportExecution[],
  filters: ExecutionFilters
): ReportExecution[] => {
  let filtered = [...executions];

  if (filters.reportId) {
    filtered = filtered.filter((e) => (e.reportId || e.reportDefinitionId) === filters.reportId);
  }

  if (filters.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  if (filters.format) {
    filtered = filtered.filter((e) => e.format === filters.format);
  }

  if (filters.startDate) {
    filtered = filtered.filter((e) => new Date(e.createdAt) >= filters.startDate!);
  }

  if (filters.endDate) {
    filtered = filtered.filter((e) => new Date(e.createdAt) <= filters.endDate!);
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.reportName.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.createdBy.toLowerCase().includes(term)
    );
  }

  return filtered;
};

export const sortExecutions = (
  executions: ReportExecution[],
  sortBy: string,
  sortDirection: 'asc' | 'desc'
): ReportExecution[] => {
  return [...executions].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.reportName;
        bValue = b.reportName;
        break;
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'format':
        aValue = a.format;
        bValue = b.format;
        break;
      case 'createdBy':
        aValue = a.createdBy;
        bValue = b.createdBy;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
};

export const paginateExecutions = (
  executions: ReportExecution[],
  page: number,
  pageSize: number
): ReportExecution[] => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return executions.slice(start, end);
};
