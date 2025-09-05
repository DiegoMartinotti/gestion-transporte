import { Card, Title, Grid, NumberInput } from '@mantine/core';
import type { TipoCalculo, CalculoConfig } from '../constants/tiposCalculo';

interface CalculosSimplesConfigProps {
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  readonly: boolean;
  onConfigChange: (key: string, value: unknown) => void;
}

export function CalculosSimplesConfig({
  selectedTipo,
  config,
  readonly,
  onConfigChange,
}: CalculosSimplesConfigProps) {
  if (!['peso', 'volumen', 'distancia', 'tiempo'].includes(selectedTipo)) {
    return null;
  }

  return (
    <Card withBorder>
      <Title order={6} mb="md">
        Configuración de Cálculo
      </Title>
      <Grid>
        <Grid.Col span={6}>
          <NumberInput
            label="Factor Multiplicador"
            description="Valor por unidad de medida"
            value={config.parametros?.factorMultiplicador}
            onChange={(value) => onConfigChange('factorMultiplicador', value)}
            min={0}
            step={0.01}
            disabled={readonly}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Valor Mínimo"
            description="Tarifa mínima a cobrar"
            value={config.parametros?.valorMinimo}
            onChange={(value) => onConfigChange('valorMinimo', value)}
            min={0}
            disabled={readonly}
          />
        </Grid.Col>
      </Grid>
    </Card>
  );
}
