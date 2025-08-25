import React from 'react';
import { Stack, Paper, Group, Title, Button, Alert, Text } from '@mantine/core';
import { IconPlus, IconAlertTriangle } from '@tabler/icons-react';
import { UseFormReturnType } from '@mantine/form';
import { TarifaHistorica } from '../../../types';
import TramoTarifasTable from './TramoTarifasTable';

interface TramoTarifasPanelProps {
  form: UseFormReturnType<{
    tarifasHistoricas: TarifaHistorica[];
  }>;
  conflicts: Array<{
    tipo: string;
    metodoCalculo: string;
    fechaInicio: string;
    fechaFin: string;
    message: string;
  }>;
  onAddTarifa: () => void;
  onEditTarifa: (tarifa: TarifaHistorica, index: number) => void;
  onDeleteTarifa: (index: number) => void;
}

const TramoTarifasPanel: React.FC<TramoTarifasPanelProps> = ({
  form,
  conflicts,
  onAddTarifa,
  onEditTarifa,
  onDeleteTarifa,
}) => {
  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Tarifas Históricas</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={onAddTarifa} size="sm">
            Agregar Tarifa
          </Button>
        </Group>

        {conflicts.length > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            mb="md"
            title="Conflictos Detectados"
          >
            <Stack gap="xs">
              {conflicts.map((conflict, index) => (
                <Text key={index} size="sm">
                  • {conflict.message}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        {form.values.tarifasHistoricas.length === 0 ? (
          <Alert color="yellow" title="Sin tarifas">
            Este tramo no tiene tarifas configuradas. Agrega al menos una tarifa para poder calcular
            costos.
          </Alert>
        ) : (
          <TramoTarifasTable
            tarifas={form.values.tarifasHistoricas}
            onEdit={onEditTarifa}
            onDelete={onDeleteTarifa}
          />
        )}
      </Paper>
    </Stack>
  );
};

export default TramoTarifasPanel;
