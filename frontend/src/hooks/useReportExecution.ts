import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { ReportDefinition, ReportData, ExportConfig } from '../types/reports';
import { reportService } from '../services/reportService';

export const useReportExecution = () => {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleExecuteReport = async (definition: ReportDefinition, onSuccess?: () => void) => {
    try {
      setReportLoading(true);
      setSelectedReport(definition);

      const data = await reportService.executeReport(definition.id);
      setReportData(data);

      notifications.show({
        title: 'Reporte generado',
        message: `Reporte "${definition.name}" ejecutado correctamente`,
        color: 'green',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo ejecutar el reporte',
        color: 'red',
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleEditReport = (definition: ReportDefinition, onEdit?: () => void) => {
    setSelectedReport(definition);
    if (onEdit) {
      onEdit();
    }
  };

  const handleExport = async (config: ExportConfig) => {
    if (!selectedReport || !reportData) return;

    try {
      const blob = await reportService.exportReportData(reportData, config);
      const fileName =
        config.fileName || reportService.generateFileName(selectedReport.name, config.format);
      reportService.downloadBlob(blob, fileName);

      notifications.show({
        title: 'Exportación exitosa',
        message: `Archivo descargado: ${fileName}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error de exportación',
        message: 'No se pudo exportar el reporte',
        color: 'red',
      });
    }
  };

  const clearSelectedReport = () => {
    setSelectedReport(null);
    setReportData(null);
  };

  return {
    selectedReport,
    reportData,
    reportLoading,
    handleExecuteReport,
    handleEditReport,
    handleExport,
    setSelectedReport,
    clearSelectedReport,
  };
};
