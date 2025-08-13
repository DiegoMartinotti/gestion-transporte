import React from 'react';
import {
  Paper,
  Text,
  Alert,
  Group,
  Collapse,
  Box,
  Progress,
  Divider,
  Stack,
  ActionIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react';
import { ValidationSummary } from './ExcelValidationReport';
import { getSuccessRate, getProgressColor } from './ExcelValidationHelpers';

interface ExcelValidationSummaryProps {
  summary: ValidationSummary;
  isExpanded: boolean;
  onToggle: () => void;
}

// Componentes auxiliares
interface SummaryHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ isExpanded, onToggle }) => (
  <Group
    justify="space-between"
    align="center"
    style={{ cursor: 'pointer' }}
    onClick={onToggle}
    mb="sm"
  >
    <Text fw={500} size="sm">
      Resumen de Validación
    </Text>
    <ActionIcon variant="subtle" size="sm">
      {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
    </ActionIcon>
  </Group>
);

interface SummaryStatsProps {
  summary: ValidationSummary;
  successRate: number;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ summary, successRate }) => (
  <Group gap="md" mb="md">
    <Box>
      <Text size="xs" c="dimmed">
        Tasa de éxito
      </Text>
      <Text fw={600} size="lg" c={successRate === 100 ? 'green' : 'orange'}>
        {successRate}%
      </Text>
    </Box>
    <Box>
      <Text size="xs" c="dimmed">
        Filas procesadas
      </Text>
      <Text fw={500}>{summary.totalRows}</Text>
    </Box>
    <Box>
      <Text size="xs" c="dimmed">
        Filas válidas
      </Text>
      <Text fw={500} c="green">
        {summary.validRows}
      </Text>
    </Box>
    <Box>
      <Text size="xs" c="dimmed">
        Con errores
      </Text>
      <Text fw={500} c="red">
        {summary.rowsWithErrors}
      </Text>
    </Box>
    <Box>
      <Text size="xs" c="dimmed">
        Con advertencias
      </Text>
      <Text fw={500} c="yellow">
        {summary.rowsWithWarnings}
      </Text>
    </Box>
  </Group>
);

interface SummaryAlertsProps {
  summary: ValidationSummary;
}

const SummaryAlerts: React.FC<SummaryAlertsProps> = ({ summary }) => (
  <Stack gap="xs">
    {summary.duplicatedRows.length > 0 && (
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
        <Text size="sm">
          Se encontraron {summary.duplicatedRows.length} filas duplicadas:
          {summary.duplicatedRows.join(', ')}
        </Text>
      </Alert>
    )}

    {summary.missingRequiredFields.length > 0 && (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        <Text size="sm">
          Campos obligatorios faltantes: {summary.missingRequiredFields.join(', ')}
        </Text>
      </Alert>
    )}

    {summary.invalidDataTypes.length > 0 && (
      <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
        <Text size="sm">Tipos de datos inválidos en: {summary.invalidDataTypes.join(', ')}</Text>
      </Alert>
    )}
  </Stack>
);

export const ExcelValidationSummaryComponent: React.FC<ExcelValidationSummaryProps> = ({
  summary,
  isExpanded,
  onToggle,
}) => {
  const successRate = getSuccessRate(summary);
  const progressColor = getProgressColor(successRate);

  return (
    <Paper p="md" withBorder>
      <SummaryHeader isExpanded={isExpanded} onToggle={onToggle} />
      <SummaryStats summary={summary} successRate={successRate} />
      <Progress value={successRate} color={progressColor} size="sm" mb="sm" />
      <Collapse in={isExpanded}>
        <Divider my="sm" />
        <SummaryAlerts summary={summary} />
      </Collapse>
    </Paper>
  );
};
