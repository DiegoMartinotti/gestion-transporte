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

const FORMULA_HANDLERS = {
  fija: (parametros: CalculoConfig['parametros']) =>
    FORMULA_TEMPLATES.fija(parametros?.montoFijo || 0),
  formula: (parametros: CalculoConfig['parametros']) =>
    FORMULA_TEMPLATES.formula(parametros?.formula || ''),
  peso: (parametros: CalculoConfig['parametros']) =>
    FORMULA_TEMPLATES.peso(parametros?.factorMultiplicador || 1),
  volumen: (parametros: CalculoConfig['parametros']) =>
    FORMULA_TEMPLATES.volumen(parametros?.factorMultiplicador || 1),
  distancia: (parametros: CalculoConfig['parametros']) =>
    FORMULA_TEMPLATES.distancia(parametros?.factorMultiplicador || 1),
  tiempo: (parametros: CalculoConfig['parametros']) =>
    FORMULA_TEMPLATES.tiempo(parametros?.factorMultiplicador || 1),
};

const getFormulaPreview = (tipo: TipoCalculo, parametros: CalculoConfig['parametros']) => {
  const handler = FORMULA_HANDLERS[tipo];
  return handler ? handler(parametros) : 'Configuración no válida';
};

const getRedondeoText = (redondeo?: string) => {
  return REDONDEO_LABELS[redondeo as keyof typeof REDONDEO_LABELS] || 'Sin redondeo';
};

const MinMaxSection: React.FC<{ parametros?: CalculoConfig['parametros'] }> = ({ parametros }) => (
  <>
    {parametros?.valorMinimo && (
      <Text size="xs" c="dimmed" mt="xs">
        • Valor mínimo: ${parametros.valorMinimo}
      </Text>
    )}
    {parametros?.valorMaximo && (
      <Text size="xs" c="dimmed">
        • Valor máximo: ${parametros.valorMaximo}
      </Text>
    )}
  </>
);

const IvaSection: React.FC<{ parametros?: CalculoConfig['parametros'] }> = ({ parametros }) => (
  <>
    {parametros?.aplicarIVA && (
      <Text size="xs" c="dimmed">
        • Se aplicará IVA del {parametros.porcentajeIVA}%
      </Text>
    )}
  </>
);

export const TipoCalculoPreview: React.FC<PreviewProps> = ({ tipo, config }) => {
  return (
    <Card withBorder bg="gray.0">
      <Title order={6} mb="md">
        <Group gap="xs">
          <IconInfoCircle size={16} />
          Vista Previa del Cálculo
        </Group>
      </Title>

      <Code block>{getFormulaPreview(tipo, config.parametros)}</Code>

      <MinMaxSection parametros={config.parametros} />
      <IvaSection parametros={config.parametros} />

      <Text size="xs" c="dimmed">
        • Redondeo: {getRedondeoText(config.parametros?.redondeo)}
      </Text>
    </Card>
  );
};
