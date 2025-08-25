import React from 'react';
import { Grid, Select } from '@mantine/core';
import { Cliente } from '../../../types';
import { FormProps } from './types';

interface ClienteSectionProps extends FormProps {
  clientes: Cliente[];
  clienteId?: string;
}

const TIPOS_UNIDAD = [
  { value: 'General', label: 'General (Aplica a todos)' },
  { value: 'Sider', label: 'Sider' },
  { value: 'Bitren', label: 'Bitren' },
];

export const ClienteSection: React.FC<ClienteSectionProps> = ({ clientes, clienteId, form }) => {
  return (
    <Grid>
      <Grid.Col span={8}>
        <Select
          label="Cliente"
          placeholder="Seleccionar cliente"
          required
          data={clientes.map((c) => ({
            value: c._id,
            label: c.nombre || 'Sin nombre',
          }))}
          searchable
          disabled={!!clienteId}
          {...form.getInputProps('clienteId')}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Select
          label="Tipo de Unidad"
          placeholder="Seleccionar tipo"
          required
          data={TIPOS_UNIDAD}
          {...form.getInputProps('tipoUnidad')}
        />
      </Grid.Col>
    </Grid>
  );
};
