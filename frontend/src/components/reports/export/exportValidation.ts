import type { ExportState } from './types';

export const validateExportConfig = (exportState: ExportState): string | null => {
  if (!exportState.fileName.trim()) {
    return 'Debe especificar un nombre de archivo';
  }

  if (!exportState.includeCharts && !exportState.includeTable) {
    return 'Debe incluir al menos gráficos o tabla';
  }

  if (exportState.format === 'image' && !exportState.includeCharts) {
    return 'La exportación a imagen requiere incluir gráficos';
  }

  return null;
};
