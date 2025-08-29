import React from 'react';
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Stack,
  Grid,
  Divider,
  Button,
  Group,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { IEscenarioSimulacion } from '../../../types/tarifa';

interface ClienteData {
  _id: string;
  denominacion: string;
}

interface TramoData {
  _id: string;
  denominacion: string;
}

interface FormData {
  onSubmit: (handler: (values: IEscenarioSimulacion) => void) => { onSubmit: (event: React.FormEvent) => void };
  getInputProps: (path: string) => Record<string, unknown>;
  reset: () => void;
}

interface EscenarioFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (escenario: IEscenarioSimulacion) => void;
  escenario?: IEscenarioSimulacion;
  clientes: ClienteData[];
  tramos: TramoData[];
  form: FormData;
}

const EscenarioFormModal: React.FC<EscenarioFormModalProps> = ({
  opened,
  onClose,
  onSave,
  escenario,
  clientes,
  tramos,
  form,
}) => {
  const handleSubmit = (values: IEscenarioSimulacion) => {
    onSave(values);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={escenario ? 'Editar Escenario' : 'Nuevo Escenario'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nombre del Escenario"
            placeholder="Ingresa un nombre descriptivo"
            {...form.getInputProps('nombre')}
            required
          />

          <Divider label="Contexto del Escenario" />

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Cliente"
                placeholder="Selecciona un cliente"
                data={clientes.map((c) => ({ value: c._id, label: c.denominacion }))}
                {...form.getInputProps('contexto.cliente')}
                searchable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Tramo"
                placeholder="Selecciona un tramo"
                data={tramos.map((t) => ({ value: t._id, label: t.denominacion }))}
                {...form.getInputProps('contexto.tramo')}
                searchable
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Distancia (km)"
                placeholder="0"
                {...form.getInputProps('contexto.distancia')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Cantidad de Palets"
                placeholder="0"
                {...form.getInputProps('contexto.palets')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Tipo de Vehículo"
                placeholder="Selecciona vehículo"
                data={[
                  { value: 'camion', label: 'Camión' },
                  { value: 'camioneta', label: 'Camioneta' },
                  { value: 'semi', label: 'Semirremolque' },
                ]}
                {...form.getInputProps('contexto.vehiculo')}
              />
            </Grid.Col>
          </Grid>

          <DateInput
            label="Fecha del Viaje"
            placeholder="Selecciona la fecha"
            {...form.getInputProps('contexto.fecha')}
          />

          <Divider label="Valores Base" />

          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Tarifa Base ($)"
                placeholder="0.00"
                {...form.getInputProps('valoresBase.tarifa')}
                min={0}
                decimalScale={2}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Peajes ($)"
                placeholder="0.00"
                {...form.getInputProps('valoresBase.peaje')}
                min={0}
                decimalScale={2}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Extras ($)"
                placeholder="0.00"
                {...form.getInputProps('valoresBase.extras')}
                min={0}
                decimalScale={2}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {escenario ? 'Actualizar' : 'Crear'} Escenario
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EscenarioFormModal;