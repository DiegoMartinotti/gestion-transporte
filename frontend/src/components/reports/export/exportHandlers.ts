import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReportData, ReportDefinition } from '../../../types/reports';
import type { ExportState } from './types';

export const createPdfExporter = () => {
  return async (
    exportState: ExportState,
    reportData: ReportData,
    reportDefinition: ReportDefinition
  ): Promise<Blob> => {
    const pdf = new jsPDF({
      orientation: exportState.pageOrientation,
      unit: 'mm',
      format: exportState.paperSize,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = exportState.margins.left;
    const contentWidth = pageWidth - margin * 2;

    let yPosition = exportState.margins.top;

    // Título del reporte
    pdf.setFontSize(20);
    pdf.setTextColor(exportState.colors.primary);
    pdf.text(exportState.title, margin, yPosition);
    yPosition += 15;

    // Metadata
    if (exportState.includeMetadata) {
      yPosition = addMetadataToPage({ pdf, yPosition, margin, exportState, reportData });
    }

    // Descripción
    if (reportDefinition.description) {
      yPosition = addDescriptionToPage({
        pdf,
        yPosition,
        margin,
        contentWidth,
        exportState,
        reportDefinition,
      });
    }

    // Tabla de datos
    if (exportState.includeTable && reportData.rows.length > 0) {
      yPosition = addTableToPage({
        pdf,
        yPosition,
        margin,
        contentWidth,
        pageHeight,
        exportState,
        reportData,
      });
    }

    // Watermark
    if (exportState.watermark) {
      addWatermark(pdf, pageWidth, pageHeight, exportState.watermark);
    }

    return pdf.output('blob');
  };
};

interface MetadataPageConfig {
  pdf: jsPDF;
  yPosition: number;
  margin: number;
  exportState: ExportState;
  reportData: ReportData;
}

const addMetadataToPage = (config: MetadataPageConfig): number => {
  const { pdf, yPosition, margin, exportState, reportData } = config;
  pdf.setFontSize(10);
  pdf.setTextColor(exportState.colors.secondary);
  pdf.text(
    `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    margin,
    yPosition
  );
  yPosition += 5;
  pdf.text(`Total de registros: ${reportData.totalRows}`, margin, yPosition);
  yPosition += 5;

  if (reportData.metadata?.executionTime) {
    pdf.text(`Tiempo de ejecución: ${reportData.metadata.executionTime}ms`, margin, yPosition);
    yPosition += 5;
  }

  return yPosition + 10;
};

interface DescriptionPageConfig {
  pdf: jsPDF;
  yPosition: number;
  margin: number;
  contentWidth: number;
  exportState: ExportState;
  reportDefinition: ReportDefinition;
}

const addDescriptionToPage = (config: DescriptionPageConfig): number => {
  const { pdf, yPosition, margin, contentWidth, exportState, reportDefinition } = config;
  pdf.setFontSize(exportState.fontSize);
  pdf.setTextColor(exportState.colors.text);
  const descriptionLines = pdf.splitTextToSize(reportDefinition.description || '', contentWidth);
  pdf.text(descriptionLines, margin, yPosition);
  return yPosition + descriptionLines.length * 5 + 10;
};

interface TablePageConfig {
  pdf: jsPDF;
  yPosition: number;
  margin: number;
  contentWidth: number;
  pageHeight: number;
  exportState: ExportState;
  reportData: ReportData;
}

const addTableToPage = (config: TablePageConfig): number => {
  const { pdf, yPosition, margin, contentWidth, pageHeight, exportState, reportData } = config;
  pdf.setFontSize(14);
  pdf.setTextColor(exportState.colors.primary);
  pdf.text('Datos', margin, yPosition);
  yPosition += 10;

  // Headers
  pdf.setFontSize(10);
  pdf.setTextColor(exportState.colors.text);
  const colWidth = contentWidth / reportData.headers.length;

  // Draw headers with background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');

  reportData.headers.forEach((header, index) => {
    pdf.text(header, margin + index * colWidth + 2, yPosition);
  });
  yPosition += 10;

  // Data rows (limited to first 50 for PDF)
  const maxRows = Math.min(reportData.rows.length, 50);

  for (let i = 0; i < maxRows; i++) {
    const row = reportData.rows[i];

    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = exportState.margins.top;
    }

    // Alternate row colors
    if (exportState.tableStyle === 'striped' && i % 2 === 0) {
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, yPosition - 3, contentWidth, 6, 'F');
    }

    row.forEach((cell, index) => {
      const cellText = String(cell || '');
      const truncatedText = cellText.length > 20 ? cellText.substring(0, 20) + '...' : cellText;
      pdf.text(truncatedText, margin + index * colWidth + 2, yPosition);
    });

    yPosition += 6;
  }

  if (reportData.rows.length > maxRows) {
    yPosition += 5;
    pdf.setFontSize(8);
    pdf.setTextColor(exportState.colors.secondary);
    pdf.text(
      `Nota: Mostrando solo los primeros ${maxRows} registros de ${reportData.totalRows} totales.`,
      margin,
      yPosition
    );
  }

  return yPosition;
};

const addWatermark = (
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  watermark: string
): void => {
  pdf.setFontSize(48);
  pdf.setTextColor(200, 200, 200);
  pdf.text(watermark, pageWidth / 2, pageHeight / 2, {
    angle: 45,
    align: 'center',
  });
};

export const createExcelExporter = () => {
  return async (
    exportState: ExportState,
    reportData: ReportData,
    reportDefinition: ReportDefinition
  ): Promise<Blob> => {
    const workbook = XLSX.utils.book_new();

    // Hoja de datos
    if (exportState.includeTable) {
      addDataSheet(workbook, reportData);
    }

    // Hoja de metadatos
    if (exportState.includeMetadata) {
      addMetadataSheet(workbook, exportState, reportDefinition, reportData);
    }

    // Hoja de configuración de gráficos
    if (exportState.includeCharts && reportDefinition.charts?.length) {
      addChartsSheet(workbook, reportDefinition);
    }

    return new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  };
};

const addDataSheet = (workbook: XLSX.WorkBook, reportData: ReportData): void => {
  const wsData = [reportData.headers, ...reportData.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Aplicar estilos básicos
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Headers en negrita
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'F0F0F0' } },
    };
  }

  // Auto-ajustar anchos de columna
  const colWidths = reportData.headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...reportData.rows.slice(0, 100).map((row) => String(row[index] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
};

const addMetadataSheet = (
  workbook: XLSX.WorkBook,
  exportState: ExportState,
  reportDefinition: ReportDefinition,
  reportData: ReportData
): void => {
  const metadataData = [
    ['Reporte', exportState.title],
    ['Descripción', reportDefinition.description || ''],
    ['Tipo', reportDefinition.type],
    ['Generado', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
    ['Total registros', reportData.totalRows],
    ['Tiempo ejecución (ms)', reportData.metadata?.executionTime || ''],
    ['Filtros aplicados', reportData.metadata?.filters?.length || 0],
  ];

  const metadataWs = XLSX.utils.aoa_to_sheet(metadataData);
  metadataWs['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, metadataWs, 'Información');
};

const addChartsSheet = (workbook: XLSX.WorkBook, reportDefinition: ReportDefinition): void => {
  const chartsData = [['Título', 'Tipo', 'Eje X', 'Eje Y', 'Altura']];

  (reportDefinition.charts || []).forEach((chart) => {
    chartsData.push([
      chart.title,
      chart.type,
      chart.xAxis,
      chart.yAxis.join(', '),
      String(chart.height || 300),
    ]);
  });

  const chartsWs = XLSX.utils.aoa_to_sheet(chartsData);
  chartsWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, chartsWs, 'Gráficos');
};

export const createCsvExporter = () => {
  return async (reportData: ReportData): Promise<Blob> => {
    const csvContent = [
      reportData.headers.join(','),
      ...reportData.rows.map((row) =>
        row
          .map((cell) => {
            const stringCell = String(cell || '');
            // Escape commas and quotes
            if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
              return `"${stringCell.replace(/"/g, '""')}"`;
            }
            return stringCell;
          })
          .join(',')
      ),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };
};
