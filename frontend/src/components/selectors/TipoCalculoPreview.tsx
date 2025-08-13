import React from 'react';
import { Card, Title, Group, Code, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { CalculoConfig, TipoCalculo } from './TipoCalculoSelector';

interface PreviewProps {
  tipo: TipoCalculo;
  config: CalculoConfig;
}

const FORMULA_TEMPLATES = {
  peso: (factor: number) => `resultado = peso × ${factor}`,
  volumen: (factor: number) => `resultado = volumen × ${factor}`,
  distancia: (factor: number) => `resultado = distancia × ${factor}`,
  tiempo: (factor: number) => `resultado = tiempo × ${factor}`,
  fija: (monto: number) => `resultado = ${monto}`,
  formula: (formula: string) => formula || 'Ingrese una fórmula',
};

const REDONDEO_LABELS = {
  ninguno: 'Sin redondeo',
  centavos: 'A centavos',
  pesos: 'A pesos enteros',
};

export const TipoCalculoPreview: React.FC<PreviewProps> = ({ tipo, config }) => {
  const getPreviewFormula = () => {
    const template = FORMULA_TEMPLATES[tipo];
    if (!template) return 'Configuración no válida';

    if (tipo === 'fija') {
      return template(config.parametros?.montoFijo || 0);
    }
    if (tipo === 'formula') {
      return template(config.parametros?.formula || '');
    }
    return template(config.parametros?.factorMultiplicador || 1);
  };

  const getRedondeoText = () => {
    return (
      REDONDEO_LABELS[config.parametros?.redondeo as keyof typeof REDONDEO_LABELS] || 'Sin redondeo'
    );
  };

  return (
    <Card withBorder bg="gray.0">
      <Title order={6} mb="md">
        <Group gap="xs">
          <IconInfoCircle size={16} />
          Vista Previa del Cálculo
        </Group>
      </Title>

      <Code block>{getPreviewFormula()}</Code>

      {config.parametros?.valorMinimo && (
        <Text size="xs" c="dimmed" mt="xs">
          • Valor mínimo: ${config.parametros.valorMinimo}
        </Text>
      )}

      {config.parametros?.valorMaximo && (
        <Text size="xs" c="dimmed">
          • Valor máximo: ${config.parametros.valorMaximo}
        </Text>
      )}

      {config.parametros?.aplicarIVA && (
        <Text size="xs" c="dimmed">
          • Se aplicará IVA del {config.parametros.porcentajeIVA}%
        </Text>
      )}

      <Text size="xs" c="dimmed">
        • Redondeo: {getRedondeoText()}
      </Text>
    </Card>
  );
};
