import type { ComponentProps } from 'react';
import { Grid, Stack, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import { ClienteSelector } from '../../../components/selectors/ClienteSelector';
import { TramoSelector } from '../../../components/selectors/TramoSelector';
import { ViajeFormData } from '../../../types/viaje';
import type { Cliente } from '../../../types/cliente';
import type { Tramo } from '../../../types';

type ClienteSelectorWithDataProps = ComponentProps<typeof ClienteSelector> & {
  readonly data?: Cliente[];
};

type TramoSelectorWithDataProps = ComponentProps<typeof TramoSelector> & {
  readonly data?: Tramo[];
};

const ClienteSelectorWithData = ClienteSelector as (
  props: ClienteSelectorWithDataProps
) => ReturnType<typeof ClienteSelector>;

const TramoSelectorWithData = TramoSelector as (
  props: TramoSelectorWithDataProps
) => ReturnType<typeof TramoSelector>;

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

  const resolveErrorMessage = (error: unknown): string | undefined =>
    typeof error === 'string' ? error : undefined;

  const normalizeSelectValue = (value: string | null) => value ?? '';

  let fechaValue: string | null = null;
  const rawFecha = form.values.fecha;
  if (rawFecha instanceof Date) {
    fechaValue = rawFecha.toISOString().split('T')[0];
  } else if (rawFecha) {
    const parsedFecha = new Date(rawFecha);
    fechaValue = Number.isNaN(parsedFecha.getTime())
      ? null
      : parsedFecha.toISOString().split('T')[0];
  }

  return (
    <Stack>
      <Grid>
        <Grid.Col span={6}>
          <DateInput
            label="Fecha del Viaje"
            placeholder="Seleccionar fecha"
            value={fechaValue}
            onChange={(value: string | null) => {
              if (value) {
                form.setFieldValue('fecha', new Date(value));
              }
            }}
            error={resolveErrorMessage(form.errors.fecha)}
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
          <ClienteSelectorWithData
            value={form.values.cliente || null}
            onChange={(value) => form.setFieldValue('cliente', normalizeSelectValue(value))}
            error={resolveErrorMessage(form.errors.cliente)}
            required
            data={clientes}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TramoSelectorWithData
            value={form.values.tramo || null}
            onChange={(value) => form.setFieldValue('tramo', normalizeSelectValue(value))}
            error={resolveErrorMessage(form.errors.tramo)}
            required
            data={tramos}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
