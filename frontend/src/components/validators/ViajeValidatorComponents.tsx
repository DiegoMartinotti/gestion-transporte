import React from 'react';
import {
  Grid,
  Badge,
  Group,
  Stack,
  Text,
  Alert,
  Card,
  List,
  ThemeIcon,
  Progress,
  Divider,
  ActionIcon,
  Box,
  Title,
} from '@mantine/core';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconExclamationMark,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { ValidationRule, ValidationUtils } from './BaseValidator';
import { ViajeData } from './ViajeValidatorHelpers';

export interface ValidationSummaryType {
  totalRules: number;
  passedRules: number;
  score: number;
  canSave: boolean;
  canSubmit: boolean;
  errors: { message: string; suggestion?: string }[];
  warnings: { message: string; suggestion?: string }[];
}

// Componente de resumen de validación
export const ValidationSummaryCards: React.FC<{ validationSummary: ValidationSummaryType }> = ({
  validationSummary,
}) => (
  <Grid mb="md">
    <Grid.Col span={3}>
      <Card withBorder ta="center">
        <Text size="sm" c="dimmed">
          Total
        </Text>
        <Text size="lg" fw={600}>
          {validationSummary.totalRules}
        </Text>
        <Text size="xs">Reglas</Text>
      </Card>
    </Grid.Col>

    <Grid.Col span={3}>
      <Card withBorder ta="center">
        <Text size="sm" c="dimmed">
          Pasadas
        </Text>
        <Text size="lg" fw={600} c="green">
          {validationSummary.passedRules}
        </Text>
        <Text size="xs">Validaciones</Text>
      </Card>
    </Grid.Col>

    <Grid.Col span={3}>
      <Card withBorder ta="center">
        <Text size="sm" c="dimmed">
          Errores
        </Text>
        <Text size="lg" fw={600} c="red">
          {validationSummary.errors.length}
        </Text>
        <Text size="xs">Críticos</Text>
      </Card>
    </Grid.Col>

    <Grid.Col span={3}>
      <Card withBorder ta="center">
        <Text size="sm" c="dimmed">
          Advertencias
        </Text>
        <Text size="lg" fw={600} c="yellow">
          {validationSummary.warnings.length}
        </Text>
        <Text size="xs">Menores</Text>
      </Card>
    </Grid.Col>
  </Grid>
);

// Componente de alertas de validación
export const ValidationAlerts: React.FC<{ validationSummary: ValidationSummaryType }> = ({
  validationSummary,
}) => (
  <>
    {validationSummary.errors.length > 0 && (
      <Alert color="red" icon={<IconX size={16} />} mb="md">
        <Text fw={500} mb="xs">
          Errores que deben corregirse:
        </Text>
        <List size="sm">
          {validationSummary.errors.map((error, index: number) => (
            <List.Item key={index}>
              {error.message}
              {error.suggestion && (
                <Text size="xs" c="dimmed" ml="md">
                  💡 {error.suggestion}
                </Text>
              )}
            </List.Item>
          ))}
        </List>
      </Alert>
    )}

    {validationSummary.warnings.length > 0 && (
      <Alert color="yellow" icon={<IconAlertTriangle size={16} />} mb="md">
        <Text fw={500} mb="xs">
          Advertencias:
        </Text>
        <List size="sm">
          {validationSummary.warnings.map((warning, index: number) => (
            <List.Item key={index}>
              {warning.message}
              {warning.suggestion && (
                <Text size="xs" c="dimmed" ml="md">
                  💡 {warning.suggestion}
                </Text>
              )}
            </List.Item>
          ))}
        </List>
      </Alert>
    )}
  </>
);

// Componente de detalles de validación
export const ValidationDetails: React.FC<{
  validationRules: ValidationRule<ViajeData>[];
  validationResults: Record<string, { passed: boolean; message: string }>;
}> = ({ validationRules, validationResults }) => (
  <Card withBorder>
    <Title order={5} mb="md">
      Detalles de Validación
    </Title>

    <Stack gap="md">
      {Object.entries(
        validationRules.reduce(
          (acc, rule) => {
            if (!acc[rule.category]) {
              acc[rule.category] = [];
            }
            acc[rule.category].push(rule);
            return acc;
          },
          {} as Record<string, ValidationRule<ViajeData>[]>
        )
      ).map(([category, rules]) => (
        <Box key={category}>
          <Group mb="xs">
            <ThemeIcon size="sm" variant="light">
              {ValidationUtils.getCategoryIcon(category)}
            </ThemeIcon>
            <Text fw={500}>{category}</Text>
          </Group>

          <Stack gap="xs" pl="md">
            {rules.map((rule) => {
              const result = validationResults[rule.id];
              if (!result) return null;

              return (
                <Group key={rule.id} justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon
                      size="xs"
                      color={result.passed ? 'green' : rule.severity === 'error' ? 'red' : 'yellow'}
                      variant="light"
                    >
                      {result.passed ? <IconCheck size={12} /> : <IconX size={12} />}
                    </ThemeIcon>
                    <Text size="sm">{rule.name}</Text>
                  </Group>
                  <Text size="sm" c={result.passed ? 'green' : 'dimmed'}>
                    {result.message}
                  </Text>
                </Group>
              );
            })}
          </Stack>

          <Divider mt="sm" />
        </Box>
      ))}
    </Stack>
  </Card>
);

// Componente del header del validador
export const ValidatorHeader: React.FC<{
  validationSummary: ValidationSummaryType;
  showDetails: boolean;
  detailsOpened: boolean;
  toggleDetails: () => void;
}> = ({ validationSummary, showDetails, detailsOpened, toggleDetails }) => (
  <>
    <Group justify="space-between" mb="md">
      <Title order={4}>
        <Group gap="xs">
          <IconShieldCheck size={20} />
          Validador de Viajes
        </Group>
      </Title>
      <Group gap="sm">
        <Badge
          size="lg"
          color={ValidationUtils.getScoreColor(validationSummary.score)}
          variant="light"
        >
          {validationSummary.score.toFixed(0)}% Válido
        </Badge>
        {showDetails && (
          <ActionIcon variant="subtle" onClick={toggleDetails} aria-label="Toggle details">
            {detailsOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>
    </Group>

    <ValidationSummaryCards validationSummary={validationSummary} />

    {/* Barra de progreso */}
    <Box mb="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          Progreso de Validación
        </Text>
        <Text size="sm" c="dimmed">
          {validationSummary.passedRules}/{validationSummary.totalRules}
        </Text>
      </Group>
      <Progress
        value={validationSummary.score}
        color={ValidationUtils.getScoreColor(validationSummary.score)}
        size="lg"
      />
    </Box>

    {/* Estado de guardado */}
    <Group mb="md">
      <Badge
        color={validationSummary.canSave ? 'green' : 'red'}
        variant="light"
        leftSection={validationSummary.canSave ? <IconCheck size={12} /> : <IconX size={12} />}
      >
        {validationSummary.canSave ? 'Puede guardar' : 'No puede guardar'}
      </Badge>

      <Badge
        color={validationSummary.canSubmit ? 'green' : 'orange'}
        variant="light"
        leftSection={
          validationSummary.canSubmit ? <IconCheck size={12} /> : <IconExclamationMark size={12} />
        }
      >
        {validationSummary.canSubmit ? 'Puede enviar' : 'No puede enviar'}
      </Badge>
    </Group>
  </>
);
