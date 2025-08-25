import * as React from 'react';
import { useMemo } from 'react';
import {
  IconAlertCircle,
  IconRefresh,
  IconDatabase,
  IconX,
  IconClock,
  IconBug,
  IconRestore,
  IconDownload,
  IconWand,
} from '@tabler/icons-react';
import {
  FailureDetails,
  RecoveryOption,
  RecoveryLog,
  FailureAnalysis,
  RecoveryProcessConfig,
  RecoveryDetails,
} from './FailureRecoveryTypes';

export const getErrorIcon = (type: string) => {
  switch (type) {
    case 'validation':
      return <IconAlertCircle size={20} />;
    case 'network':
      return <IconDatabase size={20} />;
    case 'server':
      return <IconX size={20} />;
    case 'timeout':
      return <IconClock size={20} />;
    default:
      return <IconBug size={20} />;
  }
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'blue';
    default:
      return 'gray';
  }
};

export const executeRecoveryProcess = async (config: RecoveryProcessConfig) => {
  const {
    selectedOptions,
    recoveryOptions,
    failure,
    addLog,
    setRecoveryState,
    onRecover,
    recoveryLogs = [],
  } = config;

  setRecoveryState((prev) => ({ ...prev, status: 'analyzing', progress: 10 }));
  addLog('info', 'Analizando opciones de recuperación...');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  setRecoveryState((prev) => ({ ...prev, status: 'recovering', progress: 30 }));

  const selectedOptionsList = recoveryOptions.filter((opt) => selectedOptions.has(opt.id));

  for (let i = 0; i < selectedOptionsList.length; i++) {
    const option = selectedOptionsList[i];
    setRecoveryState((prev) => ({
      ...prev,
      currentAction: option.name,
      progress: 30 + (60 / selectedOptionsList.length) * i,
    }));

    try {
      await option.action();
    } catch (error) {
      addLog('error', `Error al ejecutar ${option.name}: ${error}`);
    }
  }

  setRecoveryState((prev) => ({ ...prev, status: 'completed', progress: 100 }));
  addLog('success', 'Proceso de recuperación completado');

  if (onRecover) {
    onRecover({
      success: true,
      recoveredRecords: failure.failedRecords * 0.8,
      remainingErrors: failure.failedRecords * 0.2,
      logs: recoveryLogs,
    });
  }
};

export const useFailureAnalysis = (failure: FailureDetails): FailureAnalysis => {
  return useMemo(() => {
    const successRate =
      failure.totalRecords > 0
        ? ((failure.processedRecords - failure.failedRecords) / failure.totalRecords) * 100
        : 0;

    const canRetryFromCheckpoint =
      failure.lastSuccessfulRow !== undefined && failure.lastSuccessfulRow > 0;
    const hasPartialData = Boolean(failure.failedData && failure.failedData.length > 0);

    const severity =
      failure.failedRecords === failure.totalRecords
        ? 'critical'
        : failure.failedRecords > failure.totalRecords * 0.5
          ? 'high'
          : failure.failedRecords > failure.totalRecords * 0.1
            ? 'medium'
            : 'low';

    return {
      successRate,
      canRetryFromCheckpoint,
      hasPartialData,
      severity,
    };
  }, [failure]);
};

export const useRecoveryOptions = (
  failure: FailureDetails,
  failureAnalysis: FailureAnalysis,
  addLog: (level: RecoveryLog['level'], message: string, details?: RecoveryDetails) => void,
  setShowExportModal: (show: boolean) => void
): RecoveryOption[] => {
  return useMemo(
    () => [
      {
        id: 'retry-all',
        name: 'Reintentar todo',
        description: 'Vuelve a procesar todos los registros desde el inicio',
        icon: <IconRefresh size={20} />,
        action: async () => {
          addLog('info', 'Iniciando reintento completo...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          addLog('success', 'Reintento completado');
        },
        available: true,
      },
      {
        id: 'retry-checkpoint',
        name: 'Continuar desde checkpoint',
        description: `Retomar desde la fila ${failure.lastSuccessfulRow || 0}`,
        icon: <IconRestore size={20} />,
        action: async () => {
          addLog('info', `Retomando desde fila ${failure.lastSuccessfulRow}`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          addLog('success', 'Procesamiento retomado exitosamente');
        },
        available: !!failureAnalysis.canRetryFromCheckpoint,
        reason: !failureAnalysis.canRetryFromCheckpoint
          ? 'No hay checkpoint disponible'
          : undefined,
      },
      {
        id: 'retry-failed',
        name: 'Solo reintentar fallidos',
        description: 'Procesar únicamente los registros que fallaron',
        icon: <IconBug size={20} />,
        action: async () => {
          addLog('info', `Reintentando ${failure.failedRecords} registros fallidos`);
          await new Promise((resolve) => setTimeout(resolve, 1800));
          addLog('success', 'Registros fallidos reprocesados');
        },
        available: !!failureAnalysis.hasPartialData,
        reason: !failureAnalysis.hasPartialData ? 'No hay datos de registros fallidos' : undefined,
      },
      {
        id: 'export-failed',
        name: 'Exportar fallidos',
        description: 'Descargar los registros que no se pudieron procesar',
        icon: <IconDownload size={20} />,
        action: async () => {
          setShowExportModal(true);
        },
        available: !!failureAnalysis.hasPartialData,
        reason: !failureAnalysis.hasPartialData ? 'No hay datos para exportar' : undefined,
      },
      {
        id: 'auto-fix',
        name: 'Corrección automática',
        description: 'Intentar corregir errores comunes automáticamente',
        icon: <IconWand size={20} />,
        action: async () => {
          addLog('info', 'Analizando errores para corrección automática...');
          await new Promise((resolve) => setTimeout(resolve, 2500));
          addLog('warning', 'Se corrigieron 15 errores automáticamente');
          addLog('info', 'Quedan 8 errores que requieren revisión manual');
        },
        available: failure.errorType === 'validation',
        reason:
          failure.errorType !== 'validation'
            ? 'Solo disponible para errores de validación'
            : undefined,
      },
    ],
    [failure, failureAnalysis, addLog, setShowExportModal]
  );
};
