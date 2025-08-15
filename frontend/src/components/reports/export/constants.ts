import { IconFileTypePdf, IconFileTypeXls, IconFileTypeCsv, IconPhoto } from '@tabler/icons-react';
import type { FormatOption, ChartSizeOption, TableStyleOption } from './types';

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'pdf',
    label: 'PDF Document',
    icon: IconFileTypePdf,
    color: 'red',
    description: 'Documento portable con formato preservado',
  },
  {
    value: 'excel',
    label: 'Excel Spreadsheet',
    icon: IconFileTypeXls,
    color: 'green',
    description: 'Hoja de cálculo editable con múltiples pestañas',
  },
  {
    value: 'csv',
    label: 'CSV Data',
    icon: IconFileTypeCsv,
    color: 'blue',
    description: 'Datos separados por comas, compatible universalmente',
  },
  {
    value: 'image',
    label: 'Image (PNG)',
    icon: IconPhoto,
    color: 'orange',
    description: 'Imagen estática de alta resolución',
  },
];

export const CHART_SIZE_OPTIONS: ChartSizeOption[] = [
  { value: 'small', label: 'Pequeño (400x300)', width: 400, height: 300 },
  { value: 'medium', label: 'Mediano (800x600)', width: 800, height: 600 },
  { value: 'large', label: 'Grande (1200x900)', width: 1200, height: 900 },
];

export const TABLE_STYLE_OPTIONS: TableStyleOption[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'striped', label: 'Rayado' },
  { value: 'bordered', label: 'Con bordes' },
];

export const DEFAULT_EXPORT_STATE = {
  format: 'pdf' as const,
  title: '',
  includeCharts: true,
  includeTable: true,
  includeMetadata: true,
  pageOrientation: 'portrait' as const,
  paperSize: 'a4' as const,
  chartSize: 'medium' as const,
  tableStyle: 'striped' as const,
  fontSize: 12,
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  colors: {
    primary: '#228be6',
    secondary: '#868e96',
    text: '#212529',
    background: '#ffffff',
  },
  isExporting: false,
  progress: 0,
} as const;
