import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { ViajeService } from '../services/viajeService';
import type {
  ImportResult,
  ExcelImportState,
} from '../components/modals/types/ExcelImportModalTypes';

interface UseExcelCorrectionOperationsConfig {
  state: ExcelImportState;
  setLoading: (loading: boolean) => void;
  setCorrectionUploadModalOpen: (open: boolean) => void;
  setImportResult: (result: ImportResult | null) => void;
}

export function useExcelCorrectionOperations(config: UseExcelCorrectionOperationsConfig) {
  const { state, setLoading, setCorrectionUploadModalOpen, setImportResult } = config;

  const handleDownloadMissingDataTemplates = useCallback(async () => {
    if (!state.importResult?.importId) {
      console.error('No hay importId disponible:', state.importResult);
      return;
    }

    try {
      setLoading(true);
      console.log('Descargando plantillas para importId:', state.importResult.importId);

      const blob = await ViajeService.downloadMissingDataTemplates(state.importResult.importId);

      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `datos_faltantes_${state.importResult.importId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Plantillas descargadas',
        message: 'Se han descargado las plantillas con los datos faltantes',
        color: 'green',
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error descargando plantillas:', error);
      notifications.show({
        title: 'Error',
        message: `No se pudieron descargar las plantillas de corrección: ${error.message}`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [state.importResult, setLoading]);

  // Helper function to update import result with correction data
  const updateResultWithCorrections = useCallback(
    (result: Record<string, unknown>) => {
      const currentResult = state.importResult;
      if (!currentResult) return null;

      return {
        ...currentResult,
        summary: {
          totalRows: currentResult.summary?.totalRows || 0,
          insertedRows:
            (currentResult.summary?.insertedRows || 0) + ((result.successCount as number) || 0),
          errorRows: Math.max(
            0,
            (currentResult.summary?.errorRows || 0) - ((result.successCount as number) || 0)
          ),
        },
        hasMissingData: ((result.failCount as number) || 0) > 0,
      };
    },
    [state.importResult]
  );

  const handleCorrectionUploadSuccess = useCallback(
    (reintentoResult?: unknown, onImportCompleteCallback?: (result: ImportResult) => void) => {
      setCorrectionUploadModalOpen(false);

      if (reintentoResult && typeof reintentoResult === 'object' && reintentoResult !== null) {
        const result = reintentoResult as Record<string, unknown>;
        if (result.success) {
          const updatedResult = updateResultWithCorrections(result);
          if (!updatedResult) return;

          setImportResult(updatedResult);

          notifications.show({
            title: 'Datos importados y viajes reintentados',
            message: `Se importaron los datos de corrección y se procesaron ${(result.successCount as number) || 0} viajes adicionales exitosamente.`,
            color: 'green',
          });

          // Notificar al componente padre del éxito
          if (onImportCompleteCallback) {
            onImportCompleteCallback(updatedResult);
          }
          return;
        }
      }

      notifications.show({
        title: 'Datos importados correctamente',
        message:
          'Los datos de corrección han sido importados. Ahora puedes reintentar la importación completa para procesar todos los viajes.',
        color: 'green',
      });
    },
    [setCorrectionUploadModalOpen, setImportResult, updateResultWithCorrections]
  );

  return {
    handleDownloadMissingDataTemplates,
    handleCorrectionUploadSuccess,
  };
}
