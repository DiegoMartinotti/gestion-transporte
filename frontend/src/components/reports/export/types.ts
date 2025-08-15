import type { ExportFormat } from '../../../types/reports';

export type PageOrientation = 'portrait' | 'landscape';
export type PaperSize = 'a4' | 'letter' | 'legal';
export type ChartSize = 'small' | 'medium' | 'large';
export type TableStyle = 'simple' | 'striped' | 'bordered';

export interface ExportMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ExportColors {
  primary: string;
  secondary: string;
  text: string;
  background: string;
}

export interface ExportState {
  format: ExportFormat;
  fileName: string;
  title: string;
  includeCharts: boolean;
  includeTable: boolean;
  includeMetadata: boolean;
  pageOrientation: PageOrientation;
  paperSize: PaperSize;
  chartSize: ChartSize;
  tableStyle: TableStyle;
  fontSize: number;
  margins: ExportMargins;
  colors: ExportColors;
  watermark?: string;
  logo?: string;
  isExporting: boolean;
  progress: number;
}

export interface FormatOption {
  value: ExportFormat;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  description: string;
}

export interface ChartSizeOption {
  value: ChartSize;
  label: string;
  width: number;
  height: number;
}

export interface TableStyleOption {
  value: TableStyle;
  label: string;
}
