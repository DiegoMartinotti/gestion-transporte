import React from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Paper,
  Text,
  Group,
  Select,
  NumberInput,
  Button,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { UseFormReturnType } from '@mantine/form';
import { IEscenarioSimulacion } from '../../../types/tarifa';
import { Cliente } from '../../../types';

interface TramoData {
  _id: string;
  origen: { nombre: string };
  destino: { nombre: string };
  distancia: number;
}

interface EscenarioModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: IEscenarioSimulacion) => void;
  form: UseFormReturnType<IEscenarioSimulacion>;
  clientes: Cliente[];
  tramos: TramoData[];
}

const EscenarioModal: React.FC<EscenarioModalProps> = ({
  opened,
  onClose,
  onSubmit,
  form,
  clientes,
  tramos,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nuevo Escenario de Simulación"
      size="lg"
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nombre del Escenario"
            placeholder="Escenario Alto Volumen"
            required
            {...form.getInputProps('nombre')}
          />

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Contexto
            </Text>

            <Group grow>
              <Select
                label="Cliente"
                placeholder="Seleccionar cliente"
                data={clientes.map((c) => ({ value: c._id, label: c.nombre }))}
                {...form.getInputProps('contexto.cliente')}
              />

              <Select
                label="Tramo"
                placeholder="Seleccionar tramo"
                data={tramos.map((t) => ({
                  value: t._id,
                  label: `${t.origen.nombre} → ${t.destino.nombre}`,
                }))}
                {...form.getInputProps('contexto.tramo')}
              />
            </Group>

            <Group grow mt="md">
              <NumberInput
                label="Distancia (km)"
                placeholder="700"
                min={0}
                {...form.getInputProps('contexto.distancia')}
              />

              <NumberInput
                label="Palets"
                placeholder="20"
                min={0}
                {...form.getInputProps('contexto.palets')}
              />
            </Group>

            <DateInput
              label="Fecha del Viaje"
              placeholder="Seleccionar fecha"
              mt="md"
              value={form.values.contexto.fecha ? new Date(form.values.contexto.fecha) : null}
              onChange={(value) =>
                form.setFieldValue(
                  'contexto.fecha',
                  value ? (value as Date).toISOString().split('T')[0] : ''
                )
              }
            />
          </Paper>

          <Paper p="md" withBorder>
            <Text fw={600} mb="md">
              Valores Base
            </Text>

            <Group grow>
              <NumberInput
                label="Tarifa Base"
                placeholder="15000"
                min={0}
                required
                {...form.getInputProps('valoresBase.tarifa')}
              />

              <NumberInput
                label="Peajes"
                placeholder="2500"
                min={0}
                {...form.getInputProps('valoresBase.peaje')}
              />

              <NumberInput
                label="Extras"
                placeholder="1000"
                min={0}
                {...form.getInputProps('valoresBase.extras')}
              />
            </Group>

            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Total:
              </Text>
              <Text fw={600}>
                $
                {(
                  (form.values.valoresBase.tarifa || 0) +
                  (form.values.valoresBase.peaje || 0) +
                  (form.values.valoresBase.extras || 0)
                ).toLocaleString()}
              </Text>
            </Group>
          </Paper>

          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit">Agregar Escenario</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EscenarioModal;