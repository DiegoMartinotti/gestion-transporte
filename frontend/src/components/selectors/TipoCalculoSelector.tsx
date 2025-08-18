import React, { useState } from 'react';
import {
  Paper,
  Title,
  Group,
  Stack,
  Select,
  Card,
  Text,
  Grid,
  NumberInput,
  Textarea,
  Alert,
  Divider,
  Code,
  List,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCalculator,
  IconWeight,
  IconBox,
  IconRoad,
  IconClock,
  IconCurrency,
  IconMath,
  IconInfoCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { validateFormula } from '../../services/tarifaService';

interface TipoCalculoSelectorProps {
  value?: TipoCalculo;
  onChange?: (tipo: TipoCalculo, config: CalculoConfig) => void;
  readonly?: boolean;
  showPreview?: boolean;
}

export type TipoCalculo = 'peso' | 'volumen' | 'distancia' | 'tiempo' | 'fija' | 'formula';

export interface CalculoConfig {
  tipo: TipoCalculo;
  parametros?: {
    // Para cálculos simples
    factorMultiplicador?: number;
    valorMinimo?: number;
    valorMaximo?: number;

    // Para fórmula personalizada
    formula?: string;
    variables?: string[];

    // Para tarifa fija
    montoFijo?: number;

    // Configuraciones adicionales
    redondeo?: 'ninguno' | 'centavos' | 'pesos';
    aplicarIVA?: boolean;
    porcentajeIVA?: number;
  };
}

const TIPOS_CALCULO = [
  {
    value: 'peso',
    label: 'Por Peso (Toneladas)',
    icon: IconWeight,
    description: 'Tarifa basada en el peso de la carga',
    formula: 'peso × tarifa_por_tonelada',
    color: 'blue',
  },
  {
    value: 'volumen',
    label: 'Por Volumen (m³)',
    icon: IconBox,
    description: 'Tarifa basada en el volumen de la carga',
    formula: 'volumen × tarifa_por_m3',
    color: 'green',
  },
  {
    value: 'distancia',
    label: 'Por Distancia (Km)',
    icon: IconRoad,
    description: 'Tarifa basada en la distancia del viaje',
    formula: 'distancia × tarifa_por_km',
    color: 'orange',
  },
  {
    value: 'tiempo',
    label: 'Por Tiempo (Horas)',
    icon: IconClock,
    description: 'Tarifa basada en el tiempo de viaje',
    formula: 'tiempo × tarifa_por_hora',
    color: 'purple',
  },
  {
    value: 'fija',
    label: 'Tarifa Fija',
    icon: IconCurrency,
    description: 'Monto fijo independiente de otros factores',
    formula: 'monto_fijo',
    color: 'gray',
  },
  {
    value: 'formula',
    label: 'Fórmula Personalizada',
    icon: IconMath,
    description: 'Fórmula matemática personalizada',
    formula: 'expresión_personalizada',
    color: 'red',
  },
];

const VARIABLES_DISPONIBLES = [
  { name: 'peso', description: 'Peso de la carga en toneladas' },
  { name: 'volumen', description: 'Volumen de la carga en m³' },
  { name: 'distancia', description: 'Distancia del viaje en km' },
  { name: 'tiempo', description: 'Tiempo estimado en horas' },
  { name: 'cantidadCamiones', description: 'Número de camiones' },
  { name: 'tarifaBase', description: 'Tarifa base del tramo' },
  { name: 'factorTipoCamion', description: 'Factor según tipo de camión' },
];

// Componentes auxiliares para reducir complejidad
const CalculosSimplesConfig: React.FC<{
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  readonly: boolean;
  onConfigChange: (key: string, value: unknown) => void;
}> = ({ selectedTipo, config, readonly, onConfigChange }) => {
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
};

const TarifaFijaConfig: React.FC<{
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  readonly: boolean;
  onConfigChange: (key: string, value: unknown) => void;
}> = ({ selectedTipo, config, readonly, onConfigChange }) => {
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
};

const FormulaPersonalizadaConfig: React.FC<{
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  readonly: boolean;
  formulaError: string | null;
  formulaValid: boolean | null;
  onFormulaChange: (formula: string) => void;
}> = ({ selectedTipo, config, readonly, formulaError, formulaValid, onFormulaChange }) => {
  if (selectedTipo !== 'formula') {
    return null;
  }

  return (
    <Card withBorder>
      <Title order={6} mb="md">
        Fórmula Personalizada
      </Title>

      <Textarea
        label="Fórmula Matemática"
        description="Usa variables como: peso, volumen, distancia, tiempo, etc."
        placeholder="Ej: peso * 150 + distancia * 2.5 + (cantidadCamiones > 1 ? 500 : 0)"
        value={config.parametros?.formula || ''}
        onChange={(event) => onFormulaChange(event.currentTarget.value)}
        disabled={readonly}
        minRows={3}
        rightSection={
          formulaValid !== null && (
            <Tooltip label={formulaValid ? 'Fórmula válida' : 'Fórmula inválida'}>
              <ActionIcon color={formulaValid ? 'green' : 'red'} variant="light">
                {formulaValid ? <IconCheck size={16} /> : <IconX size={16} />}
              </ActionIcon>
            </Tooltip>
          )
        }
      />

      {formulaError && (
        <Alert color="red" mt="xs">
          <Text size="sm">{formulaError}</Text>
        </Alert>
      )}

      {formulaValid && config.parametros?.variables && (
        <Alert color="green" mt="xs">
          <Text size="sm">Variables detectadas: {config.parametros.variables.join(', ')}</Text>
        </Alert>
      )}

      <Card withBorder mt="md" bg="blue.0">
        <Group gap="xs" mb="xs">
          <IconInfoCircle size={16} />
          <Text fw={500} size="sm">
            Variables Disponibles
          </Text>
        </Group>

        <List size="sm">
          {VARIABLES_DISPONIBLES.map((variable) => (
            <List.Item key={variable.name}>
              <Code>{variable.name}</Code>: {variable.description}
            </List.Item>
          ))}
        </List>
      </Card>
    </Card>
  );
};

const getFormulaPreview = (tipo: TipoCalculo, parametros?: CalculoConfig['parametros']) => {
  const factor = parametros?.factorMultiplicador || 1;
  const monto = parametros?.montoFijo || 0;
  const formula = parametros?.formula || 'Ingrese una fórmula';

  switch (tipo) {
    case 'peso':
      return `resultado = peso × ${factor}`;
    case 'volumen':
      return `resultado = volumen × ${factor}`;
    case 'distancia':
      return `resultado = distancia × ${factor}`;
    case 'tiempo':
      return `resultado = tiempo × ${factor}`;
    case 'fija':
      return `resultado = ${monto}`;
    case 'formula':
      return formula;
    default:
      return '';
  }
};

const PreviewDetails: React.FC<{ config: CalculoConfig }> = ({ config }) => {
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
};

const VistaPrevia: React.FC<{
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  showPreview: boolean;
}> = ({ selectedTipo, config, showPreview }) => {
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
};

export const TipoCalculoSelector: React.FC<TipoCalculoSelectorProps> = ({
  value = 'peso',
  onChange,
  readonly = false,
  showPreview = true,
}) => {
  const [selectedTipo, setSelectedTipo] = useState<TipoCalculo>(value);
  const [config, setConfig] = useState<CalculoConfig>({
    tipo: value,
    parametros: {
      factorMultiplicador: 1,
      valorMinimo: 0,
      redondeo: 'pesos',
      aplicarIVA: false,
      porcentajeIVA: 21,
    },
  });

  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [formulaValid, setFormulaValid] = useState<boolean | null>(null);

  const formulaValidation = useMutation({
    mutationFn: validateFormula,
    onSuccess: (result: { valid: boolean; error?: string; variables?: string[] }) => {
      setFormulaValid(result.valid);
      setFormulaError(result.error || null);
      if (result.valid) {
        setConfig((prev) => ({
          ...prev,
          parametros: {
            ...prev.parametros,
            variables: result.variables,
          },
        }));
      }
    },
  });

  const handleTipoChange = (tipo: TipoCalculo) => {
    setSelectedTipo(tipo);
    const newConfig = {
      tipo,
      parametros: {
        factorMultiplicador: 1,
        valorMinimo: 0,
        redondeo: 'pesos' as const,
        aplicarIVA: false,
        porcentajeIVA: 21,
      },
    };
    setConfig(newConfig);
    onChange?.(tipo, newConfig);
  };

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = {
      ...config,
      parametros: {
        ...config.parametros,
        [key]: value,
      },
    };
    setConfig(newConfig);
    onChange?.(selectedTipo, newConfig);
  };

  const handleFormulaChange = (formula: string) => {
    handleConfigChange('formula', formula);
    if (formula.trim()) {
      formulaValidation.mutate(formula);
    } else {
      setFormulaValid(null);
      setFormulaError(null);
    }
  };

  const selectedTipoData = TIPOS_CALCULO.find((t) => t.value === selectedTipo);
  const SelectedIcon = selectedTipoData?.icon || IconCalculator;

  return (
    <Paper p="md">
      <Title order={5} mb="md">
        <Group gap="xs">
          <IconCalculator size={20} />
          Método de Cálculo
        </Group>
      </Title>

      <Select
        label="Tipo de Cálculo"
        value={selectedTipo}
        onChange={(value) => handleTipoChange(value as TipoCalculo)}
        data={TIPOS_CALCULO.map((tipo) => ({
          value: tipo.value,
          label: tipo.label,
        }))}
        disabled={readonly}
        mb="md"
      />

      {selectedTipoData && (
        <Card withBorder mb="md" bg={`${selectedTipoData.color}.0`}>
          <Group gap="md">
            <SelectedIcon size={32} color={selectedTipoData.color} />
            <div>
              <Text fw={500}>{selectedTipoData.label}</Text>
              <Text size="sm" c="dimmed">
                {selectedTipoData.description}
              </Text>
              <Code mt="xs">{selectedTipoData.formula}</Code>
            </div>
          </Group>
        </Card>
      )}

      <Stack gap="md">
        <CalculosSimplesConfig
          selectedTipo={selectedTipo}
          config={config}
          readonly={readonly}
          onConfigChange={handleConfigChange}
        />

        <TarifaFijaConfig
          selectedTipo={selectedTipo}
          config={config}
          readonly={readonly}
          onConfigChange={handleConfigChange}
        />

        <FormulaPersonalizadaConfig
          selectedTipo={selectedTipo}
          config={config}
          readonly={readonly}
          formulaError={formulaError}
          formulaValid={formulaValid}
          onFormulaChange={handleFormulaChange}
        />

        <Card withBorder>
          <Title order={6} mb="md">
            Configuraciones Adicionales
          </Title>

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Redondeo"
                value={config.parametros?.redondeo}
                onChange={(value) => handleConfigChange('redondeo', value)}
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
                onChange={(value) => handleConfigChange('valorMaximo', value)}
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
                  onChange={(e) => handleConfigChange('aplicarIVA', e.target.checked)}
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
                  onChange={(value) => handleConfigChange('porcentajeIVA', value)}
                  min={0}
                  max={100}
                  suffix="%"
                  disabled={readonly}
                />
              </Grid.Col>
            )}
          </Grid>
        </Card>

        <VistaPrevia selectedTipo={selectedTipo} config={config} showPreview={showPreview} />
      </Stack>
    </Paper>
  );
};
