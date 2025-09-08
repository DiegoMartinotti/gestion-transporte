import React from 'react';
import { Modal, Stack, Text, Grid, Paper, Group, Divider, Badge } from '@mantine/core';
import { IResultadoSimulacion } from '../../../types/tarifa';

interface DetalleResultadoModalProps {
  opened: boolean;
  onClose: () => void;
  resultado: IResultadoSimulacion | null;
}

const formatCurrency = (value: number): string => `$${value.toLocaleString()}`;

const getColorByDifference = (difference: number): string | undefined => {
  if (difference === 0) return undefined;
  return difference > 0 ? 'red' : 'green';
};

interface ValoresSectionProps {
  title: string;
  valores: {
    tarifa: number;
    peaje: number;
    extras: number;
    total: number;
  };
  diferencia?: {
    tarifa: number;
    total: number;
  };
}

const ValoresSection: React.FC<ValoresSectionProps> = ({ title, valores, diferencia }) => (
  <Paper p="md" withBorder>
    <Text fw={600} mb="sm">
      {title}
    </Text>
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm">Tarifa:</Text>
        <Text c={diferencia ? getColorByDifference(diferencia.tarifa) : undefined}>
          {formatCurrency(valores.tarifa)}
        </Text>
      </Group>
      <Group justify="space-between">
        <Text size="sm">Peajes:</Text>
        <Text>{formatCurrency(valores.peaje)}</Text>
      </Group>
      <Group justify="space-between">
        <Text size="sm">Extras:</Text>
        <Text>{formatCurrency(valores.extras)}</Text>
      </Group>
      <Divider />
      <Group justify="space-between">
        <Text fw={600}>Total:</Text>
        <Text fw={600} c={diferencia ? getColorByDifference(diferencia.total) : undefined}>
          {formatCurrency(valores.total)}
        </Text>
      </Group>
    </Stack>
  </Paper>
);

interface ReglasAplicadasSectionProps {
  reglas: Array<{
    nombre: string;
    codigo: string;
    modificacion: number;
  }>;
}

const ReglasAplicadasSection: React.FC<ReglasAplicadasSectionProps> = ({ reglas }) => {
  if (reglas.length === 0) return null;

  return (
    <Paper p="md" withBorder>
      <Text fw={600} mb="sm">
        Reglas Aplicadas
      </Text>
      <Stack gap="xs">
        {reglas.map((regla, index) => (
          <Group key={index} justify="space-between" p="sm" bg="gray.0">
            <div>
              <Text fw={600} size="sm">
                {regla.nombre}
              </Text>
              <Text size="xs" c="dimmed">
                {regla.codigo}
              </Text>
            </div>
            <Badge color={getColorByDifference(regla.modificacion) || 'gray'} variant="light">
              {regla.modificacion > 0 ? '+' : ''}
              {formatCurrency(regla.modificacion)}
            </Badge>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
};

interface ResumenDiferenciasSectionProps {
  diferencia: {
    total: number;
    porcentaje: number;
  };
}

const ResumenDiferenciasSection: React.FC<ResumenDiferenciasSectionProps> = ({ diferencia }) => (
  <Paper p="md" withBorder>
    <Text fw={600} mb="sm">
      Resumen de Diferencias
    </Text>
    <Group justify="space-between">
      <Text>Diferencia Total:</Text>
      <Text fw={600} c={getColorByDifference(diferencia.total)}>
        {diferencia.total > 0 ? '+' : ''}
        {formatCurrency(diferencia.total)}({diferencia.porcentaje > 0 ? '+' : ''}
        {diferencia.porcentaje.toFixed(2)}%)
      </Text>
    </Group>
  </Paper>
);

const DetalleResultadoModal: React.FC<DetalleResultadoModalProps> = ({
  opened,
  onClose,
  resultado,
}) => {
  if (!resultado) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Detalle del Resultado" size="lg">
      <Stack gap="md">
        <Text fw={600} size="lg">
          {resultado.escenario}
        </Text>

        <Grid>
          <Grid.Col span={6}>
            <ValoresSection title="Valores Originales" valores={resultado.valoresOriginales} />
          </Grid.Col>
          <Grid.Col span={6}>
            <ValoresSection
              title="Valores Finales"
              valores={resultado.valoresFinales}
              diferencia={resultado.diferencia}
            />
          </Grid.Col>
        </Grid>

        <ReglasAplicadasSection reglas={resultado.reglasAplicadas} />
        <ResumenDiferenciasSection diferencia={resultado.diferencia} />
      </Stack>
    </Modal>
  );
};

export default DetalleResultadoModal;
