import { useState, useMemo } from 'react';
import type { ReportData } from '../../../types/reports';

export const useReportViewerCharts = (data: ReportData | null) => {
  const [selectedChart, setSelectedChart] = useState<number>(0);

  // Procesar datos para gráficos
  const processedChartData = useMemo(() => {
    if (!data || !data.rows.length) return [];

    return data.rows.map((row, index) => {
      const item: Record<string, string | number> = { _index: index };
      data.headers.forEach((header, headerIndex) => {
        const value = row[headerIndex];
        // Intentar convertir a número si es posible
        const numericValue = Number(value);
        item[header] = !isNaN(numericValue) && value !== '' ? numericValue : String(value);
      });
      return item;
    });
  }, [data]);

  return {
    selectedChart,
    setSelectedChart,
    processedChartData,
  };
};
