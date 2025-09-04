import { useState, useCallback } from 'react';
import { FileWithPath } from '@mantine/dropzone';
import { ImportState, ImportResult, ImportError } from '../types';
import {
  clienteExcelService,
  empresaExcelService,
  personalExcelService,
  siteExcelService,
  tramoExcelService,
  vehiculoExcelService,
  viajeExcelService,
  extraExcelService,
} from '../../../services/BaseExcelService';

const excelServicesMap = {
  clientes: clienteExcelService,
  empresas: empresaExcelService,
  personal: personalExcelService,
  sites: siteExcelService,
  tramos: tramoExcelService,
  vehiculos: vehiculoExcelService,
  viajes: viajeExcelService,
  extras: extraExcelService,
} as const;

// Helper function for template download
const createTemplateDownloader = (entityType: string) => async () => {
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
};

// Helper function for creating mock validation errors
const createMockValidationErrors = (dataLength: number): ImportError[] => {
  const errors: ImportError[] = [];

  // Simular algunos errores de validación
  if (dataLength > 0) {
    errors.push({
      row: 3,
      field: 'email',
      value: 'invalid-email',
      error: 'Email inválido',
      severity: 'error',
    });

    errors.push({
      row: 5,
      field: 'telefono',
      value: '123',
      error: 'Teléfono muy corto',
      severity: 'warning',
    });
  }

  return errors;
};

// Helper function for creating import result
const createImportResult = (
  entityType: string,
  dataLength: number,
  validationErrors: ImportError[]
): ImportResult => ({
  entityType,
  total: dataLength,
  success: dataLength - validationErrors.filter((e) => e.severity === 'error').length,
  failed: validationErrors.filter((e) => e.severity === 'error').length,
  errors: validationErrors,
  timestamp: new Date(),
});

export const useImportWizard = (
  entityType: string,
  onComplete?: (result: ImportResult) => void
) => {
  const [active, setActive] = useState(0);
  const [importState, setImportState] = useState<ImportState>({
    data: [],
    validationErrors: [],
    correctedData: [],
    isValidating: false,
    isImporting: false,
  });

  const nextStep = () => setActive((current) => (current < 5 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleTemplateDownload = createTemplateDownloader(entityType);

  const handleFileUpload = useCallback((file: FileWithPath) => {
    // Procesar archivo Excel localmente (simulación)
    const data = [
      { nombre: 'Cliente 1', email: 'cliente1@email.com', ruc: '20123456789' },
      { nombre: 'Cliente 2', email: 'invalid-email', ruc: '20987654321' },
      { nombre: 'Cliente 3', email: 'cliente3@email.com', telefono: '123' },
    ];

    setImportState((prev) => ({
      ...prev,
      file,
      data,
      validationErrors: [],
      correctedData: [],
    }));
    nextStep();
  }, []);

  const handleValidation = useCallback(async () => {
    setImportState((prev) => ({ ...prev, isValidating: true }));

    // Simulación de validación - en producción esto llamaría al backend
    setTimeout(() => {
      const errors = createMockValidationErrors(importState.data.length);

      setImportState((prev) => ({
        ...prev,
        validationErrors: errors,
        isValidating: false,
      }));

      nextStep();
    }, 2000);
  }, [importState.data]);

  const handleImport = useCallback(async () => {
    setImportState((prev) => ({ ...prev, isImporting: true }));

    // Simulación de importación - en producción esto llamaría al backend
    setTimeout(() => {
      const result = createImportResult(
        entityType,
        importState.data.length,
        importState.validationErrors
      );

      setImportState((prev) => ({
        ...prev,
        importResult: result,
        isImporting: false,
      }));

      nextStep();

      if (onComplete) {
        onComplete(result);
      }
    }, 3000);
  }, [entityType, importState.data, importState.validationErrors, onComplete]);

  const resetWizard = () => {
    setActive(0);
    setImportState({
      data: [],
      validationErrors: [],
      correctedData: [],
      isValidating: false,
      isImporting: false,
    });
  };

  return {
    active,
    setActive,
    importState,
    nextStep,
    prevStep,
    handleTemplateDownload,
    handleFileUpload,
    handleValidation,
    handleImport,
    resetWizard,
  };
};
