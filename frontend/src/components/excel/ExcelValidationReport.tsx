import React, { useState } from 'react';
import {
  Stack,
  Paper,
  Text,
  Alert,
  Badge,
  Group,
  Collapse,
  Button,
  Table,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Box,
  Progress,
  Divider,
  Center,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconX,
  IconInfoCircle,
  IconFileSpreadsheet,
  IconEye,
  IconDownload,
} from '@tabler/icons-react';

export interface ValidationError {
  row: number;
  column: string;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
  duplicatedRows: number[];
  missingRequiredFields: string[];
  invalidDataTypes: string[];
}

export interface ExcelValidationReportProps {
  validationErrors: ValidationError[];
  validationSummary: ValidationSummary;
  fileName?: string;
  entityType?: string;
  onFixSuggestion?: (error: ValidationError) => void;
  onDownloadErrorReport?: () => void;
  onRetry?: () => void;
  isProcessing?: boolean;
}

export const ExcelValidationReport: React.FC<ExcelValidationReportProps> = ({
  validationErrors,
  validationSummary,
  fileName = 'archivo.xlsx',
  entityType = 'datos',
  onFixSuggestion,
  onDownloadErrorReport,
  onRetry,
  isProcessing = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: false,
    summary: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const errors = validationErrors.filter(e => e.severity === 'error');
  const warnings = validationErrors.filter(e => e.severity === 'warning');
  const infos = validationErrors.filter(e => e.severity === 'info');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <IconX size={16} />;
      case 'warning':
        return <IconAlertTriangle size={16} />;
      case 'info':
        return <IconInfoCircle size={16} />;
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  const getSuccessRate = () => {
    if (validationSummary.totalRows === 0) return 0;
    return Math.round((validationSummary.validRows / validationSummary.totalRows) * 100);
  };

  const renderValidationTable = (items: ValidationError[], title: string, color: string) => {
    if (items.length === 0) return null;

    return (
      <Paper p="md" withBorder>
        <Group
          justify="space-between"
          align="center"
          style={{ cursor: 'pointer' }}
          onClick={() => toggleSection(title.toLowerCase())}
          mb="sm"
        >
          <Group gap="sm">
            <ActionIcon variant="subtle" size="sm">
              {expandedSections[title.toLowerCase()] ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </ActionIcon>
            <Text fw={500} size="sm">
              {title}
            </Text>
            <Badge color={color} variant="light" size="sm">
              {items.length}
            </Badge>
          </Group>
        </Group>

        <Collapse in={expandedSections[title.toLowerCase()]}>
          <ScrollArea h={300}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fila</Table.Th>
                  <Table.Th>Campo</Table.Th>
                  <Table.Th>Valor</Table.Th>
                  <Table.Th>Problema</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((error, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Badge size="sm" variant="outline">
                        {error.row}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {error.field}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {error.column}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={error.value ? 'inherit' : 'dimmed'}>
                        {error.value ? String(error.value) : '(vacío)'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{error.message}</Text>
                      {error.suggestion && (
                        <Text size="xs" c="dimmed" mt={2}>
                          Sugerencia: {error.suggestion}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {error.suggestion && onFixSuggestion && (
                          <Tooltip label="Aplicar sugerencia">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() => onFixSuggestion(error)}
                            >
                              <IconCheck size={12} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Ver fila en archivo">
                          <ActionIcon size="sm" variant="light" color="gray">
                            <IconEye size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Collapse>
      </Paper>
    );
  };

  if (validationErrors.length === 0 && validationSummary.validRows > 0) {
    return (
      <Paper p="md" withBorder>
        <Center>
          <Stack align="center" gap="md">
            <ThemeIcon size="xl" color="green" variant="light">
              <IconCheck size={24} />
            </ThemeIcon>
            <Box ta="center">
              <Text fw={500} size="lg" c="green">
                ¡Validación exitosa!
              </Text>
              <Text size="sm" c="dimmed">
                Todas las {validationSummary.totalRows} filas pasaron la validación
              </Text>
            </Box>
            <Button onClick={onRetry} loading={isProcessing}>
              Proceder con la importación
            </Button>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Header con información del archivo */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconFileSpreadsheet size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={500} size="sm">
                Reporte de Validación
              </Text>
              <Text size="xs" c="dimmed">
                {fileName} • {entityType}
              </Text>
            </Box>
          </Group>
          <Group gap="sm">
            {onDownloadErrorReport && (
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                size="sm"
                onClick={onDownloadErrorReport}
              >
                Descargar Reporte
              </Button>
            )}
            {onRetry && (
              <Button
                variant="light"
                size="sm"
                onClick={onRetry}
                loading={isProcessing}
                disabled={errors.length > 0}
              >
                Reintentar
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Resumen de validación */}
      <Paper p="md" withBorder>
        <Group
          justify="space-between"
          align="center"
          style={{ cursor: 'pointer' }}
          onClick={() => toggleSection('summary')}
          mb="sm"
        >
          <Text fw={500} size="sm">
            Resumen de Validación
          </Text>
          <ActionIcon variant="subtle" size="sm">
            {expandedSections.summary ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </ActionIcon>
        </Group>

        <Group gap="md" mb="md">
          <Box>
            <Text size="xs" c="dimmed">
              Tasa de éxito
            </Text>
            <Text fw={600} size="lg" c={getSuccessRate() === 100 ? 'green' : 'orange'}>
              {getSuccessRate()}%
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Filas procesadas
            </Text>
            <Text fw={500}>
              {validationSummary.totalRows}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Filas válidas
            </Text>
            <Text fw={500} c="green">
              {validationSummary.validRows}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Con errores
            </Text>
            <Text fw={500} c="red">
              {validationSummary.rowsWithErrors}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">
              Con advertencias
            </Text>
            <Text fw={500} c="yellow">
              {validationSummary.rowsWithWarnings}
            </Text>
          </Box>
        </Group>

        <Progress
          value={getSuccessRate()}
          color={getSuccessRate() === 100 ? 'green' : getSuccessRate() > 80 ? 'yellow' : 'red'}
          size="sm"
          mb="sm"
        />

        <Collapse in={expandedSections.summary}>
          <Divider my="sm" />
          <Stack gap="xs">
            {validationSummary.duplicatedRows.length > 0 && (
              <Alert
                icon={<IconAlertTriangle size={16} />}
                color="yellow"
                variant="light"
              >
                <Text size="sm">
                  Se encontraron {validationSummary.duplicatedRows.length} filas duplicadas: 
                  {validationSummary.duplicatedRows.join(', ')}
                </Text>
              </Alert>
            )}
            
            {validationSummary.missingRequiredFields.length > 0 && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
              >
                <Text size="sm">
                  Campos obligatorios faltantes: {validationSummary.missingRequiredFields.join(', ')}
                </Text>
              </Alert>
            )}
            
            {validationSummary.invalidDataTypes.length > 0 && (
              <Alert
                icon={<IconAlertTriangle size={16} />}
                color="orange"
                variant="light"
              >
                <Text size="sm">
                  Tipos de datos inválidos en: {validationSummary.invalidDataTypes.join(', ')}
                </Text>
              </Alert>
            )}
          </Stack>
        </Collapse>
      </Paper>

      {/* Errores críticos */}
      {renderValidationTable(errors, 'Errores', 'red')}

      {/* Advertencias */}
      {renderValidationTable(warnings, 'Advertencias', 'yellow')}

      {/* Información */}
      {renderValidationTable(infos, 'Información', 'blue')}

      {/* Mensaje de acción */}
      {errors.length > 0 && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          title="Se encontraron errores críticos"
        >
          <Text size="sm">
            Para continuar con la importación, debes corregir todos los errores marcados en rojo.
            Las advertencias no impiden la importación, pero es recomendable revisarlas.
          </Text>
        </Alert>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="yellow"
          title="Se encontraron advertencias"
        >
          <Text size="sm">
            Los datos pueden importarse, pero se recomienda revisar las advertencias
            para asegurar la calidad de los datos.
          </Text>
        </Alert>
      )}
    </Stack>
  );
};

export default ExcelValidationReport;