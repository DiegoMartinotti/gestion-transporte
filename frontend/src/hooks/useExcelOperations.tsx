import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

interface ExcelOperationsConfig {
  entityType: string;
  entityName: string;
  exportFunction: (filters?: any) => Promise<Blob>;
  templateFunction: () => Promise<Blob>;
  reloadFunction: () => void;
}

interface ExcelOperationsResult {
  isExporting: boolean;
  isGettingTemplate: boolean;
  handleExport: (filters?: any) => Promise<void>;
  handleGetTemplate: () => Promise<void>;
  handleImportComplete: (result: any) => void;
}

export const useExcelOperations = (config: ExcelOperationsConfig): ExcelOperationsResult => {
  const [isExporting, setIsExporting] = useState(false);
  const [isGettingTemplate, setIsGettingTemplate] = useState(false);

  const handleExport = useCallback(async (filters?: any) => {
    setIsExporting(true);
    try {
      const blob = await config.exportFunction(filters);
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.entityType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Exportación exitosa',
        message: `Se ha exportado la lista de ${config.entityName} correctamente`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      console.error(`Error al exportar ${config.entityType}:`, error);
      notifications.show({
        title: 'Error en la exportación',
        message: `No se pudo exportar la lista de ${config.entityName}`,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsExporting(false);
    }
  }, [config]);

  const handleGetTemplate = useCallback(async () => {
    setIsGettingTemplate(true);
    try {
      const blob = await config.templateFunction();
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plantilla_${config.entityType}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Plantilla descargada',
        message: `Se ha descargado la plantilla de ${config.entityName} correctamente`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      console.error(`Error al obtener plantilla de ${config.entityType}:`, error);
      notifications.show({
        title: 'Error al descargar plantilla',
        message: `No se pudo descargar la plantilla de ${config.entityName}`,
        color: 'red',
        icon: <IconX size={16} />,
      });
    } finally {
      setIsGettingTemplate(false);
    }
  }, [config]);

  const handleImportComplete = useCallback((result: any) => {
    if (result.success) {
      notifications.show({
        title: 'Importación exitosa',
        message: `Se han importado ${result.imported || 0} ${config.entityName} correctamente`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      config.reloadFunction();
    } else {
      notifications.show({
        title: 'Error en la importación',
        message: result.message || `No se pudieron importar los ${config.entityName}`,
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  }, [config]);

  return {
    isExporting,
    isGettingTemplate,
    handleExport,
    handleGetTemplate,
    handleImportComplete,
  };
};