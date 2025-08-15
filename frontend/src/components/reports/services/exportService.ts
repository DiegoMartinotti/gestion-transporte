import { notifications } from '@mantine/notifications';
import { PartidaReportData } from '../types';

const simulateExport = async (formato: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      notifications.show({
        title: 'Exportación Exitosa',
        message: `Reporte exportado en formato ${formato.toUpperCase()}`,
        color: 'green',
      });
      resolve();
    }, 2000);
  });
};

export const exportService = {
  exportReport: async (
    formato: 'excel' | 'pdf',
    partidas: PartidaReportData[],
    setLoading: (loading: boolean) => void
  ): Promise<void> => {
    setLoading(true);
    try {
      await simulateExport(formato);
    } finally {
      setLoading(false);
    }
  },
};
