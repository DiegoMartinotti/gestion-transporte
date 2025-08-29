import { Grid, Stack, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import { ClienteSelector } from '../../../components/selectors/ClienteSelector';
import { TramoSelector } from '../../../components/selectors/TramoSelector';
import { ViajeFormData } from '../../../types/viaje';
import { Cliente } from '../../../types/cliente';
import { Tramo } from '../../../types/tramo';

interface ViajeFormStep1Props {
  form: UseFormReturnType<ViajeFormData>;
  clientes: Cliente[];
  tramos: Tramo[];
}

export const ViajeFormStep1 = ({ form, clientes, tramos }: ViajeFormStep1Props) => {
  const estadoOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'facturado', label: 'Facturado' },
  ];

  return (
    <Stack>
      <Grid>
        <Grid.Col span={6}>
          <DateInput
            label="Fecha del Viaje"
            placeholder="Seleccionar fecha"
            value={form.values.fecha ? new Date(form.values.fecha) : null}
            onChange={(date) => form.setFieldValue('fecha', date?.toISOString().split('T')[0] || '')}
            error={form.errors.fecha}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Estado"
            placeholder="Seleccionar estado"
            data={estadoOptions}
            value={form.values.estado}
            onChange={(value) => form.setFieldValue('estado', value || 'pendiente')}
            required
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <ClienteSelector
            value={form.values.cliente}
            onChange={(value) => form.setFieldValue('cliente', value)}
            error={form.errors.cliente}
            required
            data={clientes}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TramoSelector
            value={form.values.tramo}
            onChange={(value) => form.setFieldValue('tramo', value)}
            error={form.errors.tramo}
            clienteId={form.values.cliente}
            required
            data={tramos}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};