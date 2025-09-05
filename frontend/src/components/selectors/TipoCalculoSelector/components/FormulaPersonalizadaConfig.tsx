import {
  Card,
  Title,
  Textarea,
  Alert,
  Text,
  Group,
  List,
  Code,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { IconInfoCircle, IconCheck, IconX } from '@tabler/icons-react';
import {
  VARIABLES_DISPONIBLES,
  type TipoCalculo,
  type CalculoConfig,
} from '../constants/tiposCalculo';

interface FormulaPersonalizadaConfigProps {
  selectedTipo: TipoCalculo;
  config: CalculoConfig;
  readonly: boolean;
  formulaError: string | null;
  formulaValid: boolean | null;
  onFormulaChange: (formula: string) => void;
}

export function FormulaPersonalizadaConfig({
  selectedTipo,
  config,
  readonly,
  formulaError,
  formulaValid,
  onFormulaChange,
}: FormulaPersonalizadaConfigProps) {
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
}
