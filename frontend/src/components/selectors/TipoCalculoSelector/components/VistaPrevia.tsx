import { Card, Title, Group, Text, Code } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { TipoCalculo, CalculoConfig } from '../constants/tiposCalculo';
import { getFormulaPreview } from '../utils/formulaHelpers';

interface VistaPreviaProps {
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  showPreview: boolean;
}

function PreviewDetails({ config }: { config: CalculoConfig }) {
  const { parametros } = config;
  if (!parametros) return null;

  return (
    <>
      {parametros.valorMinimo && (
        <Text size="xs" c="dimmed" mt="xs">
          • Valor mínimo: ${parametros.valorMinimo}
        </Text>
      )}

      {parametros.valorMaximo && (
        <Text size="xs" c="dimmed">
          • Valor máximo: ${parametros.valorMaximo}
        </Text>
      )}

      {parametros.aplicarIVA && (
        <Text size="xs" c="dimmed">
          • Se aplicará IVA del {parametros.porcentajeIVA}%
        </Text>
      )}

      <Text size="xs" c="dimmed">
        • Redondeo:{' '}
        {parametros.redondeo === 'ninguno'
          ? 'Sin redondeo'
          : parametros.redondeo === 'centavos'
            ? 'A centavos'
            : 'A pesos enteros'}
      </Text>
    </>
  );
}

export function VistaPrevia({ selectedTipo, config, showPreview }: VistaPreviaProps) {
  if (!showPreview) {
    return null;
  }

  return (
    <Card withBorder bg="gray.0">
      <Title order={6} mb="md">
        <Group gap="xs">
          <IconInfoCircle size={16} />
          Vista Previa del Cálculo
        </Group>
      </Title>

      <Code block>{getFormulaPreview(selectedTipo, config.parametros)}</Code>

      <PreviewDetails config={config} />
    </Card>
  );
}
