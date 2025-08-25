import React from 'react';
import { Textarea, Group, ActionIcon, Alert, Text } from '@mantine/core';
import { IconHelp, IconCheck, IconX } from '@tabler/icons-react';
import { ValidationResult } from '../../../services/formulaService';
import { FormulaValidator } from '../../validators/FormulaValidator';
import { FormulaPreview } from '../../preview/FormulaPreview';
import { FormProps } from './types';

interface FormulaSectionProps extends FormProps {
  validationResult: ValidationResult | null;
  showHelper: boolean;
  setShowHelper: (show: boolean) => void;
}

export const FormulaSection: React.FC<FormulaSectionProps> = ({
  form,
  validationResult,
  showHelper,
  setShowHelper,
}) => {
  return (
    <>
      <Group align="flex-end">
        <Textarea
          label="Fórmula"
          placeholder="Ej: Valor * Palets + Peaje"
          required
          minRows={3}
          maxRows={6}
          style={{ flex: 1 }}
          {...form.getInputProps('formula')}
        />
        <ActionIcon variant="light" size="lg" onClick={() => setShowHelper(!showHelper)}>
          <IconHelp size={18} />
        </ActionIcon>
      </Group>

      {validationResult && (
        <Alert
          icon={validationResult.isValid ? <IconCheck size={16} /> : <IconX size={16} />}
          color={validationResult.isValid ? 'green' : 'red'}
          title={validationResult.isValid ? 'Fórmula válida' : 'Errores en la fórmula'}
        >
          {validationResult.isValid ? (
            <Text size="sm">La fórmula es correcta y puede ser guardada</Text>
          ) : (
            <div>
              {validationResult.errors?.map((error, index) => (
                <Text key={index} size="sm">
                  • {error}
                </Text>
              ))}
            </div>
          )}
        </Alert>
      )}

      {showHelper && <FormulaValidator />}

      {form.values.formula && validationResult?.isValid && (
        <FormulaPreview formula={form.values.formula} />
      )}
    </>
  );
};
