import React from 'react';
import { Paper, Title, Group, Button } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { EstadoPartida } from '../../types/ordenCompra';
import { usePartidaCalculator } from './hooks/usePartidaCalculator';
import {
  EstadisticasGrid,
  ProgressSection,
  EstadosCategorias,
  AlertasVencimientos,
  DetallePartidas,
} from './components/PartidaComponents';

interface PartidaData {
  numero: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaVencimiento?: Date;
}

interface PartidaCalculatorProps {
  partidas: PartidaData[];
  onStateChange?: (partidaNumero: string, nuevoEstado: EstadoPartida) => void;
  readonly?: boolean;
}

export const PartidaCalculator: React.FC<PartidaCalculatorProps> = ({
  partidas,
  onStateChange,
  readonly = false,
}) => {
  const { estadisticas, actualizarEstadosAutomatico } = usePartidaCalculator(
    partidas,
    onStateChange
  );

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconCalculator size={20} />
          <Title order={4}>Calculadora de Partidas</Title>
        </Group>
        {!readonly && (
          <Button variant="light" size="sm" onClick={actualizarEstadosAutomatico}>
            Recalcular Estados
          </Button>
        )}
      </Group>

      <EstadisticasGrid estadisticas={estadisticas} />
      <ProgressSection estadisticas={estadisticas} />
      <EstadosCategorias estadisticas={estadisticas} />
      <AlertasVencimientos estadisticas={estadisticas} />

      <Title order={5} mb="sm">
        Detalle por Partida
      </Title>
      <DetallePartidas partidas={partidas} readonly={readonly} onStateChange={onStateChange} />
    </Paper>
  );
};
