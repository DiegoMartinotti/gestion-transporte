// Hook custom para ImportWizard
import { useState, useCallback, useMemo } from 'react';
import { ImportState } from './ImportWizardTypes';
import {
  clienteExcelService,
  empresaExcelService,
  personalExcelService,
  siteExcelService,
  tramoExcelService,
  vehiculoExcelService,
  viajeExcelService,
  extraExcelService,
} from '../../services/excel';
import { useImportActions } from './useImportWizardActions';

interface UseImportWizardOptions {
  initialEntityType?: string;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
}

export const useImportWizard = (options: UseImportWizardOptions = {}) => {
  const [active, setActive] = useState(0);
  const [entityType, setEntityType] = useState(options.initialEntityType || '');
  const [importState, setImportState] = useState<ImportState>({
    data: [],
    validationErrors: [],
    correctedData: [],
    isValidating: false,
    isImporting: false,
  });

  const nextStep = () => setActive((current) => (current < 5 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  // Mapeo de servicios Excel por tipo de entidad
  const excelServicesMap = useMemo(
    () => ({
      clientes: clienteExcelService,
      empresas: empresaExcelService,
      personal: personalExcelService,
      sites: siteExcelService,
      tramos: tramoExcelService,
      vehiculos: vehiculoExcelService,
      viajes: viajeExcelService,
      extras: extraExcelService,
    }),
    []
  );

  // Función para descargar plantilla basada en el tipo de entidad
  const handleTemplateDownload = useCallback(async () => {
    if (!entityType) return;

    try {
      const service = excelServicesMap[entityType as keyof typeof excelServicesMap];
      if (!service) {
        throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }

      const blob = await service.getTemplate();

      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plantilla_${entityType}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      throw error;
    }
  }, [entityType, excelServicesMap]);

  const { handleFileUpload, handleValidation, handleImport } = useImportActions({
    importState,
    setImportState,
    entityType,
    nextStep,
    onComplete: options.onComplete,
  });

  const handleReset = useCallback(() => {
    setActive(0);
    setEntityType(options.initialEntityType || '');
    setImportState({
      data: [],
      validationErrors: [],
      correctedData: [],
      isValidating: false,
      isImporting: false,
    });
  }, [options.initialEntityType]);

  return {
    // State
    active,
    entityType,
    importState,

    // Actions
    setActive,
    setEntityType,
    nextStep,
    prevStep,

    // Handlers
    handleTemplateDownload,
    handleFileUpload,
    handleValidation,
    handleImport,
    handleReset,

    // Options
    onComplete: options.onComplete,
    onCancel: options.onCancel,
  };
};
