import { Card, Title, NumberInput } from '@mantine/core';
import type { TipoCalculo, CalculoConfig } from '../constants/tiposCalculo';

interface TarifaFijaConfigProps {
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  readonly: boolean;
  onConfigChange: (key: string, value: unknown) => void;
}

export function TarifaFijaConfig({
  selectedTipo,
  config,
  readonly,
  onConfigChange,
}: TarifaFijaConfigProps) {
  if (selectedTipo !== 'fija') {
    return null;
  }

  return (
    <Card withBorder>
      <Title order={6} mb="md">
        Configuración de Tarifa Fija
      </Title>
      <NumberInput
        label="Monto Fijo"
        description="Tarifa fija sin variaciones"
        value={config.parametros?.montoFijo}
        onChange={(value) => onConfigChange('montoFijo', value)}
        min={0}
        disabled={readonly}
      />
    </Card>
  );
}
