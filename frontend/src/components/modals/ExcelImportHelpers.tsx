import { notifications } from '@mantine/notifications';
import { ViajeService } from '../../services/viajeService';

export interface ImportNotificationOptions {
  insertedRows: number;
  errorRows: number;
  hasMissingData: boolean;
}

export const showImportNotification = (options: ImportNotificationOptions) => {
  const { insertedRows, errorRows, hasMissingData } = options;

  if (hasMissingData && errorRows > 0) {
    notifications.show({
      title: 'Importación parcial',
      message: `Se importaron ${insertedRows} registros. ${errorRows} registros requieren datos adicionales.`,
      color: 'orange',
    });
  } else {
    notifications.show({
      title: 'Importación completada',
      message: `Se importaron ${insertedRows} registros correctamente`,
      color: 'green',
    });
  }
};

export const downloadMissingDataTemplates = async (
  importId: string,
  loading: {
    setLoading: (value: boolean) => void;
  }
) => {
  if (!importId) {
    console.error('No hay importId disponible');
    return;
  }

  try {
    loading.setLoading(true);
    console.log('Descargando plantillas para importId:', importId);

    const blob = await ViajeService.downloadMissingDataTemplates(importId);

    // Crear URL para descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datos_faltantes_${importId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: 'Plantillas descargadas',
      message: 'Se han descargado las plantillas con los datos faltantes',
      color: 'green',
    });
  } catch (err: unknown) {
    console.error('Error descargando plantillas:', err);
    console.error('Error response:', err.response);
    notifications.show({
      title: 'Error',
      message: `No se pudieron descargar las plantillas de corrección: ${err.message}`,
      color: 'red',
    });
  } finally {
    loading.setLoading(false);
  }
};

export const processImportResult = (
  importResult: Record<string, unknown>,
  reintentoResult: Record<string, unknown>
) => {
  return {
    ...importResult,
    summary: {
      ...importResult.summary,
      insertedRows: (importResult.summary?.insertedRows || 0) + (reintentoResult.successCount || 0),
      errorRows: Math.max(
        0,
        (importResult.summary?.errorRows || 0) - (reintentoResult.successCount || 0)
      ),
    },
    hasMissingData: reintentoResult.failCount > 0,
  };
};

export const showTemplateDownloadNotification = (success: boolean) => {
  if (success) {
    notifications.show({
      title: 'Plantilla descargada',
      message: 'La plantilla Excel ha sido descargada',
      color: 'green',
    });
  } else {
    notifications.show({
      title: 'Error',
      message: 'No se pudo descargar la plantilla',
      color: 'red',
    });
  }
};

export const showCorrectionSuccessNotification = (reintentoResult: Record<string, unknown>) => {
  if (reintentoResult && reintentoResult.success) {
    notifications.show({
      title: 'Datos importados y viajes reintentados',
      message: `Se importaron los datos de corrección y se procesaron ${reintentoResult.successCount || 0} viajes adicionales exitosamente.`,
      color: 'green',
    });
  } else {
    notifications.show({
      title: 'Datos importados correctamente',
      message:
        'Los datos de corrección han sido importados. Ahora puedes reintentar la importación completa para procesar todos los viajes.',
      color: 'green',
    });
  }
};

export const showFileProcessingError = (error: string) => {
  notifications.show({
    title: 'Error',
    message: error || 'No se pudo procesar el archivo Excel',
    color: 'red',
  });
};

export const showValidationWarning = () => {
  notifications.show({
    title: 'Validación pendiente',
    message: 'Debe corregir los errores o habilitar "Saltar filas inválidas"',
    color: 'orange',
  });
};

export const showRetryError = () => {
  notifications.show({
    title: 'Error',
    message: 'No hay archivo para reintentar la importación',
    color: 'red',
  });
};
