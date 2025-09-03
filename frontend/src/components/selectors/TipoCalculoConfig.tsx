import React from 'react';
import {
  Card,
  Title,
  Grid,
  NumberInput,
  Textarea,
  Alert,
  Text,
  List,
  Code,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconInfoCircle, IconCheck, IconX } from '@tabler/icons-react';
import { CalculoConfig, TipoCalculo } from './TipoCalculoSelector';

interface TipoCalculoConfigProps {
  tipo: TipoCalculo;
  config: CalculoConfig;
  readonly?: boolean;
  formulaValid?: boolean | null;
  formulaError?: string | null;
  onConfigChange: (key: string, value: unknown) => void;
  onFormulaChange: (formula: string) => void;
}

interface ConfigComponentProps {
  config: CalculoConfig;
  readonly: boolean;
  onConfigChange: (key: string, value: unknown) => void;
}

interface FormulaConfigProps extends ConfigComponentProps {
  formulaValid?: boolean | null;
  formulaError?: string | null;
  onFormulaChange: (formula: string) => void;
}

const VARIABLES_DISPONIBLES = [
  { name: 'peso', description: 'Peso de la carga en toneladas' },
  { name: 'volumen', description: 'Volumen de la carga en m³' },
  { name: 'distancia', description: 'Distancia del viaje en km' },
  { name: 'tiempo', description: 'Tiempo estimado en horas' },
  { name: 'cantidadCamiones', description: 'Número de camiones' },
  { name: 'tarifaBase', description: 'Tarifa base del tramo' },
  { name: 'factorTipoCamion', description: 'Factor según tipo de camión' },
];

const SimpleConfig: React.FC<ConfigComponentProps> = ({ config, readonly, onConfigChange }) => (
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

const FixedConfig: React.FC<ConfigComponentProps> = ({ config, readonly, onConfigChange }) => (
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

const FormulaConfig: React.FC<FormulaConfigProps> = ({
  config,
  readonly,
  formulaValid,
  formulaError,
  onFormulaChange,
}) => (
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

export const TipoCalculoConfig: React.FC<TipoCalculoConfigProps> = ({
  tipo,
  config,
  readonly = false,
  formulaValid,
  formulaError,
  onConfigChange,
  onFormulaChange,
}) => {
  if (['peso', 'volumen', 'distancia', 'tiempo'].includes(tipo)) {
    return <SimpleConfig config={config} readonly={readonly} onConfigChange={onConfigChange} />;
  }

  if (tipo === 'fija') {
    return <FixedConfig config={config} readonly={readonly} onConfigChange={onConfigChange} />;
  }

  if (tipo === 'formula') {
    return (
      <FormulaConfig
        config={config}
        readonly={readonly}
        formulaValid={formulaValid}
        formulaError={formulaError}
        onConfigChange={onConfigChange}
        onFormulaChange={onFormulaChange}
      />
    );
  }

  return null;
};
