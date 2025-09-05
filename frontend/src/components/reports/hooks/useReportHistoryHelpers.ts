import { notifications } from '@mantine/notifications';
import { reportService } from '../../../services/reportService';

export const ReportHistoryHelpers = {
  async loadExecutions(historyState: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    filters: Record<string, string | undefined>;
  }) {
    try {
      const data = await reportService.getReportExecutions({
        page: historyState.page,
        pageSize: historyState.pageSize,
        sortBy: historyState.sortBy,
        sortDirection: historyState.sortDirection,
        ...historyState.filters,
      });
      return data || [];
    } catch (error) {
      console.error('Error loading report executions:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los reportes ejecutados',
        color: 'red',
      });
      return [];
    }
  },

  async deleteExecution(id: string) {
    try {
      await reportService.deleteReportExecutions([id]);
      notifications.show({
        title: 'Éxito',
        message: 'Ejecución eliminada correctamente',
        color: 'green',
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar la ejecución',
        color: 'red',
      });
      return false;
    }
  },

  async deleteMultipleExecutions(selectedExecutions: Set<string>) {
    try {
      await Promise.all([reportService.deleteReportExecutions(Array.from(selectedExecutions))]);
      notifications.show({
        title: 'Éxito',
        message: `${selectedExecutions.size} ejecuciones eliminadas correctamente`,
        color: 'green',
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron eliminar las ejecuciones seleccionadas',
        color: 'red',
      });
      return false;
    }
  },
};
