import React from 'react';
import { Paper, Group, Text, Collapse, ScrollArea, Stack, Box, ActionIcon } from '@mantine/core';
import { IconFunction, IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { FUNCIONES_FORMULA } from '../../../types/tarifa';

interface FunctionsPanelProps {
  funcionesOpen: boolean;
  onToggleFunciones: () => void;
  onInsertFunction: (funcion: (typeof FUNCIONES_FORMULA)[0]) => void;
}

const FunctionsPanel: React.FC<FunctionsPanelProps> = ({
  funcionesOpen,
  onToggleFunciones,
  onInsertFunction,
}) => {
  return (
    <Paper p="sm" withBorder>
      <Group
        justify="space-between"
        style={{ cursor: 'pointer' }}
        onClick={onToggleFunciones}
      >
        <Group gap="xs">
          <IconFunction size={16} />
          <Text size="sm" fw={600}>
            Funciones
          </Text>
        </Group>
        {funcionesOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
      </Group>

      <Collapse in={funcionesOpen}>
        <ScrollArea h={200} mt="sm">
          <Stack gap="xs">
            {FUNCIONES_FORMULA.map((funcion) => (
              <Group key={funcion.nombre} justify="space-between" wrap="nowrap">
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Text size="xs" fw={600}>
                    {funcion.nombre}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {funcion.descripcion}
                  </Text>
                </Box>
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="blue"
                  onClick={() => onInsertFunction(funcion as (typeof FUNCIONES_FORMULA)[0])}
                >
                  <IconPlus size={12} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      </Collapse>
    </Paper>
  );
};

export default FunctionsPanel;