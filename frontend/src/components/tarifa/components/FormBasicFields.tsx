import React from 'react';
import { Stack, Group, TextInput, Textarea, Select, Text, Card } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ReglaTarifaFormData } from '../../../types/tarifa';
import { Cliente } from '../../../types';

interface FormBasicFieldsProps {
  form: UseFormReturnType<ReglaTarifaFormData>;
  clientes: Cliente[];
}

const FormBasicFields: React.FC<FormBasicFieldsProps> = ({ form, clientes }) => {
  const clientesOptions = clientes.map((cliente: Cliente) => ({
    value: cliente._id,
    label: cliente.nombre,
  }));

  const metodosCalculoOptions = [
    { value: 'DISTANCIA', label: 'Por Distancia' },
    { value: 'PALET', label: 'Por Palet' },
    { value: 'DISTANCIA_PALET', label: 'Distancia x Palet' },
    { value: 'PESO', label: 'Por Peso' },
    { value: 'VOLUMEN', label: 'Por Volumen' },
    { value: 'FORMULA_PERSONALIZADA', label: 'Fórmula Personalizada' },
  ];

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Text fw={600} mb="xs">
          Información Básica
        </Text>
        <Group grow>
          <TextInput label="Código" placeholder="DESC_VOLUMEN" {...form.getInputProps('codigo')} />
          <TextInput
            label="Nombre"
            placeholder="Descuento por volumen"
            {...form.getInputProps('nombre')}
          />
        </Group>
        <Textarea
          label="Descripción"
          placeholder="Descripción detallada de la regla"
          {...form.getInputProps('descripcion')}
        />
        <Group grow>
          <Select
            label="Cliente"
            placeholder="Seleccionar cliente"
            data={clientesOptions}
            {...form.getInputProps('cliente')}
          />
          <Select
            label="Método de Cálculo"
            placeholder="Seleccionar método"
            data={metodosCalculoOptions}
            {...form.getInputProps('metodoCalculo')}
          />
        </Group>
      </Stack>
    </Card>
  );
};

export default FormBasicFields;
