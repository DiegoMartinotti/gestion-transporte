import React from 'react';
import { Group, Text, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconCode, IconCheck, IconX, IconHelp } from '@tabler/icons-react';
import { IValidacionFormula } from '../../../types/tarifa';

interface FormulaEditorHeaderProps {
  showValidation: boolean;
  validacion: IValidacionFormula | null;
  showFunctionHelper: boolean;
  onOpenHelp: () => void;
}

const FormulaEditorHeader: React.FC<FormulaEditorHeaderProps> = ({
  showValidation,
  validacion,
  showFunctionHelper,
  onOpenHelp,
}) => {
  return (
    <Group justify="space-between" align="center">
      <Group gap="xs">
        <IconCode size={16} />
        <Text size="sm" fw={600}>
          Editor de Fórmulas
        </Text>
      </Group>

      <Group gap="xs">
        {showValidation && validacion && (
          <Badge
            color={validacion.valida ? 'green' : 'red'}
            variant="light"
            leftSection={validacion.valida ? <IconCheck size={12} /> : <IconX size={12} />}
          >
            {validacion.valida ? 'Válida' : 'Con errores'}
          </Badge>
        )}

        {showFunctionHelper && (
          <Tooltip label="Ayuda de funciones">
            <ActionIcon variant="light" onClick={onOpenHelp}>
              <IconHelp size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  );
};

export default FormulaEditorHeader;