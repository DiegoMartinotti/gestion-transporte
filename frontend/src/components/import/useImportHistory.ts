// Hook custom para ImportHistory
import { useState, useMemo, useCallback } from 'react';
import { ImportRecord, ImportStats } from './ImportHistoryTypes';
import { calculateStats, filterAndSortImports } from './ImportHistoryHelpers';

// Mock data - en una implementación real vendría de una API
const MOCK_IMPORTS: ImportRecord[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // Hace 30 minutos
    entityType: 'clientes',
    fileName: 'clientes_julio_2024.xlsx',
    totalRecords: 1500,
    successfulRecords: 1485,
    failedRecords: 10,
    status: 'completed',
    startTime: new Date(Date.now() - 1000 * 60 * 30 - 45000),
    endTime: new Date(Date.now() - 1000 * 60 * 30),
    fileSize: 2456789,
    errors: [
      {
        row: 15,
        field: 'email',
        message: 'Formato de email inválido',
      },
      {
        row: 87,
        field: 'telefono',
        message: 'Número de teléfono requerido',
      },
    ],
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Hace 2 horas
    entityType: 'vehiculos',
    fileName: 'flota_vehiculos.xlsx',
    totalRecords: 250,
    successfulRecords: 250,
    failedRecords: 0,
    status: 'completed',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2 - 15000),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    fileSize: 1234567,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Hace 1 día
    entityType: 'personal',
    fileName: 'empleados_nuevos.xlsx',
    totalRecords: 75,
    successfulRecords: 0,
    failedRecords: 75,
    status: 'failed',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 - 8000),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    fileSize: 567890,
    errors: [
      { row: 1, field: 'dni', message: 'DNI duplicado' },
      { row: 2, field: 'email', message: 'Email inválido' },
    ],
  },
];

interface UseImportHistoryOptions {
  initialData?: ImportRecord[];
}

export const useImportHistory = (options: UseImportHistoryOptions = {}) => {
  const [imports] = useState<ImportRecord[]>(options.initialData || MOCK_IMPORTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortField, setSortField] = useState<keyof ImportRecord>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calcular estadísticas
  const stats: ImportStats = useMemo(() => calculateStats(imports), [imports]);

  // Filtrar y ordenar imports
  const sortedImports = useMemo(
    () =>
      filterAndSortImports(imports, {
        searchTerm,
        filterEntity,
        filterStatus,
        dateRange,
        sortField,
        sortDirection,
      }),
    [imports, searchTerm, filterEntity, filterStatus, dateRange, sortField, sortDirection]
  );

  // Handlers
  const handleSort = useCallback(
    (field: keyof ImportRecord) => {
      if (field === sortField) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  const handleViewDetails = useCallback((importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedImport(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterEntity('all');
    setFilterStatus('all');
    setDateRange([null, null]);
  }, []);

  return {
    // Data
    imports,
    stats,
    sortedImports,

    // Filters
    searchTerm,
    filterEntity,
    filterStatus,
    dateRange,
    sortField,
    sortDirection,

    // Modal state
    selectedImport,
    showDetailsModal,

    // Setters
    setSearchTerm,
    setFilterEntity,
    setFilterStatus,
    setDateRange,

    // Handlers
    handleSort,
    handleViewDetails,
    handleCloseDetails,
    handleClearFilters,
  };
};
