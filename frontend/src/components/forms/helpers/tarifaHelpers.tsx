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

export function renderPreview(values: Record<string, unknown>) {
  return (
    <Paper p="md" withBorder bg="gray.0">
      <Text size="sm" fw={500} mb="xs">
        Vista Previa:
      </Text>
      <Group gap="xs">
        <Badge color={values.tipo === 'TRMC' ? 'blue' : 'green'}>{values.tipo}</Badge>
        <Badge color="gray">{values.metodoCalculo}</Badge>
        <Text size="sm">Valor: ${values.valor}</Text>
        {values.valorPeaje > 0 && <Text size="sm">Peaje: ${values.valorPeaje}</Text>}
      </Group>
      {values.vigenciaDesde && values.vigenciaHasta && (
        <Text size="xs" c="dimmed" mt="xs">
          Vigente desde {values.vigenciaDesde.toLocaleDateString()} hasta{' '}
          {values.vigenciaHasta.toLocaleDateString()}
        </Text>
      )}
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
