import React from 'react';
import { Stepper } from '@mantine/core';
import {
  IconUpload,
  IconTableImport,
  IconCheck,
  IconCloudUpload,
  IconDatabase,
  IconCheckupList,
} from '@tabler/icons-react';
import { ImportState } from '../types';

interface WizardStepperProps {
  active: number;
  onStepClick: (step: number) => void;
  importState: ImportState;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  active,
  onStepClick,
  importState,
}) => (
  <Stepper active={active} onStepClick={onStepClick} mb="xl">
    <Stepper.Step
      label="Tipo de datos"
      description="Seleccionar entidad"
      icon={<IconDatabase size={18} />}
      loading={false}
    />
    <Stepper.Step
      label="Cargar archivo"
      description="Subir Excel"
      icon={<IconUpload size={18} />}
      loading={false}
    />
    <Stepper.Step
      label="Vista previa"
      description="Revisar datos"
      icon={<IconTableImport size={18} />}
      loading={false}
    />
    <Stepper.Step
      label="Validación"
      description="Verificar errores"
      icon={<IconCheckupList size={18} />}
      loading={importState.isValidating}
    />
    <Stepper.Step
      label="Importación"
      description="Procesar datos"
      icon={<IconCloudUpload size={18} />}
      loading={importState.isImporting}
    />
    <Stepper.Step
      label="Completado"
      description="Resultado final"
      icon={<IconCheck size={18} />}
      loading={false}
    />
  </Stepper>
);