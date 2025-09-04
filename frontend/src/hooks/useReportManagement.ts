import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { ReportDefinition } from '../types/reports';
import { reportService } from '../services/reportService';

export const useReportManagement = () => {
  const [reportDefinitions, setReportDefinitions] = useState<ReportDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReportDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      const definitions = await reportService.getReportDefinitions();
      setReportDefinitions(definitions);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las definiciones de reportes',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteReport = async (definition: ReportDefinition) => {
    try {
      await reportService.deleteReportDefinition(definition.id);
      await loadReportDefinitions();

      notifications.show({
        title: 'Eliminado',
        message: `Reporte "${definition.name}" eliminado correctamente`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el reporte',
        color: 'red',
      });
    }
  };

  const handleReportSaved = (report: ReportDefinition) => {
    loadReportDefinitions();

    notifications.show({
      title: 'Guardado',
      message: `Reporte "${report.name}" guardado correctamente`,
      color: 'green',
    });
  };

  return {
    reportDefinitions,
    loading,
    loadReportDefinitions,
    handleDeleteReport,
    handleReportSaved,
  };
};
