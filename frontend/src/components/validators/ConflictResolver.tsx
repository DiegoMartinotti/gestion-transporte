import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Alert,
  Stack,
  Badge,
  Group,
  ActionIcon,
  Collapse,
  Card,
  Title,
  Button,
  Modal,
  Select,
  TextInput,
  Textarea,
  Table,
  Checkbox,
  Tooltip,
  NumberInput,
  Switch,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconTrash,
  IconGitMerge,
  IconSettings,
  IconWand,
} from '@tabler/icons-react';

interface Conflict {
  id: string;
  type: 'duplicate' | 'inconsistent' | 'missing_reference' | 'data_mismatch';
  severity: 'high' | 'medium' | 'low';
  entityType: string;
  affectedRecords: any[];
  description: string;
  suggestedResolution?: ResolutionStrategy;
  autoResolvable: boolean;
}

interface ResolutionStrategy {
  type: 'merge' | 'keep_first' | 'keep_last' | 'manual_edit' | 'delete' | 'ignore' | 'replace';
  description: string;
  parameters?: Record<string, any>;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolveConflict?: (conflictId: string, resolution: ResolutionStrategy, data?: any) => void;
  onBulkResolve?: (resolutions: Array<{ conflictId: string; resolution: ResolutionStrategy; data?: any }>) => void;
  allowBulkActions?: boolean;
}

const resolutionStrategies: Record<string, ResolutionStrategy[]> = {
  duplicate: [
    {
      type: 'merge',
      description: 'Combinar registros duplicados manteniendo todos los datos únicos',
    },
    {
      type: 'keep_first',
      description: 'Mantener el primer registro y eliminar los duplicados',
    },
    {
      type: 'keep_last',
      description: 'Mantener el último registro y eliminar los duplicados',
    },
    {
      type: 'manual_edit',
      description: 'Editar manualmente los registros conflictivos',
    },
  ],
  inconsistent: [
    {
      type: 'manual_edit',
      description: 'Corregir manualmente los datos inconsistentes',
    },
    {
      type: 'ignore',
      description: 'Ignorar la inconsistencia (no recomendado)',
    },
  ],
  missing_reference: [
    {
      type: 'delete',
      description: 'Eliminar registros con referencias faltantes',
    },
    {
      type: 'manual_edit',
      description: 'Corregir manualmente las referencias',
    },
    {
      type: 'ignore',
      description: 'Importar sin validar referencias (riesgo de integridad)',
    },
  ],
  data_mismatch: [
    {
      type: 'replace',
      description: 'Reemplazar con datos corregidos',
    },
    {
      type: 'manual_edit',
      description: 'Editar manualmente los valores incorrectos',
    },
  ],
};

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflicts,
  onResolveConflict,
  onBulkResolve,
  allowBulkActions = true,
}) => {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [resolutionModal, setResolutionModal] = useState<{
    conflict: Conflict | null;
    strategy: ResolutionStrategy | null;
  }>({ conflict: null, strategy: null });
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkStrategy, setBulkStrategy] = useState<ResolutionStrategy | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  const toggleConflictExpansion = (conflictId: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedConflicts(newExpanded);
  };

  const openResolutionModal = (conflict: Conflict, strategy: ResolutionStrategy) => {
    setResolutionModal({ conflict, strategy });
    
    // Preparar datos para edición si es necesario
    if (strategy.type === 'manual_edit' || strategy.type === 'merge') {
      if (conflict.affectedRecords.length > 0) {
        setEditingData(conflict.affectedRecords[0]);
      }
    }
  };

  const closeResolutionModal = () => {
    setResolutionModal({ conflict: null, strategy: null });
    setEditingData({});
  };

  const handleResolveConflict = () => {
    const { conflict, strategy } = resolutionModal;
    if (!conflict || !strategy) return;

    let resolutionData = undefined;
    
    if (strategy.type === 'manual_edit' || strategy.type === 'merge') {
      resolutionData = editingData;
    }

    onResolveConflict?.(conflict.id, strategy, resolutionData);
    closeResolutionModal();
  };

  const handleBulkSelection = (conflictId: string, selected: boolean) => {
    const newSelection = new Set(bulkSelection);
    if (selected) {
      newSelection.add(conflictId);
    } else {
      newSelection.delete(conflictId);
    }
    setBulkSelection(newSelection);
  };

  const handleBulkResolve = () => {
    if (!bulkStrategy || bulkSelection.size === 0) return;

    const resolutions = Array.from(bulkSelection).map(conflictId => ({
      conflictId,
      resolution: bulkStrategy,
    }));

    onBulkResolve?.(resolutions);
    setBulkSelection(new Set());
    setBulkStrategy(null);
  };

  const autoResolveAll = () => {
    const autoResolutions = conflicts
      .filter(c => c.autoResolvable && c.suggestedResolution)
      .map(c => ({
        conflictId: c.id,
        resolution: c.suggestedResolution!,
      }));

    if (autoResolutions.length > 0) {
      onBulkResolve?.(autoResolutions);
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'duplicate': return <IconGitMerge size={16} />;
      case 'inconsistent': return <IconAlertTriangle size={16} />;
      case 'missing_reference': return <IconX size={16} />;
      case 'data_mismatch': return <IconEdit size={16} />;
      default: return <IconAlertTriangle size={16} />;
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'duplicate': return 'Duplicado';
      case 'inconsistent': return 'Inconsistente';
      case 'missing_reference': return 'Referencia Faltante';
      case 'data_mismatch': return 'Datos Incorrectos';
      default: return type;
    }
  };

  const renderEditForm = (conflict: Conflict) => {
    const fields = Object.keys(editingData);
    
    return (
      <Stack gap="md">
        {fields.map(field => {
          const value = editingData[field];
          
          if (typeof value === 'string') {
            return (
              <TextInput
                key={field}
                label={field}
                value={value}
                onChange={(e) => setEditingData((prev: any) => ({ ...prev, [field]: e.target.value }))}
              />
            );
          } else if (typeof value === 'number') {
            return (
              <NumberInput
                key={field}
                label={field}
                value={value}
                onChange={(val) => setEditingData((prev: any) => ({ ...prev, [field]: val }))}
              />
            );
          } else if (typeof value === 'boolean') {
            return (
              <Switch
                key={field}
                label={field}
                checked={value}
                onChange={(e) => setEditingData((prev: any) => ({ ...prev, [field]: e.currentTarget.checked }))}
              />
            );
          } else if (typeof value === 'object' && value !== null) {
            return (
              <Textarea
                key={field}
                label={field}
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditingData((prev: any) => ({ ...prev, [field]: parsed }));
                  } catch {}
                }}
                autosize
                minRows={2}
              />
            );
          }
          
          return (
            <TextInput
              key={field}
              label={field}
              value={String(value)}
              onChange={(e) => setEditingData((prev: any) => ({ ...prev, [field]: e.target.value }))}
            />
          );
        })}
      </Stack>
    );
  };

  const summary = {
    total: conflicts.length,
    high: conflicts.filter(c => c.severity === 'high').length,
    medium: conflicts.filter(c => c.severity === 'medium').length,
    low: conflicts.filter(c => c.severity === 'low').length,
    autoResolvable: conflicts.filter(c => c.autoResolvable).length,
  };

  return (
    <Box>
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Resolución de Conflictos</Title>
          <Group>
            {summary.autoResolvable > 0 && (
              <Button
                leftSection={<IconWand size={16} />}
                onClick={autoResolveAll}
                variant="light"
                color="blue"
              >
                Auto-resolver ({summary.autoResolvable})
              </Button>
            )}
          </Group>
        </Group>

        <Stack gap="sm" mb="lg">
          <Group>
            <Text size="sm" c="dimmed">Conflictos detectados:</Text>
            <Badge color="gray">{summary.total} total</Badge>
            {summary.high > 0 && <Badge color="red">{summary.high} críticos</Badge>}
            {summary.medium > 0 && <Badge color="orange">{summary.medium} moderados</Badge>}
            {summary.low > 0 && <Badge color="yellow">{summary.low} menores</Badge>}
          </Group>

          {allowBulkActions && bulkSelection.size > 0 && (
            <Alert color="blue" variant="light">
              <Group justify="space-between">
                <Text size="sm">
                  {bulkSelection.size} conflicto(s) seleccionado(s)
                </Text>
                <Group gap="xs">
                  <Select
                    placeholder="Estrategia de resolución"
                    size="xs"
                    style={{ width: 200 }}
                    data={[
                      { value: 'ignore', label: 'Ignorar seleccionados' },
                      { value: 'delete', label: 'Eliminar seleccionados' },
                      { value: 'keep_first', label: 'Mantener primeros' },
                    ]}
                    onChange={(value) => {
                      if (value) {
                        setBulkStrategy({ type: value as any, description: '' });
                      }
                    }}
                  />
                  <Button
                    size="xs"
                    onClick={handleBulkResolve}
                    disabled={!bulkStrategy}
                  >
                    Aplicar
                  </Button>
                </Group>
              </Group>
            </Alert>
          )}
        </Stack>

        <Stack gap="xs">
          {conflicts.map((conflict) => {
            const isExpanded = expandedConflicts.has(conflict.id);
            const isSelected = bulkSelection.has(conflict.id);

            return (
              <Card key={conflict.id} withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start">
                    {allowBulkActions && (
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleBulkSelection(conflict.id, e.currentTarget.checked)}
                      />
                    )}

                    {getConflictIcon(conflict.type)}

                    <Box>
                      <Group gap="xs">
                        <Text fw={500}>{getConflictTypeLabel(conflict.type)}</Text>
                        <Badge size="xs" color={getConflictColor(conflict.severity)}>
                          {conflict.severity}
                        </Badge>
                        <Badge size="xs" variant="light">
                          {conflict.entityType}
                        </Badge>
                        {conflict.autoResolvable && (
                          <Badge size="xs" color="green" variant="outline">
                            Auto-resoluble
                          </Badge>
                        )}
                      </Group>
                      
                      <Text size="sm" c="dimmed" mt="2">{conflict.description}</Text>
                      <Text size="sm" mt="xs">
                        {conflict.affectedRecords.length} registro(s) afectado(s)
                      </Text>
                    </Box>
                  </Group>

                  <Group>
                    {conflict.suggestedResolution && (
                      <Tooltip label="Resolución sugerida">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => openResolutionModal(conflict, conflict.suggestedResolution!)}
                        >
                          <IconWand size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    
                    <ActionIcon
                      variant="subtle"
                      onClick={() => toggleConflictExpansion(conflict.id)}
                    >
                      {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                  </Group>
                </Group>

                <Collapse in={isExpanded}>
                  <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="sm" fw={500} mb="xs">
                      Registros afectados:
                    </Text>
                    
                    <Box mb="md" style={{ maxHeight: 200, overflow: 'auto' }}>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Índice</Table.Th>
                            <Table.Th>Datos</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {conflict.affectedRecords.slice(0, 5).map((record, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td>{idx + 1}</Table.Td>
                              <Table.Td>
                                <Text size="xs" style={{ fontFamily: 'monospace' }}>
                                  {JSON.stringify(record, null, 0).slice(0, 100)}...
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>

                    <Text size="sm" fw={500} mb="xs">
                      Estrategias de resolución:
                    </Text>
                    
                    <Group gap="xs">
                      {resolutionStrategies[conflict.type]?.map((strategy, idx) => (
                        <Button
                          key={idx}
                          size="xs"
                          variant="light"
                          onClick={() => openResolutionModal(conflict, strategy)}
                        >
                          {strategy.description}
                        </Button>
                      ))}
                    </Group>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Stack>

        {conflicts.length === 0 && (
          <Alert icon={<IconCheck size={16} />} color="green" variant="light">
            No se encontraron conflictos en los datos
          </Alert>
        )}
      </Card>

      {/* Modal de Resolución */}
      <Modal
        opened={!!resolutionModal.conflict}
        onClose={closeResolutionModal}
        title={`Resolver: ${resolutionModal.conflict?.description}`}
        size="lg"
      >
        {resolutionModal.conflict && resolutionModal.strategy && (
          <Stack gap="md">
            <Alert color="blue" variant="light">
              <Text size="sm">
                <strong>Estrategia:</strong> {resolutionModal.strategy.description}
              </Text>
            </Alert>

            {(resolutionModal.strategy.type === 'manual_edit' || resolutionModal.strategy.type === 'merge') && (
              <Box>
                <Text size="sm" fw={500} mb="md">
                  Editar datos del registro:
                </Text>
                {renderEditForm(resolutionModal.conflict)}
              </Box>
            )}

            {resolutionModal.strategy.type === 'delete' && (
              <Alert color="red" variant="light">
                <Text size="sm">
                  ⚠️ Esta acción eliminará {resolutionModal.conflict.affectedRecords.length} registro(s). 
                  Esta operación no se puede deshacer.
                </Text>
              </Alert>
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={closeResolutionModal}>
                Cancelar
              </Button>
              <Button onClick={handleResolveConflict}>
                Resolver Conflicto
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default ConflictResolver;