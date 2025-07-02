import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Paper,
  Alert,
  Tabs,
  Title,
  Collapse,
  Card,
  SimpleGrid,
  Tooltip,
  Modal,
  Textarea,
  Checkbox,
  ScrollArea,
  Divider,
  Box,
  ThemeIcon,
  Center,
  RingProgress,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconEdit,
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconFilter,
  IconFileX,
  IconFileAlert,
  IconWand,
  IconBulb,
  IconExclamationCircle,
  IconInfoCircle,
  IconTrash,
  IconCopy,
} from '@tabler/icons-react';

interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

interface ErrorCorrectionProps {
  errors: ImportError[];
  data: any[];
  onCorrect: (correctedData: any[]) => void;
  onSkip?: (skippedRows: number[]) => void;
  entityType?: string;
}

interface CorrectionAction {
  type: 'edit' | 'delete' | 'skip';
  row: number;
  field?: string;
  newValue?: any;
}

export const ErrorCorrection: React.FC<ErrorCorrectionProps> = ({
  errors,
  data,
  onCorrect,
  onSkip,
  entityType,
}) => {
  const [corrections, setCorrections] = useState<CorrectionAction[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('errors');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());

  // Agrupar errores por fila
  const errorsByRow = useMemo(() => {
    const grouped = new Map<number, ImportError[]>();
    errors.forEach(error => {
      const rowErrors = grouped.get(error.row) || [];
      rowErrors.push(error);
      grouped.set(error.row, rowErrors);
    });
    return grouped;
  }, [errors]);

  // Filtrar errores
  const filteredErrors = useMemo(() => {
    return errors.filter(error => {
      const matchesSearch = searchTerm === '' || 
        error.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.error.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(error.value).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = filterSeverity === 'all' || error.severity === filterSeverity;
      
      return matchesSearch && matchesSeverity;
    });
  }, [errors, searchTerm, filterSeverity]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalErrors = errors.filter(e => e.severity === 'error').length;
    const totalWarnings = errors.filter(e => e.severity === 'warning').length;
    const correctedErrors = corrections.filter(c => c.type === 'edit').length;
    const skippedRows = corrections.filter(c => c.type === 'skip').length;
    
    return {
      totalErrors,
      totalWarnings,
      correctedErrors,
      skippedRows,
      pendingErrors: totalErrors - correctedErrors - skippedRows,
    };
  }, [errors, corrections]);

  const handleEdit = useCallback((row: number, field: string, newValue: any) => {
    setCorrections(prev => {
      const filtered = prev.filter(c => !(c.row === row && c.field === field));
      return [...filtered, { type: 'edit', row, field, newValue }];
    });
    setEditingCell(null);
  }, []);

  const handleSkipRow = useCallback((row: number) => {
    setCorrections(prev => {
      const filtered = prev.filter(c => c.row !== row);
      return [...filtered, { type: 'skip', row }];
    });
  }, []);

  const handleDeleteRow = useCallback((row: number) => {
    setCorrections(prev => {
      const filtered = prev.filter(c => c.row !== row);
      return [...filtered, { type: 'delete', row }];
    });
  }, []);

  const applySuggestion = useCallback((error: ImportError) => {
    if (error.suggestion) {
      handleEdit(error.row, error.field, error.suggestion);
    }
  }, [handleEdit]);

  const applyCorrections = useCallback(() => {
    const correctedData = [...data];
    
    // Aplicar correcciones
    corrections.forEach(correction => {
      if (correction.type === 'edit' && correction.field && correction.newValue !== undefined) {
        correctedData[correction.row - 1] = {
          ...correctedData[correction.row - 1],
          [correction.field]: correction.newValue,
        };
      }
    });
    
    // Filtrar filas eliminadas o saltadas
    const rowsToRemove = new Set(
      corrections
        .filter(c => c.type === 'delete' || c.type === 'skip')
        .map(c => c.row)
    );
    
    const finalData = correctedData.filter((_, index) => !rowsToRemove.has(index + 1));
    
    onCorrect(finalData);
    
    if (onSkip) {
      const skippedRows = corrections
        .filter(c => c.type === 'skip')
        .map(c => c.row);
      onSkip(skippedRows);
    }
  }, [data, corrections, onCorrect, onSkip]);

  const bulkFixCommonErrors = useCallback(() => {
    const commonFixes: CorrectionAction[] = [];
    
    // Identificar patrones comunes y aplicar correcciones automáticas
    errors.forEach(error => {
      // Email inválido - intentar corregir formato
      if (error.field === 'email' && error.error.includes('inválido')) {
        const cleanEmail = String(error.value).trim().toLowerCase();
        if (cleanEmail.includes('@') && !cleanEmail.includes(' ')) {
          commonFixes.push({
            type: 'edit',
            row: error.row,
            field: error.field,
            newValue: cleanEmail,
          });
        }
      }
      
      // Teléfono - remover caracteres no numéricos
      if (error.field === 'telefono' && error.error.includes('formato')) {
        const cleanPhone = String(error.value).replace(/\D/g, '');
        if (cleanPhone.length >= 8) {
          commonFixes.push({
            type: 'edit',
            row: error.row,
            field: error.field,
            newValue: cleanPhone,
          });
        }
      }
      
      // Fechas - intentar parsear formato común
      if (error.field.includes('fecha') && error.error.includes('formato')) {
        const dateStr = String(error.value);
        // Intentar convertir DD/MM/YYYY a YYYY-MM-DD
        const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [_, day, month, year] = match;
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          commonFixes.push({
            type: 'edit',
            row: error.row,
            field: error.field,
            newValue: isoDate,
          });
        }
      }
    });
    
    setCorrections(prev => [...prev, ...commonFixes]);
  }, [errors]);

  const getFieldIcon = (field: string) => {
    if (field.includes('email')) return '@';
    if (field.includes('telefono') || field.includes('phone')) return '📞';
    if (field.includes('fecha') || field.includes('date')) return '📅';
    if (field.includes('nombre') || field.includes('name')) return '👤';
    return '📝';
  };

  return (
    <Stack gap="md">
      <Card withBorder>
        <Group justify="space-between">
          <Title order={3}>Corrección de errores</Title>
          <Badge size="lg" color={stats.pendingErrors > 0 ? 'red' : 'green'}>
            {stats.pendingErrors} errores pendientes
          </Badge>
        </Group>
      </Card>
      
      {/* Estadísticas */}
      <SimpleGrid cols={5} spacing="md">
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="red" variant="light">
              <IconFileX size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Errores totales</Text>
            <Text size="xl" fw={700} c="red">{stats.totalErrors}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="yellow" variant="light">
              <IconFileAlert size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Advertencias</Text>
            <Text size="xl" fw={700} c="yellow">{stats.totalWarnings}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="green" variant="light">
              <IconCheck size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Corregidos</Text>
            <Text size="xl" fw={700} c="green">{stats.correctedErrors}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="gray" variant="light">
              <IconX size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Omitidos</Text>
            <Text size="xl" fw={700} c="gray">{stats.skippedRows}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Center h="100%">
            <RingProgress
              size={80}
              thickness={8}
              sections={[
                { value: (stats.correctedErrors / stats.totalErrors) * 100, color: 'green' },
                { value: (stats.skippedRows / stats.totalErrors) * 100, color: 'gray' },
                { value: (stats.pendingErrors / stats.totalErrors) * 100, color: 'red' },
              ]}
              label={
                <Center>
                  <Text size="xs" fw={700}>
                    {Math.round(((stats.correctedErrors + stats.skippedRows) / stats.totalErrors) * 100)}%
                  </Text>
                </Center>
              }
            />
          </Center>
        </Card>
      </SimpleGrid>
      
      {/* Controles */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Group>
              <TextInput
                placeholder="Buscar errores..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                style={{ width: 300 }}
              />
              
              <Select
                placeholder="Filtrar por severidad"
                leftSection={<IconFilter size={16} />}
                value={filterSeverity}
                onChange={(value) => setFilterSeverity(value || 'all')}
                data={[
                  { value: 'all', label: 'Todos' },
                  { value: 'error', label: 'Solo errores' },
                  { value: 'warning', label: 'Solo advertencias' },
                ]}
                style={{ width: 200 }}
              />
            </Group>
            
            <Group>
              <Button
                variant="light"
                leftSection={<IconWand size={16} />}
                onClick={bulkFixCommonErrors}
              >
                Corrección automática
              </Button>
              
              <Button
                variant="light"
                leftSection={<IconBulb size={16} />}
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                Acciones masivas
              </Button>
            </Group>
          </Group>
          
          <Collapse in={showBulkActions}>
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              <Stack gap="xs">
                <Text size="sm">
                  Las acciones masivas permiten corregir automáticamente errores comunes:
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Corrección de formato de emails</li>
                  <li>Limpieza de números de teléfono</li>
                  <li>Conversión de formatos de fecha</li>
                  <li>Eliminación de espacios y caracteres especiales</li>
                </ul>
              </Stack>
            </Alert>
          </Collapse>
        </Stack>
      </Paper>
      
      {/* Tabla de errores */}
      <Paper p="md" withBorder>
        <ScrollArea style={{ height: 400 }}>
          <Table highlightOnHover>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <Checkbox
                    checked={selectedErrors.size === filteredErrors.length}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelectedErrors(new Set(filteredErrors.map(e => `${e.row}-${e.field}`)));
                      } else {
                        setSelectedErrors(new Set());
                      }
                    }}
                  />
                </th>
                <th>Fila</th>
                <th>Campo</th>
                <th>Valor actual</th>
                <th>Error</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredErrors.map((error, index) => {
                const errorKey = `${error.row}-${error.field}`;
                const isEditing = editingCell?.row === error.row && editingCell?.field === error.field;
                const correction = corrections.find(c => c.row === error.row && c.field === error.field);
                
                return (
                  <tr key={index}>
                    <td>
                      <Checkbox
                        checked={selectedErrors.has(errorKey)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedErrors);
                          if (e.currentTarget.checked) {
                            newSelected.add(errorKey);
                          } else {
                            newSelected.delete(errorKey);
                          }
                          setSelectedErrors(newSelected);
                        }}
                      />
                    </td>
                    <td>
                      <Badge variant="filled" c="gray">
                        {error.row}
                      </Badge>
                    </td>
                    <td>
                      <Group gap={4}>
                        <Text size="sm">{getFieldIcon(error.field)}</Text>
                        <Text size="sm" fw={500}>{error.field}</Text>
                      </Group>
                    </td>
                    <td>
                      {isEditing ? (
                        <Group gap="xs">
                          <TextInput
                            size="xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEdit(error.row, error.field, editValue);
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                            autoFocus
                            style={{ width: 150 }}
                          />
                          <ActionIcon
                            size="sm"
                            c="green"
                            onClick={() => handleEdit(error.row, error.field, editValue)}
                          >
                            <IconCheck size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            c="red"
                            onClick={() => setEditingCell(null)}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Group>
                      ) : (
                        <Group gap="xs">
                          <Text size="sm" style={{ textDecoration: correction ? 'line-through' : 'none' }}>
                            {String(error.value)}
                          </Text>
                          {correction && (
                            <Badge size="sm" c="green" variant="light">
                              → {correction.newValue}
                            </Badge>
                          )}
                        </Group>
                      )}
                    </td>
                    <td>
                      <Group gap={4}>
                        <Badge
                          color={error.severity === 'error' ? 'red' : 'yellow'}
                          leftSection={
                            error.severity === 'error' ? 
                              <IconExclamationCircle size={12} /> : 
                              <IconAlertCircle size={12} />
                          }
                        >
                          {error.error}
                        </Badge>
                        {error.suggestion && (
                          <Tooltip label={`Sugerencia: ${error.suggestion}`}>
                            <Badge c="blue" variant="light">
                              Sugerencia
                            </Badge>
                          </Tooltip>
                        )}
                      </Group>
                    </td>
                    <td>
                      <Group gap={4}>
                        <Tooltip label="Editar valor">
                          <ActionIcon
                            size="sm"
                            onClick={() => {
                              setEditingCell({ row: error.row, field: error.field });
                              setEditValue(String(error.value));
                            }}
                            disabled={isEditing}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        
                        {error.suggestion && (
                          <Tooltip label="Aplicar sugerencia">
                            <ActionIcon
                              size="sm"
                              c="blue"
                              onClick={() => applySuggestion(error)}
                            >
                              <IconWand size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        
                        <Tooltip label="Omitir fila">
                          <ActionIcon
                            size="sm"
                            c="gray"
                            onClick={() => handleSkipRow(error.row)}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Eliminar fila">
                          <ActionIcon
                            size="sm"
                            c="red"
                            onClick={() => handleDeleteRow(error.row)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </ScrollArea>
      </Paper>
      
      {/* Acciones finales */}
      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={() => onCorrect(data)}
        >
          Omitir correcciones
        </Button>
        
        <Button
          leftSection={<IconCheck size={16} />}
          onClick={applyCorrections}
          disabled={stats.pendingErrors > 0}
        >
          Aplicar correcciones ({stats.correctedErrors})
        </Button>
      </Group>
    </Stack>
  );
};