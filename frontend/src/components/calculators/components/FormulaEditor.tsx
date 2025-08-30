import React from 'react';
import { Textarea, Group, ActionIcon, Collapse, Box, Text } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface FormulaEditorProps {
  customFormula: string;
  useCustom: boolean;
  editorOpened: boolean;
  readonly?: boolean;
  onFormulaChange: (formula: string) => void;
  onToggleEditor: () => void;
}

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  customFormula,
  useCustom,
  editorOpened,
  readonly = false,
  onFormulaChange,
  onToggleEditor,
}) => {
  return (
    <>
      {useCustom && !readonly && (
        <Group justify="space-between" mb="sm">
          <Text fw={500}>Editor de Fórmulas</Text>
          <ActionIcon variant="subtle" onClick={onToggleEditor} size="sm">
            {editorOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>
      )}

      <Collapse in={useCustom && editorOpened}>
        <Box mb="md">
          <Textarea
            placeholder="Escriba su fórmula personalizada aquí..."
            value={customFormula}
            onChange={(event) => onFormulaChange(event.currentTarget.value)}
            minRows={4}
            maxRows={8}
            disabled={readonly}
          />
          <Group mt="sm" gap="xs">
            <Text size="xs" c="dimmed">
              Variables disponibles: palets, distancia, peso, volumen, tiempo, combustible, peaje,
              tarifaBase, multiplicador
            </Text>
          </Group>
        </Box>
      </Collapse>
    </>
  );
};
