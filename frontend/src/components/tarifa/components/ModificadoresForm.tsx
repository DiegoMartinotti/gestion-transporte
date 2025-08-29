import React, { useState } from 'react';
import { Stack, Group, ActionIcon, Text, Badge, Alert } from '@mantine/core';
import { IconTrash, IconInfoCircle } from '@tabler/icons-react';
import { IModificador } from '../../../types/tarifa';
import { ModificadoresFormProps, ModificadorFormState } from '../types/ReglaTarifaBuilderTypes';
import ModificadorFormFields from './ModificadorFormFields';

const ModificadoresForm: React.FC<ModificadoresFormProps> = ({
  modificadores,
  onModificadoresChange,
}) => {
  const [newModificador, setNewModificador] = useState<ModificadorFormState>({
    tipo: 'porcentaje',
    valor: 0,
    aplicarA: 'total',
    descripcion: '',
  });

  const handleAddModificador = () => {
    if (!newModificador.tipo || !newModificador.descripcion) return;

    const modificador: IModificador = {
      tipo: newModificador.tipo as IModificador['tipo'],
      valor: newModificador.valor,
      aplicarA: newModificador.aplicarA as IModificador['aplicarA'],
      descripcion: newModificador.descripcion,
      formulaPersonalizada: newModificador.formulaPersonalizada,
    };

    onModificadoresChange([...modificadores, modificador]);
    setNewModificador({
      tipo: 'porcentaje',
      valor: 0,
      aplicarA: 'total',
      descripcion: '',
    });
  };

  const handleRemoveModificador = (index: number) => {
    const updated = modificadores.filter((_, i) => i !== index);
    onModificadoresChange(updated);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Modificadores</Text>
        <Badge variant="light" color="green">
          {modificadores.length} modificadores
        </Badge>
      </Group>

      {modificadores.length === 0 && (
        <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />}>
          No hay modificadores definidos. Añade modificadores para ajustar el precio base.
        </Alert>
      )}

      {/* Lista de modificadores existentes */}
      <Stack gap="xs">
        {modificadores.map((modificador, index) => (
          <Group key={index} justify="space-between" wrap="nowrap">
            <Text size="sm" style={{ flex: 1 }}>
              <strong>{modificador.descripcion}</strong> - {modificador.tipo} {modificador.valor}%
              (aplicar a: {modificador.aplicarA})
            </Text>
            <ActionIcon color="red" variant="light" onClick={() => handleRemoveModificador(index)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>

      <ModificadorFormFields
        newModificador={newModificador}
        setNewModificador={setNewModificador}
        onAddModificador={handleAddModificador}
      />
    </Stack>
  );
};

export default ModificadoresForm;
