import React, { useState } from 'react';
import { Stack, Group, ActionIcon, Text, Badge, Alert } from '@mantine/core';
import { IconTrash, IconInfoCircle } from '@tabler/icons-react';
import { ICondicion } from '../../../types/tarifa';
import { CondicionesFormProps, CondicionFormState } from '../types/ReglaTarifaBuilderTypes';
import CondicionFormFields from './CondicionFormFields';

const CondicionesForm: React.FC<CondicionesFormProps> = ({ condiciones, onCondicionesChange }) => {
  const [newCondicion, setNewCondicion] = useState<CondicionFormState>({
    campo: '',
    operador: 'igual',
    valor: '',
  });

  const handleAddCondicion = () => {
    if (!newCondicion.campo || !newCondicion.operador) return;

    const condicion: ICondicion = {
      campo: newCondicion.campo,
      operador: newCondicion.operador as ICondicion['operador'],
      valor: newCondicion.valor,
      valorHasta: newCondicion.valorHasta,
    };

    onCondicionesChange([...condiciones, condicion]);
    setNewCondicion({ campo: '', operador: 'igual', valor: '' });
  };

  const handleRemoveCondicion = (index: number) => {
    const updated = condiciones.filter((_, i) => i !== index);
    onCondicionesChange(updated);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Condiciones</Text>
        <Badge variant="light" color="blue">
          {condiciones.length} condiciones
        </Badge>
      </Group>

      {condiciones.length === 0 && (
        <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
          No hay condiciones definidas. Añade al menos una condición para que la regla se aplique.
        </Alert>
      )}

      {/* Lista de condiciones existentes */}
      <Stack gap="xs">
        {condiciones.map((condicion, index) => (
          <Group key={index} justify="space-between" wrap="nowrap">
            <Text size="sm" style={{ flex: 1 }}>
              <strong>{condicion.campo}</strong> {condicion.operador} {String(condicion.valor)}
              {condicion.valorHasta && ` y ${condicion.valorHasta}`}
            </Text>
            <ActionIcon color="red" variant="light" onClick={() => handleRemoveCondicion(index)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>

      <CondicionFormFields
        newCondicion={newCondicion}
        setNewCondicion={setNewCondicion}
        onAddCondicion={handleAddCondicion}
      />
    </Stack>
  );
};

export default CondicionesForm;
