import { Card, Title, Grid, Select, NumberInput, Divider, Group, Text } from '@mantine/core';
import type { CalculoConfig } from '../constants/tiposCalculo';

interface ConfiguracionesAdicionalesCardProps {
  config: CalculoConfig;
  readonly: boolean;
  onConfigChange: (key: string, value: unknown) => void;
}

export function ConfiguracionesAdicionalesCard({
  config,
  readonly,
  onConfigChange,
}: ConfiguracionesAdicionalesCardProps) {
  return (
    <Card withBorder>
      <Title order={6} mb="md">
        Configuraciones Adicionales
      </Title>
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Redondeo"
            value={config.parametros?.redondeo}
            onChange={(value) => onConfigChange('redondeo', value)}
            data={[
              { value: 'ninguno', label: 'Sin redondeo' },
              { value: 'centavos', label: 'A centavos' },
              { value: 'pesos', label: 'A pesos enteros' },
            ]}
            disabled={readonly}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <NumberInput
            label="Valor Máximo (Opcional)"
            description="Límite máximo de tarifa"
            value={config.parametros?.valorMaximo}
            onChange={(value) => onConfigChange('valorMaximo', value)}
            min={0}
            disabled={readonly}
          />
        </Grid.Col>
      </Grid>
      <Divider my="md" />
      <Grid>
        <Grid.Col span={6}>
          <Group gap="xs">
            <input
              type="checkbox"
              checked={config.parametros?.aplicarIVA || false}
              onChange={(e) => onConfigChange('aplicarIVA', e.target.checked)}
              disabled={readonly}
            />
            <Text size="sm">Aplicar IVA</Text>
          </Group>
        </Grid.Col>
        {config.parametros?.aplicarIVA && (
          <Grid.Col span={6}>
            <NumberInput
              label="Porcentaje IVA"
              value={config.parametros?.porcentajeIVA}
              onChange={(value) => onConfigChange('porcentajeIVA', value)}
              min={0}
              max={100}
              suffix="%"
              disabled={readonly}
            />
          </Grid.Col>
        )}
      </Grid>
    </Card>
  );
}
