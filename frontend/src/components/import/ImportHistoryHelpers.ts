// Helpers para ImportHistory
import { ImportRecord, ImportStats } from './ImportHistoryTypes';

// Función helper para formatear duración
export const formatDuration = (startTime: Date, endTime: Date | null): string => {
  if (!endTime) return 'En progreso...';

  const duration = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// Función helper para formatear tamaño de archivo
export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

// Función helper para obtener el color del progreso
export const getProgressColor = (rate: number): string => {
  if (rate >= 95) return 'green';
  if (rate >= 80) return 'yellow';
  return 'red';
};

// Función helper para obtener el texto del status
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    completed: 'Completada',
    failed: 'Falló',
  };
  return statusMap[status] || status;
};

// Función helper para obtener el icono del status
export const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    pending: 'clock',
    processing: 'refresh',
    completed: 'check',
    failed: 'x',
  };
  return iconMap[status] || 'clock';
};

// Función para calcular estadísticas
export const calculateStats = (imports: ImportRecord[]): ImportStats => {
  const successfulImports = imports.filter((i) => i.status === 'completed').length;
  const failedImports = imports.filter((i) => i.status === 'failed').length;
  const totalRecordsProcessed = imports.reduce((sum, i) => sum + i.totalRecords, 0);
  const totalSuccessfulRecords = imports.reduce((sum, i) => sum + i.successfulRecords, 0);

  const entityCounts = imports.reduce(
    (acc, i) => {
      acc[i.entityType] = (acc[i.entityType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalImports: imports.length,
    successfulImports,
    failedImports,
    averageSuccessRate:
      totalRecordsProcessed > 0
        ? Math.round((totalSuccessfulRecords / totalRecordsProcessed) * 100)
        : 0,
    totalRecordsProcessed,
    entityCounts,
  };
};

// Función para filtrar por término de búsqueda
const matchesSearchTerm = (imp: ImportRecord, searchTerm: string): boolean => {
  if (searchTerm === '') return true;
  const lowerTerm = searchTerm.toLowerCase();
  return (
    imp.fileName.toLowerCase().includes(lowerTerm) ||
    imp.entityType.toLowerCase().includes(lowerTerm)
  );
};

// Función para filtrar por rango de fechas
const matchesDateRange = (imp: ImportRecord, dateRange: [Date | null, Date | null]): boolean => {
  return (
    !dateRange[0] ||
    !dateRange[1] ||
    (imp.timestamp >= dateRange[0] && imp.timestamp <= dateRange[1])
  );
};

// Función para filtrar imports
const filterImports = (
  imports: ImportRecord[],
  filters: {
    searchTerm: string;
    filterEntity: string;
    filterStatus: string;
    dateRange: [Date | null, Date | null];
  }
): ImportRecord[] => {
  return imports.filter((imp) => {
    const matchesSearch = matchesSearchTerm(imp, filters.searchTerm);
    const matchesEntity = filters.filterEntity === 'all' || imp.entityType === filters.filterEntity;
    const matchesStatus = filters.filterStatus === 'all' || imp.status === filters.filterStatus;
    const matchesDate = matchesDateRange(imp, filters.dateRange);

    return matchesSearch && matchesEntity && matchesStatus && matchesDate;
  });
};

// Función para ordenar imports
const sortImports = (
  imports: ImportRecord[],
  sortField: keyof ImportRecord,
  sortDirection: 'asc' | 'desc'
): ImportRecord[] => {
  return [...imports].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue != null && bValue != null) {
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

interface FilterAndSortOptions {
  searchTerm: string;
  filterEntity: string;
  filterStatus: string;
  dateRange: [Date | null, Date | null];
  sortField: keyof ImportRecord;
  sortDirection: 'asc' | 'desc';
}

// Función para filtrar y ordenar imports
export const filterAndSortImports = (
  imports: ImportRecord[],
  options: FilterAndSortOptions
): ImportRecord[] => {
  const filtered = filterImports(imports, {
    searchTerm: options.searchTerm,
    filterEntity: options.filterEntity,
    filterStatus: options.filterStatus,
    dateRange: options.dateRange,
  });
  return sortImports(filtered, options.sortField, options.sortDirection);
};
