import React from 'react';
import { Stack, Center } from '@mantine/core';
import { TableControls, ReportTable, TablePagination } from './ReportViewerComponents';
import { ChartView, ChartSelector } from './ReportCharts';
import type { ReportData, ReportDefinition, TableState } from '../../types/reports';

interface TableViewProps {
  tableState: TableState;
  processedTableData: {
    rows: (string | number)[][];
    totalPages: number;
    visibleRows: (string | number)[][];
  };
  data: ReportData;
  onSearch: (term: string) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const TableView: React.FC<TableViewProps> = ({
  tableState,
  processedTableData,
  data,
  onSearch,
  onPageSizeChange,
  onSort,
  onPageChange,
  onRefresh,
  loading,
}) => (
  <Stack gap="md">
    <TableControls
      tableState={tableState}
      onSearch={onSearch}
      onPageSizeChange={onPageSizeChange}
      totalRows={processedTableData.rows.length}
      onRefresh={onRefresh}
      loading={loading}
    />

    <ReportTable
      data={data}
      visibleRows={processedTableData.visibleRows}
      tableState={tableState}
      onSort={onSort}
    />

    <TablePagination
      currentPage={tableState.page}
      totalPages={processedTableData.totalPages}
      onPageChange={onPageChange}
    />
  </Stack>
);

interface ChartViewContainerProps {
  reportDefinition: ReportDefinition;
  chartData: Record<string, string | number>[];
  selectedChart: number;
  onChartChange: (index: number) => void;
}

export const ChartViewContainer: React.FC<ChartViewContainerProps> = ({
  reportDefinition,
  chartData,
  selectedChart,
  onChartChange,
}) => {
  if (!reportDefinition.charts?.length) {
    return (
      <Center py="xl">
        <div>No hay gráficos configurados para este reporte</div>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {reportDefinition.charts.length > 1 && (
        <ChartSelector
          charts={reportDefinition.charts}
          selectedChart={selectedChart}
          onChartChange={onChartChange}
        />
      )}

      <ChartView
        chartConfigs={reportDefinition.charts}
        data={chartData}
        selectedChart={selectedChart}
      />
    </Stack>
  );
};
