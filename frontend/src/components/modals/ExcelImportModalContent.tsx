import { useRef } from 'react';
import { Stack, Alert, Stepper } from '@mantine/core';
import { IconFileUpload, IconFileCheck, IconCheck, IconX } from '@tabler/icons-react';

// Import step components
import { UploadStep } from './steps/UploadStep';
import { ValidationStep } from './steps/ValidationStep';
import { ImportStep } from './steps/ImportStep';
import { ResultsStep } from './steps/ResultsStep';

// Import hooks
import { useExcelImportState } from '../../hooks/useExcelImportState';
import { useExcelImportActions } from '../../hooks/useExcelImportActions';

// Import types
import type {
  ExcelImportModalProps,
  ExcelImportState,
  ExcelImportActions,
} from './types/ExcelImportModalTypes';

interface ExcelImportModalContentProps
  extends Omit<ExcelImportModalProps, 'opened' | 'onClose' | 'title'> {
  onClose: () => void;
}

interface StepContentConfig {
  currentStep: number;
  entityType: string;
  state: ExcelImportState;
  actions: ExcelImportActions;
  abortController: React.MutableRefObject<AbortController | null>;
  onClose: () => void;
}

// Helper function to render stepper component
const renderStepper = (currentStep: number) => (
  <Stepper active={currentStep}>
    <Stepper.Step
      label="Cargar Archivo"
      description="Seleccionar archivo Excel"
      icon={<IconFileUpload size="1rem" />}
    />
    <Stepper.Step
      label="Validar Datos"
      description="Revisar y configurar"
      icon={<IconFileCheck size="1rem" />}
    />
    <Stepper.Step
      label="Importar"
      description="Ejecutar importación"
      icon={<IconCheck size="1rem" />}
    />
    <Stepper.Step label="Completado" description="Resultados" icon={<IconCheck size="1rem" />} />
  </Stepper>
);

// Helper function to render step content based on current step
const renderStepContent = (config: StepContentConfig) => {
  const { currentStep, entityType, state, actions, abortController, onClose } = config;

  const handleClose = () => {
    actions.resetState();
    if (abortController.current) {
      abortController.current.abort();
    }
    onClose();
  };

  switch (currentStep) {
    case 0:
      return (
        <UploadStep
          entityType={entityType}
          loading={state.loading}
          onFileUpload={(file) => actions.handleFileUpload(file, abortController)}
          onTemplateDownload={actions.handleTemplateDownload}
        />
      );
    case 1:
      return (
        <ValidationStep
          entityType={entityType}
          validationResult={state.validationResult}
          previewData={state.previewData}
          autoCorrect={state.autoCorrect}
          skipInvalidRows={state.skipInvalidRows}
          onAutoCorrectChange={actions.setAutoCorrect}
          onSkipInvalidRowsChange={actions.setSkipInvalidRows}
          onBack={() => actions.setCurrentStep(0)}
          onContinue={actions.handleValidationReview}
        />
      );
    case 2:
      return (
        <ImportStep
          validationResult={state.validationResult}
          loading={state.loading}
          importProgress={state.importProgress}
          onBack={() => actions.setCurrentStep(1)}
          onImport={() => actions.handleImport(state.file, abortController)}
        />
      );
    case 3:
      return (
        <ResultsStep
          importResult={state.importResult}
          loading={state.loading}
          onClose={handleClose}
          onResetForm={actions.resetImportForm}
          onDownloadMissingData={actions.handleDownloadMissingDataTemplates}
          onRetryImport={() => actions.handleRetryImport(state.file, abortController)}
          onOpenCorrectionModal={() => actions.setCorrectionUploadModalOpen(true)}
        />
      );
    default:
      return null;
  }
};

export function ExcelImportModalContent(props: ExcelImportModalContentProps) {
  const {
    entityType,
    onImportComplete,
    processExcelFile,
    validateExcelFile,
    previewExcelFile,
    getTemplate,
    onClose,
  } = props;

  // Use custom hooks for state and actions
  const state = useExcelImportState();
  const actions = useExcelImportActions({
    state,
    processExcelFile,
    validateExcelFile,
    previewExcelFile,
    getTemplate,
    onImportComplete,
  });

  const abortController = useRef<AbortController | null>(null);

  return (
    <Stack gap="lg">
      {renderStepper(state.currentStep)}

      {state.error && (
        <Alert icon={<IconX size="1rem" />} color="red" onClose={() => actions.setError(null)}>
          {state.error}
        </Alert>
      )}

      {renderStepContent({
        currentStep: state.currentStep,
        entityType,
        state,
        actions,
        abortController,
        onClose,
      })}
    </Stack>
  );
}
