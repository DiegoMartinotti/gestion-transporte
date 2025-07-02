import { Stack, Text, Paper, Grid, Group, Badge, Divider } from '@mantine/core';

interface TarifaCalculatorProps {
  cliente: any;
  tramo: any;
  datos: {
    peso: number;
    volumen: number;
    distancia: number;
    vehiculos: number;
  };
  resultado: {
    montoBase: number;
    montoExtras: number;
    montoTotal: number;
    desglose?: any;
    formula?: string;
  };
}

export function TarifaCalculator({ cliente, tramo, datos, resultado }: TarifaCalculatorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  return (
    <Stack>
      <Paper p="md" withBorder>
        <Text fw={600} mb="sm">Información del Cálculo</Text>
        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">Cliente</Text>
            <Text>{cliente?.nombre || '-'}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">Tramo</Text>
            <Text>{tramo?.denominacion || '-'}</Text>
          </Grid.Col>
        </Grid>
      </Paper>

      <Paper p="md" withBorder>
        <Text fw={600} mb="sm">Datos Utilizados</Text>
        <Grid>
          <Grid.Col span={3}>
            <Text size="sm" c="dimmed">Peso</Text>
            <Text>{datos.peso} kg</Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size="sm" c="dimmed">Volumen</Text>
            <Text>{datos.volumen} m³</Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size="sm" c="dimmed">Distancia</Text>
            <Text>{datos.distancia} km</Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size="sm" c="dimmed">Vehículos</Text>
            <Text>{datos.vehiculos}</Text>
          </Grid.Col>
        </Grid>
      </Paper>

      {resultado.formula && (
        <Paper p="md" withBorder>
          <Text fw={600} mb="sm">Fórmula Aplicada</Text>
          <Badge variant="light" size="lg">
            {resultado.formula}
          </Badge>
        </Paper>
      )}

      {resultado.desglose && (
        <Paper p="md" withBorder>
          <Text fw={600} mb="sm">Desglose de Costos</Text>
          <Stack gap="xs">
            {Object.entries(resultado.desglose).map(([key, value]) => (
              <Group key={key} justify="space-between">
                <Text size="sm">{key}:</Text>
                <Text size="sm" fw={500}>{formatCurrency(value as number)}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text>Monto Base:</Text>
            <Text fw={600}>{formatCurrency(resultado.montoBase)}</Text>
          </Group>
          <Group justify="space-between">
            <Text>Extras:</Text>
            <Text fw={600}>{formatCurrency(resultado.montoExtras)}</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text size="lg" fw={700}>Total:</Text>
            <Text size="lg" fw={700} c="green">
              {formatCurrency(resultado.montoTotal)}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}