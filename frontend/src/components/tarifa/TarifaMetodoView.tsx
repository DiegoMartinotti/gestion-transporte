import React from 'react';
import { Modal, Stack, Paper, Text, Group, Badge } from '@mantine/core';
import FormulaEditor from './FormulaEditor';
import { useModal } from '../../hooks/useModal';
import { ITarifaMetodo } from '../../types/tarifa';

interface TarifaMetodoViewProps {
  viewModal: ReturnType<typeof useModal<ITarifaMetodo>>;
}

const TarifaMetodoView: React.FC<TarifaMetodoViewProps> = ({ viewModal }) => {
  return (
    <Modal
      opened={viewModal.isOpen}
      onClose={viewModal.close}
      title="Detalles del Método"
      size="lg"
    >
      {viewModal.selectedItem && (
        <Stack gap="md">
          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Información General
            </Text>
            <Group grow>
              <div>
                <Text size="xs" c="dimmed">
                  Código
                </Text>
                <Text fw={600}>{viewModal.selectedItem.codigo}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Prioridad
                </Text>
                <Text>{viewModal.selectedItem.prioridad}</Text>
              </div>
            </Group>

            <Text size="xs" c="dimmed" mt="md">
              Nombre
            </Text>
            <Text fw={600}>{viewModal.selectedItem.nombre}</Text>

            <Text size="xs" c="dimmed" mt="md">
              Descripción
            </Text>
            <Text>{viewModal.selectedItem.descripcion}</Text>
          </Paper>

          <Paper p="md" withBorder>
            <Text fw={600} mb="sm">
              Fórmula Base
            </Text>
            <FormulaEditor
              value={viewModal.selectedItem.formulaBase}
              onChange={() => {
                /* readonly */
              }}
              variables={viewModal.selectedItem.variables}
              readonly={true}
              showVariablePicker={false}
              showFunctionHelper={false}
            />
          </Paper>

          {viewModal.selectedItem.variables.length > 0 && (
            <Paper p="md" withBorder>
              <Text fw={600} mb="sm">
                Variables ({viewModal.selectedItem.variables.length})
              </Text>
              <Stack gap="xs">
                {viewModal.selectedItem.variables.map((variable, index) => (
                  <Group key={index} justify="space-between" p="sm" bg="gray.0">
                    <Group>
                      <Badge color="blue" variant="light">
                        {variable.nombre}
                      </Badge>
                      <Text size="sm">{variable.descripcion}</Text>
                    </Group>
                    <Group gap="xs">
                      <Badge size="xs" variant="outline">
                        {variable.tipo}
                      </Badge>
                      <Badge size="xs" variant="outline" color="gray">
                        {variable.origen}
                      </Badge>
                      {variable.requerido && (
                        <Badge size="xs" color="red" variant="light">
                          Requerido
                        </Badge>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Modal>
  );
};

export default TarifaMetodoView;
