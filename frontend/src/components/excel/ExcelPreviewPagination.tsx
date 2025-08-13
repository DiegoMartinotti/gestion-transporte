import React from 'react';
import { Group, Pagination, Text } from '@mantine/core';
import { PreviewData } from './ExcelDataPreview';

interface ExcelPreviewPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  filteredAndSortedData: PreviewData[];
  pageSize: number;
}

export const ExcelPreviewPagination: React.FC<ExcelPreviewPaginationProps> = ({
  currentPage,
  setCurrentPage,
  totalPages,
  filteredAndSortedData,
  pageSize,
}) => {
  if (totalPages <= 1) return null;

  const startIndex = Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedData.length);
  const endIndex = Math.min(currentPage * pageSize, filteredAndSortedData.length);
  const totalRecords = filteredAndSortedData.length;

  return (
    <Group justify="center">
      <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} size="sm" />
      <Text size="sm" c="dimmed">
        Mostrando {startIndex} - {endIndex} de {totalRecords} registros
      </Text>
    </Group>
  );
};

export default ExcelPreviewPagination;
