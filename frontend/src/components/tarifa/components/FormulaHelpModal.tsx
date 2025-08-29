import React from 'react';
import { Modal, Stack, Text, Box, Group, Badge, Divider, Code } from '@mantine/core';
import { FUNCIONES_FORMULA } from '../../../types/tarifa';

interface FormulaHelpModalProps {
  opened: boolean;
  onClose: () => void;
}

const FormulaHelpModal: React.FC<FormulaHelpModalProps> = ({ opened, onClose }) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Guía de Funciones" size="lg">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Lista completa de funciones disponibles para usar en las fórmulas de cálculo:
        </Text>

        {FUNCIONES_FORMULA.map((funcion) => (
          <Box key={funcion.nombre} p="md" style={{ border: '1px solid #e9ecef', borderRadius: '4px' }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600} c="blue">
                  {funcion.nombre}
                </Text>
                <Badge variant="light">{funcion.sintaxis}</Badge>
              </Group>

              <Text size="sm">{funcion.descripcion}</Text>

              <Box>
                <Text size="xs" fw={600} mb="xs">
                  Ejemplo:
                </Text>
                <Code block>{funcion.ejemplo}</Code>
              </Box>
            </Stack>
          </Box>
        ))}

        <Divider />

        <Box>
          <Text fw={600} mb="sm">
            Operadores Disponibles:
          </Text>
          <Group gap="xs">
            {['+', '-', '*', '/', '(', ')', '>', '<', '>=', '<=', '==', '!=', '&&', '||'].map(
              (op) => (
                <Badge key={op} variant="outline" size="sm">
                  {op}
                </Badge>
              )
            )}
          </Group>
        </Box>
      </Stack>
    </Modal>
  );
};

export default FormulaHelpModal;