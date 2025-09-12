import React from 'react';
import { UseFormReturnType } from '@mantine/form';
import {
  Stack,
  Grid,
  Button,
  Group,
  Select,
  NumberInput,
  Alert,
  Text,
  Paper,
  Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { TIPO_OPTIONS, METODO_CALCULO_OPTIONS } from '../constants/tarifaConstants';

export function renderConflictAlerts(conflicts: string[], isValid: boolean) {
  return (
    <>
      {conflicts.length > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Conflictos Detectados">
          <Stack gap="xs">
            {conflicts.map((conflict, index) => (
              <Text key={index} size="sm">
                • {conflict}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      {conflicts.length === 0 && isValid && (
        <Alert icon={<IconCheck size={16} />} color="green" title="Sin conflictos">
          Esta tarifa no tiene conflictos con las tarifas existentes.
        </Alert>
      )}
    </>
  );
}

export function renderFormFields(form: UseFormReturnType<Record<string, unknown>>) {
  return (
    <Grid>
      <Grid.Col span={6}>
        <Select
          label="Tipo de Tarifa"
          placeholder="Selecciona el tipo"
          data={TIPO_OPTIONS}
          {...form.getInputProps('tipo')}
          required
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <Select
          label="Método de Cálculo"
          placeholder="Selecciona el método"
          data={METODO_CALCULO_OPTIONS}
          {...form.getInputProps('metodoCalculo')}
          required
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <NumberInput
          label="Valor Base"
          placeholder="0.00"
          min={0}
          step={0.01}
          decimalScale={2}
          prefix="$"
          {...form.getInputProps('valor')}
          required
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <NumberInput
          label="Valor Peaje"
          placeholder="0.00"
          min={0}
          step={0.01}
          decimalScale={2}
          prefix="$"
          {...form.getInputProps('valorPeaje')}
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <DateInput
          label="Vigencia Desde"
          placeholder="Fecha de inicio"
          {...form.getInputProps('vigenciaDesde')}
          required
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <DateInput
          label="Vigencia Hasta"
          placeholder="Fecha de fin"
          {...form.getInputProps('vigenciaHasta')}
          required
        />
      </Grid.Col>
    </Grid>
  );
}

function toDateString(v: unknown): string {
  if (v instanceof Date) return v.toLocaleDateString();
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  }
  return '';
}

function PreviewBadges({ values }: { values: Record<string, unknown> }) {
  const tipo = String(values.tipo ?? '');
  const metodoCalculo = String(values.metodoCalculo ?? '');
  const valor = String(values.valor ?? '');
  const valorPeaje = Number(values.valorPeaje ?? 0);
  const showPeaje = valorPeaje > 0;

  return (
    <Group gap="xs">
      <Badge color={tipo === 'TRMC' ? 'blue' : 'green'}>{tipo}</Badge>
      <Badge color="gray">{metodoCalculo}</Badge>
      <Text size="sm">Valor: ${valor}</Text>
      {showPeaje ? <Text size="sm">Peaje: ${String(values.valorPeaje ?? '')}</Text> : null}
    </Group>
  );
}

function PreviewDates({ values }: { values: Record<string, unknown> }) {
  const desde = toDateString(values.vigenciaDesde);
  const hasta = toDateString(values.vigenciaHasta);
  if (!desde || !hasta) return null;
  return (
    <Text size="xs" c="dimmed" mt="xs">
      Vigente desde {desde} hasta {hasta}
    </Text>
  );
}

export function renderPreview(values: Record<string, unknown>) {
  return (
    <Paper p="md" withBorder bg="gray.0">
      <Text size="sm" fw={500} mb="xs">
        Vista Previa:
      </Text>
      <PreviewBadges values={values} />
      <PreviewDates values={values} />
    </Paper>
  );
}

export function renderActions(
  onCancel: () => void,
  tarifa: Record<string, unknown>,
  isValid: boolean,
  conflicts: string[]
) {
  return (
    <Group justify="flex-end">
      <Button variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={!isValid || conflicts.length > 0}>
        {tarifa ? 'Actualizar' : 'Agregar'} Tarifa
      </Button>
    </Group>
  );
}
