import React from 'react';
import { Box, Button, Group, Stack } from '@mantine/core';
import { VariableHelper } from '../../helpers/VariableHelper';
import { ClienteSection } from './ClienteSection';
import { FormulaSection } from './FormulaSection';
import { VigenciaSection } from './VigenciaSection';
import { ExamplesSection } from './ExamplesSection';
import { FormValues } from '../../../hooks/useFormulaForm';
import { Cliente } from '../../../types';
import { ValidationResult, Formula } from '../../../services/formulaService';
import { FormProps } from './types';

interface FormContainerProps extends FormProps {
  clientes: Cliente[];
  clienteId?: string;
  formulaId?: string;
  loading: boolean;
  validationResult: ValidationResult | null;
  conflictos: Formula[];
  showHelper: boolean;
  setShowHelper: (show: boolean) => void;
  insertExample: (formula: string) => void;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  form,
  clientes,
  clienteId,
  formulaId,
  loading,
  validationResult,
  conflictos,
  showHelper,
  setShowHelper,
  insertExample,
  onSubmit,
  onCancel,
}) => {
  return (
    <Box>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <ClienteSection clientes={clientes} clienteId={clienteId} form={form} />

          <FormulaSection
            form={form}
            validationResult={validationResult}
            showHelper={showHelper}
            setShowHelper={setShowHelper}
          />

          <VigenciaSection form={form} conflictos={conflictos} />

          {showHelper && <VariableHelper />}

          <ExamplesSection insertExample={insertExample} />

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {formulaId ? 'Actualizar' : 'Crear'} Fórmula
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};
