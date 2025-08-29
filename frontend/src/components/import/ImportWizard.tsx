import React, { useState } from 'react';
import {
  Paper,
  Title,
  Container,
  Box,
  Divider,
  Button,
  Group,
} from '@mantine/core';

import { ImportWizardProps } from './types';
import { useImportWizard } from './hooks/useImportWizard';
import { EntitySelectionStep } from './steps/EntitySelectionStep';
import { FileUploadStep } from './steps/FileUploadStep';
import { DataPreviewStep } from './steps/DataPreviewStep';
import { ValidationResultsStep } from './steps/ValidationResultsStep';
import { ImportProgressStep } from './steps/ImportProgressStep';
import { CompletionSummaryStep } from './steps/CompletionSummaryStep';
import { WizardStepper } from './components/WizardStepper';
import { WizardNavigation } from './components/WizardNavigation';

interface StepContentConfig {
  active: number;
  entityType: string;
  setEntityType: (value: string) => void;
  importState: ReturnType<typeof useImportWizard>['importState'];
  handlers: {
    handleTemplateDownload: () => Promise<void>;
    handleFileUpload: (file: File) => void;
    handleValidation: () => void;
    handleImport: () => void;
    resetWizard: () => void;
  };
}

const getStepContent = (config: StepContentConfig) => {
  const { active, entityType, setEntityType, importState, handlers } = config;
  switch (active) {
    case 0:
      return (
        <EntitySelectionStep
          entityType={entityType}
          onChange={setEntityType}
        />
      );
    case 1:
      return (
        <FileUploadStep
          entityType={entityType}
          onFileUpload={handlers.handleFileUpload}
          onTemplateDownload={handlers.handleTemplateDownload}
        />
      );
    case 2:
      return (
        <DataPreviewStep
          importState={importState}
          entityType={entityType}
          onValidation={handlers.handleValidation}
        />
      );
    case 3:
      return <ValidationResultsStep importState={importState} />;
    case 4:
      return (
        <ImportProgressStep
          importState={importState}
          onImport={handlers.handleImport}
        />
      );
    case 5:
      return (
        <CompletionSummaryStep
          importState={importState}
          onNewImport={handlers.resetWizard}
        />
      );
    default:
      return null;
  }
};

const ImportWizard: React.FC<ImportWizardProps> = ({
  entityType: initialEntityType,
  onComplete,
  onCancel,
}) => {
  const [entityType, setEntityType] = useState(initialEntityType || '');
  const {
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
  } = useImportWizard(entityType, onComplete);

  const handlers = {
    handleTemplateDownload,
    handleFileUpload,
    handleValidation,
    handleImport,
    resetWizard,
  };


  return (
    <Container size="lg">
      <Paper shadow="sm" p="xl" radius="md">
        <Group justify="space-between" mb="xl">
          <Title order={2}>Importación de datos</Title>
          {onCancel && (
            <Button variant="subtle" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </Group>

        <WizardStepper
          active={active}
          onStepClick={setActive}
          importState={importState}
        />

        <Divider my="xl" />

        <Box style={{ minHeight: 400 }}>
          {getStepContent({ active, entityType, setEntityType, importState, handlers })}
        </Box>

        <Divider my="xl" />

        <WizardNavigation
          active={active}
          entityType={entityType}
          importState={importState}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onNewImport={resetWizard}
        />
      </Paper>
    </Container>
  );
};

// Comparador para React.memo
const arePropsEqual = (prevProps: ImportWizardProps, nextProps: ImportWizardProps): boolean => {
  return (
    prevProps.entityType === nextProps.entityType &&
    prevProps.onComplete === nextProps.onComplete &&
    prevProps.onCancel === nextProps.onCancel
  );
};

export default React.memo(ImportWizard, arePropsEqual);
