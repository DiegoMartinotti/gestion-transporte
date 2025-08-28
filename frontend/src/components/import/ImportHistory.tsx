import React, { useState, useMemo, useCallback } from 'react';
import { Stack, Container } from '@mantine/core';
import { ImportRecord, ImportStats, ImportHistoryProps } from './ImportHistoryTypes';
import { ImportHistoryStats, ImportHistoryFilters } from './ImportHistoryComponents';
import { ImportHistoryTable } from './ImportHistoryTable';
import { ImportDetailsModal } from './ImportHistoryDetailsModal';

// Mock data - normalmente vendría de una API
const MOCK_IMPORTS: ImportRecord[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T10:30:00'),
    entityType: 'clientes',
    fileName: 'clientes_enero_2024.xlsx',
    status: 'completed',
    totalRecords: 150,
    successfulRecords: 145,
    failedRecords: 5,
    user: 'juan.perez@empresa.com',
    startTime: new Date('2024-01-15T10:30:00'),
    endTime: new Date('2024-01-15T10:32:15'),
    fileSize: 245760,
    errors: [
      { row: 23, field: 'email', message: 'Email inválido' },
      { row: 45, field: 'telefono', message: 'Formato de teléfono incorrecto' },
      { row: 67, field: 'direccion', message: 'Dirección requerida' },
      { row: 89, field: 'email', message: 'Email duplicado' },
      { row: 123, field: 'nombre', message: 'Nombre requerido' },
    ],
  },
];

// Hook personalizado para lógica de filtrado y ordenación
const useImportFiltering = (imports: ImportRecord[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [sortField, setSortField] = useState<keyof ImportRecord>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Funciones auxiliares para filtrado
  const matchesSearchTerm = useCallback(
    (imp: ImportRecord) =>
      searchTerm === '' ||
      imp.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      imp.user.toLowerCase().includes(searchTerm.toLowerCase()),
    [searchTerm]
  );

  const matchesEntityFilter = useCallback(
    (imp: ImportRecord) => filterEntity === 'all' || imp.entityType === filterEntity,
    [filterEntity]
  );

  const matchesStatusFilter = useCallback(
    (imp: ImportRecord) => filterStatus === 'all' || imp.status === filterStatus,
    [filterStatus]
  );

  const matchesDateRange = useCallback(
    (imp: ImportRecord) =>
      !dateRange[0] ||
      !dateRange[1] ||
      (imp.timestamp >= dateRange[0] && imp.timestamp <= dateRange[1]),
    [dateRange]
  );

  // Filtrar y ordenar importaciones
  const filteredAndSortedImports = useMemo(() => {
    const filtered = imports.filter(
      (imp) =>
        matchesSearchTerm(imp) &&
        matchesEntityFilter(imp) &&
        matchesStatusFilter(imp) &&
        matchesDateRange(imp)
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [
    imports,
    matchesSearchTerm,
    matchesEntityFilter,
    matchesStatusFilter,
    matchesDateRange,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: keyof ImportRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEntity('all');
    setFilterStatus('all');
    setDateRange([null, null]);
  };

  return {
    searchTerm,
    setSearchTerm,
    filterEntity,
    setFilterEntity,
    filterStatus,
    setFilterStatus,
    dateRange,
    setDateRange,
    sortField,
    sortDirection,
    filteredAndSortedImports,
    handleSort,
    clearFilters,
  };
};

// Hook para estadísticas de importaciones
const useImportStats = (imports: ImportRecord[]): ImportStats => {
  return useMemo(() => {
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

    const mostImportedEntity =
      Object.entries(entityCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
      totalImports: imports.length,
      successfulImports,
      failedImports,
      totalRecordsProcessed,
      averageSuccessRate:
        totalRecordsProcessed > 0 ? (totalSuccessfulRecords / totalRecordsProcessed) * 100 : 0,
      mostImportedEntity,
      lastImportDate: imports.length > 0 ? imports[0].timestamp : null,
    };
  }, [imports]);
};

// Hook para manejo del modal de detalles
const useDetailsModal = () => {
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedImport(null);
  };

  return {
    selectedImport,
    showDetailsModal,
    handleViewDetails,
    handleCloseModal,
  };
};

export const ImportHistory: React.FC<ImportHistoryProps> = ({
  onRetryImport,
  onViewDetails: _onViewDetails,
  onExportReport,
}) => {
  const [imports] = useState<ImportRecord[]>(MOCK_IMPORTS);
  const stats = useImportStats(imports);

  const {
    searchTerm,
    setSearchTerm,
    filterEntity,
    setFilterEntity,
    filterStatus,
    setFilterStatus,
    dateRange,
    setDateRange,
    sortField,
    sortDirection,
    filteredAndSortedImports,
    handleSort,
    clearFilters,
  } = useImportFiltering(imports);

  const { selectedImport, showDetailsModal, handleViewDetails, handleCloseModal } =
    useDetailsModal();

  const handleExportAll = () => {
    console.log('Exportando todas las importaciones...');
  };

  const handleDeleteImport = (importId: string) => {
    console.log('Eliminando importación:', importId);
  };

  return (
    <Container size="xl" py="md">
      <Stack spacing="md">
        <ImportHistoryStats stats={stats} />

        <ImportHistoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterEntity={filterEntity}
          setFilterEntity={setFilterEntity}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onClearFilters={clearFilters}
          onExportAll={handleExportAll}
        />

        <ImportHistoryTable
          imports={filteredAndSortedImports}
          onViewDetails={handleViewDetails}
          onRetryImport={onRetryImport}
          onExportReport={onExportReport}
          onDeleteImport={handleDeleteImport}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        <ImportDetailsModal
          import={selectedImport}
          opened={showDetailsModal}
          onClose={handleCloseModal}
          onRetryImport={onRetryImport}
          onExportReport={onExportReport}
        />
      </Stack>
    </Container>
  );
};
