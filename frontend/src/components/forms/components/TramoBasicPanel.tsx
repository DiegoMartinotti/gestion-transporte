import React from 'react';
import { Paper, Title, Group, Grid, Select, NumberInput, Button, Text } from '@mantine/core';
import { IconRoute, IconMapPin, IconRoad, IconCalculator } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { Cliente, Site, TarifaHistorica } from '../../../types';

interface TramoBasicPanelProps {
  form: UseFormReturnType<{
    cliente: string;
    origen: string;
    destino: string;
    distancia: number;
    tarifasHistoricas: TarifaHistorica[];
  }>;
  clientes: Cliente[];
  sitesFiltered: Site[];
  calculatingDistance: boolean;
  onCalculateDistance: () => void;
}

const TramoBasicPanel: React.FC<TramoBasicPanelProps> = ({
  form,
  clientes,
  sitesFiltered,
  calculatingDistance,
  onCalculateDistance,
}) => {
  const origenSite = sitesFiltered.find((s) => s._id === form.values.origen);
  const destinoSite = sitesFiltered.find((s) => s._id === form.values.destino);

  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">
        <Group>
          <IconRoute size={20} />
          Información del Tramo
        </Group>
      </Title>

      <Grid>
        <Grid.Col span={12}>
          <Select
            label="Cliente"
            placeholder="Selecciona un cliente"
            data={clientes.map((c) => ({ value: c._id, label: c.nombre }))}
            {...form.getInputProps('cliente')}
            searchable
            required
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <Select
            label="Origen"
            placeholder="Selecciona origen"
            data={sitesFiltered.map((s) => ({
              value: s._id,
              label: `${s.nombre} - ${s.direccion || 'Sin dirección'}`,
            }))}
            {...form.getInputProps('origen')}
            searchable
            required
            disabled={!form.values.cliente}
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <Select
            label="Destino"
            placeholder="Selecciona destino"
            data={sitesFiltered
              .filter((s) => s._id !== form.values.origen)
              .map((s) => ({
                value: s._id,
                label: `${s.nombre} - ${s.direccion || 'Sin dirección'}`,
              }))}
            {...form.getInputProps('destino')}
            searchable
            required
            disabled={!form.values.cliente}
          />
        </Grid.Col>

        {origenSite && destinoSite && (
          <Grid.Col span={12}>
            <Paper p="sm" withBorder bg="gray.0">
              <Group justify="space-between">
                <Group>
                  <IconMapPin size={16} color="green" />
                  <Text size="sm">{origenSite.nombre}</Text>
                  <IconRoad size={16} />
                  <IconMapPin size={16} color="red" />
                  <Text size="sm">{destinoSite.nombre}</Text>
                </Group>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconCalculator size={14} />}
                  onClick={onCalculateDistance}
                  loading={calculatingDistance}
                >
                  Calcular Distancia
                </Button>
              </Group>
            </Paper>
          </Grid.Col>
        )}

        <Grid.Col span={6}>
          <NumberInput
            label="Distancia (km)"
            placeholder="Distancia en kilómetros"
            min={0}
            step={0.1}
            decimalScale={1}
            {...form.getInputProps('distancia')}
            required
          />
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

export default TramoBasicPanel;
