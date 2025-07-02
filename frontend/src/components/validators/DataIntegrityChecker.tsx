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
  Progress,
  Card,
  Title,
  Button,
  Tabs,
  List,
  NumberFormatter,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconDatabase,
  IconFingerprint,
  IconLink,
} from '@tabler/icons-react';

interface IntegrityCheck {
  id: string;
  name: string;
  description: string;
  type: 'uniqueness' | 'completeness' | 'consistency' | 'referential';
  entityType: string;
  severity: 'error' | 'warning' | 'info';
}

interface IntegrityResult {
  checkId: string;
  passed: boolean;
  message: string;
  affectedRecords: number;
  duplicates?: any[];
  missing?: any[];
  inconsistent?: any[];
  orphaned?: any[];
  type: string;
}

interface DataIntegrityCheckerProps {
  data: Record<string, any[]>;
  checks?: IntegrityCheck[];
  onIntegrityComplete?: (results: IntegrityResult[]) => void;
  autoCheck?: boolean;
}

const defaultIntegrityChecks: IntegrityCheck[] = [
  // Checks de Unicidad
  {
    id: 'cliente-cuit-unique',
    name: 'CUIT Único por Cliente',
    description: 'Verificar que no haya CUITs duplicados entre clientes',
    type: 'uniqueness',
    entityType: 'clientes',
    severity: 'error',
  },
  {
    id: 'vehiculo-patente-unique',
    name: 'Patente Única por Vehículo',
    description: 'Verificar que no haya patentes duplicadas',
    type: 'uniqueness',
    entityType: 'vehiculos',
    severity: 'error',
  },
  {
    id: 'personal-dni-unique',
    name: 'DNI Único por Personal',
    description: 'Verificar que no haya DNIs duplicados en el personal',
    type: 'uniqueness',
    entityType: 'personal',
    severity: 'error',
  },
  {
    id: 'empresa-cuit-unique',
    name: 'CUIT Único por Empresa',
    description: 'Verificar que no haya CUITs duplicados entre empresas',
    type: 'uniqueness',
    entityType: 'empresas',
    severity: 'error',
  },

  // Checks de Completitud
  {
    id: 'cliente-required-fields',
    name: 'Campos Obligatorios de Cliente',
    description: 'Verificar que todos los clientes tengan campos obligatorios',
    type: 'completeness',
    entityType: 'clientes',
    severity: 'error',
  },
  {
    id: 'site-coordinates-complete',
    name: 'Coordenadas Completas de Sites',
    description: 'Verificar que todos los sites tengan coordenadas completas',
    type: 'completeness',
    entityType: 'sites',
    severity: 'warning',
  },
  {
    id: 'tramo-tarifa-complete',
    name: 'Tarifas Completas en Tramos',
    description: 'Verificar que todos los tramos tengan al menos una tarifa activa',
    type: 'completeness',
    entityType: 'tramos',
    severity: 'warning',
  },

  // Checks de Consistencia
  {
    id: 'vehiculo-capacity-consistency',
    name: 'Consistencia de Capacidades de Vehículo',
    description: 'Verificar consistencia entre capacidad en kg y m³',
    type: 'consistency',
    entityType: 'vehiculos',
    severity: 'warning',
  },
  {
    id: 'personal-dates-consistency',
    name: 'Consistencia de Fechas de Personal',
    description: 'Verificar que las fechas de ingreso sean coherentes',
    type: 'consistency',
    entityType: 'personal',
    severity: 'warning',
  },
  {
    id: 'tarifa-dates-consistency',
    name: 'Consistencia de Fechas en Tarifas',
    description: 'Verificar que fechaDesde sea menor que fechaHasta',
    type: 'consistency',
    entityType: 'tramos',
    severity: 'error',
  },

  // Checks Referenciales
  {
    id: 'site-client-reference',
    name: 'Referencias Site-Cliente',
    description: 'Verificar que todos los sites referencien clientes existentes',
    type: 'referential',
    entityType: 'sites',
    severity: 'error',
  },
  {
    id: 'personal-empresa-reference',
    name: 'Referencias Personal-Empresa',
    description: 'Verificar que todo el personal referencie empresas existentes',
    type: 'referential',
    entityType: 'personal',
    severity: 'error',
  },
  {
    id: 'vehiculo-empresa-reference',
    name: 'Referencias Vehículo-Empresa',
    description: 'Verificar que todos los vehículos referencien empresas existentes',
    type: 'referential',
    entityType: 'vehiculos',
    severity: 'error',
  },
];

export const DataIntegrityChecker: React.FC<DataIntegrityCheckerProps> = ({
  data,
  checks = defaultIntegrityChecks,
  onIntegrityComplete,
  autoCheck = true,
}) => {
  const [integrityResults, setIntegrityResults] = useState<IntegrityResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('all');

  const checkUniqueness = (check: IntegrityCheck): IntegrityResult => {
    const entityData = data[check.entityType] || [];
    const duplicates: any[] = [];
    
    let fieldToCheck = '';
    switch (check.id) {
      case 'cliente-cuit-unique':
      case 'empresa-cuit-unique':
        fieldToCheck = 'cuit';
        break;
      case 'vehiculo-patente-unique':
        fieldToCheck = 'patente';
        break;
      case 'personal-dni-unique':
        fieldToCheck = 'dni';
        break;
    }

    if (fieldToCheck) {
      const seen = new Map();
      entityData.forEach((record, index) => {
        const value = record[fieldToCheck];
        if (value) {
          if (seen.has(value)) {
            const existing = seen.get(value);
            if (!duplicates.find(d => d.value === value)) {
              duplicates.push({
                value,
                records: [existing.record, record],
                indices: [existing.index, index],
              });
            } else {
              const duplicate = duplicates.find(d => d.value === value);
              duplicate.records.push(record);
              duplicate.indices.push(index);
            }
          } else {
            seen.set(value, { record, index });
          }
        }
      });
    }

    return {
      checkId: check.id,
      passed: duplicates.length === 0,
      message: duplicates.length === 0
        ? `No se encontraron duplicados en ${fieldToCheck}`
        : `${duplicates.length} valor(es) duplicado(s) encontrado(s) en ${fieldToCheck}`,
      affectedRecords: duplicates.reduce((acc, d) => acc + d.records.length, 0),
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      type: check.type,
    };
  };

  const checkCompleteness = (check: IntegrityCheck): IntegrityResult => {
    const entityData = data[check.entityType] || [];
    const missing: any[] = [];

    entityData.forEach((record, index) => {
      const missingFields: string[] = [];

      switch (check.id) {
        case 'cliente-required-fields':
          if (!record.nombre) missingFields.push('nombre');
          if (!record.cuit) missingFields.push('cuit');
          if (!record.email) missingFields.push('email');
          break;

        case 'site-coordinates-complete':
          if (!record.coordenadas?.latitud) missingFields.push('latitud');
          if (!record.coordenadas?.longitud) missingFields.push('longitud');
          break;

        case 'tramo-tarifa-complete':
          const tarifasActivas = (record.tarifas || []).filter((t: any) => t.activa);
          if (tarifasActivas.length === 0) missingFields.push('tarifa activa');
          break;
      }

      if (missingFields.length > 0) {
        missing.push({
          record,
          index,
          missingFields,
        });
      }
    });

    return {
      checkId: check.id,
      passed: missing.length === 0,
      message: missing.length === 0
        ? 'Todos los registros tienen campos completos'
        : `${missing.length} registro(s) con campos faltantes`,
      affectedRecords: missing.length,
      missing: missing.length > 0 ? missing : undefined,
      type: check.type,
    };
  };

  const checkConsistency = (check: IntegrityCheck): IntegrityResult => {
    const entityData = data[check.entityType] || [];
    const inconsistent: any[] = [];

    entityData.forEach((record, index) => {
      const issues: string[] = [];

      switch (check.id) {
        case 'vehiculo-capacity-consistency':
          const { capacidadKg, capacidadM3 } = record;
          if (capacidadKg && capacidadM3) {
            // Verificar ratio típico kg/m³ (300-800 kg/m³ es típico)
            const density = capacidadKg / capacidadM3;
            if (density < 100 || density > 1500) {
              issues.push(`Ratio kg/m³ inusual: ${density.toFixed(2)}`);
            }
          }
          break;

        case 'personal-dates-consistency':
          const fechaIngreso = record.fechaIngreso ? new Date(record.fechaIngreso) : null;
          const fechaNacimiento = record.fechaNacimiento ? new Date(record.fechaNacimiento) : null;
          const hoy = new Date();

          if (fechaIngreso && fechaIngreso > hoy) {
            issues.push('Fecha de ingreso en el futuro');
          }
          if (fechaNacimiento && fechaIngreso) {
            const edad = fechaIngreso.getFullYear() - fechaNacimiento.getFullYear();
            if (edad < 16 || edad > 80) {
              issues.push(`Edad al ingreso inusual: ${edad} años`);
            }
          }
          break;

        case 'tarifa-dates-consistency':
          const tarifas = record.tarifas || [];
          tarifas.forEach((tarifa: any, tarifaIndex: number) => {
            const desde = new Date(tarifa.fechaDesde);
            const hasta = tarifa.fechaHasta ? new Date(tarifa.fechaHasta) : null;
            
            if (hasta && desde >= hasta) {
              issues.push(`Tarifa ${tarifaIndex}: fechaDesde >= fechaHasta`);
            }
          });
          break;
      }

      if (issues.length > 0) {
        inconsistent.push({
          record,
          index,
          issues,
        });
      }
    });

    return {
      checkId: check.id,
      passed: inconsistent.length === 0,
      message: inconsistent.length === 0
        ? 'Todos los registros son consistentes'
        : `${inconsistent.length} registro(s) con inconsistencias`,
      affectedRecords: inconsistent.length,
      inconsistent: inconsistent.length > 0 ? inconsistent : undefined,
      type: check.type,
    };
  };

  const checkReferential = (check: IntegrityCheck): IntegrityResult => {
    const entityData = data[check.entityType] || [];
    const orphaned: any[] = [];

    entityData.forEach((record, index) => {
      const issues: string[] = [];

      switch (check.id) {
        case 'site-client-reference':
          const clientes = data.clientes || [];
          const clienteIds = new Set(clientes.map(c => c.id || c._id));
          if (!clienteIds.has(record.clienteId)) {
            issues.push(`Cliente no encontrado: ${record.clienteId}`);
          }
          break;

        case 'personal-empresa-reference':
          const empresas = data.empresas || [];
          const empresaIds = new Set(empresas.map(e => e.id || e._id));
          if (!empresaIds.has(record.empresaId)) {
            issues.push(`Empresa no encontrada: ${record.empresaId}`);
          }
          break;

        case 'vehiculo-empresa-reference':
          const empresasVeh = data.empresas || [];
          const empresaVehIds = new Set(empresasVeh.map(e => e.id || e._id));
          if (!empresaVehIds.has(record.empresaId)) {
            issues.push(`Empresa no encontrada: ${record.empresaId}`);
          }
          break;
      }

      if (issues.length > 0) {
        orphaned.push({
          record,
          index,
          issues,
        });
      }
    });

    return {
      checkId: check.id,
      passed: orphaned.length === 0,
      message: orphaned.length === 0
        ? 'Todas las referencias son válidas'
        : `${orphaned.length} registro(s) con referencias inválidas`,
      affectedRecords: orphaned.length,
      orphaned: orphaned.length > 0 ? orphaned : undefined,
      type: check.type,
    };
  };

  const runIntegrityCheck = (check: IntegrityCheck): IntegrityResult => {
    switch (check.type) {
      case 'uniqueness':
        return checkUniqueness(check);
      case 'completeness':
        return checkCompleteness(check);
      case 'consistency':
        return checkConsistency(check);
      case 'referential':
        return checkReferential(check);
      default:
        return {
          checkId: check.id,
          passed: true,
          message: 'Tipo de check no implementado',
          affectedRecords: 0,
          type: check.type,
        };
    }
  };

  const runAllChecks = async () => {
    setIsChecking(true);

    try {
      const results: IntegrityResult[] = [];

      for (const check of checks) {
        if (data[check.entityType] && data[check.entityType].length > 0) {
          const result = runIntegrityCheck(check);
          results.push(result);
        }
      }

      setIntegrityResults(results);
      onIntegrityComplete?.(results);
    } catch (error) {
      console.error('Error en verificación de integridad:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (autoCheck && Object.keys(data).length > 0) {
      runAllChecks();
    }
  }, [data, autoCheck]);

  const toggleCheckExpansion = (checkId: string) => {
    const newExpanded = new Set(expandedChecks);
    if (newExpanded.has(checkId)) {
      newExpanded.delete(checkId);
    } else {
      newExpanded.add(checkId);
    }
    setExpandedChecks(newExpanded);
  };

  const getFilteredResults = () => {
    if (activeTab === 'all') return integrityResults;
    return integrityResults.filter(r => r.type === activeTab);
  };

  const getSummary = () => {
    const total = integrityResults.length;
    const passed = integrityResults.filter(r => r.passed).length;
    const failed = total - passed;
    const totalAffected = integrityResults.reduce((acc, r) => acc + r.affectedRecords, 0);

    const byType = integrityResults.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = { total: 0, passed: 0, failed: 0 };
      }
      acc[result.type].total++;
      if (result.passed) {
        acc[result.type].passed++;
      } else {
        acc[result.type].failed++;
      }
      return acc;
    }, {} as Record<string, { total: number; passed: number; failed: number }>);

    return { total, passed, failed, totalAffected, byType };
  };

  const summary = getSummary();

  const typeColors: Record<string, string> = {
    uniqueness: 'red',
    completeness: 'orange',
    consistency: 'yellow',
    referential: 'blue',
  };

  const typeNames: Record<string, string> = {
    uniqueness: 'Unicidad',
    completeness: 'Completitud',
    consistency: 'Consistencia',
    referential: 'Referencias',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    uniqueness: <IconFingerprint size={16} />,
    completeness: <IconDatabase size={16} />,
    consistency: <IconCheck size={16} />,
    referential: <IconLink size={16} />,
  };

  return (
    <Box>
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Verificación de Integridad de Datos</Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            loading={isChecking}
            onClick={runAllChecks}
            variant="light"
          >
            Verificar Integridad
          </Button>
        </Group>

        <Stack gap="sm" mb="lg">
          <Group>
            <Text size="sm" c="dimmed">Estado general:</Text>
            <Badge color={summary.failed > 0 ? 'red' : 'green'}>
              {summary.passed}/{summary.total} checks pasados
            </Badge>
            {summary.totalAffected > 0 && (
              <Badge color="orange" variant="light">
                <NumberFormatter value={summary.totalAffected} /> registros afectados
              </Badge>
            )}
          </Group>

          <Progress
            value={summary.total > 0 ? (summary.passed / summary.total) * 100 : 0}
            color={summary.failed > 0 ? 'red' : 'green'}
            size="sm"
          />

          {summary.failed > 0 && (
            <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
              Se detectaron {summary.failed} problema(s) de integridad que requieren atención
            </Alert>
          )}
        </Stack>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<IconDatabase size={16} />}>
              Todos ({summary.total})
            </Tabs.Tab>
            {Object.entries(summary.byType).map(([type, stats]) => (
              <Tabs.Tab
                key={type}
                value={type}
                leftSection={typeIcons[type]}
                color={typeColors[type]}
              >
                {typeNames[type]} ({stats.failed > 0 ? stats.failed : stats.total})
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <Stack gap="xs">
              {getFilteredResults().map((result) => {
                const check = checks.find(c => c.id === result.checkId);
                if (!check) return null;

                const isExpanded = expandedChecks.has(result.checkId);
                const hasDetails = !!(result.duplicates || result.missing || result.inconsistent || result.orphaned);

                return (
                  <Card key={result.checkId} withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Group align="flex-start">
                        {result.passed ? (
                          <IconCheck size={16} color="green" />
                        ) : (
                          <IconX size={16} color={check.severity === 'error' ? 'red' : 'orange'} />
                        )}

                        <Box>
                          <Group gap="xs">
                            <Text fw={500}>{check.name}</Text>
                            <Badge size="xs" color={typeColors[check.type]}>
                              {typeNames[check.type]}
                            </Badge>
                            <Badge 
                              size="xs" 
                              color={check.severity === 'error' ? 'red' : check.severity === 'warning' ? 'yellow' : 'blue'}
                            >
                              {check.severity}
                            </Badge>
                          </Group>
                          
                          <Text size="sm" c="dimmed" mt="2">{check.description}</Text>
                          <Text 
                            size="sm" 
                            mt="xs" 
                            c={result.passed ? 'green' : check.severity === 'error' ? 'red' : 'orange'}
                          >
                            {result.message}
                          </Text>
                        </Box>
                      </Group>

                      {hasDetails && (
                        <ActionIcon
                          variant="subtle"
                          onClick={() => toggleCheckExpansion(result.checkId)}
                        >
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                      )}
                    </Group>

                    <Collapse in={isExpanded && hasDetails}>
                      <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        {result.duplicates && (
                          <Box mb="md">
                            <Text size="sm" fw={500} mb="xs">Duplicados encontrados:</Text>
                            <List size="sm">
                              {result.duplicates.slice(0, 5).map((dup, idx) => (
                                <List.Item key={idx}>
                                  <Text size="xs">
                                    <strong>{dup.value}</strong> aparece en {dup.records.length} registros
                                  </Text>
                                </List.Item>
                              ))}
                            </List>
                          </Box>
                        )}

                        {result.missing && (
                          <Box mb="md">
                            <Text size="sm" fw={500} mb="xs">Campos faltantes:</Text>
                            <List size="sm">
                              {result.missing.slice(0, 5).map((miss, idx) => (
                                <List.Item key={idx}>
                                  <Text size="xs">
                                    Registro {miss.index}: <strong>{miss.missingFields.join(', ')}</strong>
                                  </Text>
                                </List.Item>
                              ))}
                            </List>
                          </Box>
                        )}

                        {result.inconsistent && (
                          <Box mb="md">
                            <Text size="sm" fw={500} mb="xs">Inconsistencias:</Text>
                            <List size="sm">
                              {result.inconsistent.slice(0, 5).map((inc, idx) => (
                                <List.Item key={idx}>
                                  <Text size="xs">
                                    Registro {inc.index}: {inc.issues.join(', ')}
                                  </Text>
                                </List.Item>
                              ))}
                            </List>
                          </Box>
                        )}

                        {result.orphaned && (
                          <Box mb="md">
                            <Text size="sm" fw={500} mb="xs">Referencias inválidas:</Text>
                            <List size="sm">
                              {result.orphaned.slice(0, 5).map((orph, idx) => (
                                <List.Item key={idx}>
                                  <Text size="xs">
                                    Registro {orph.index}: {orph.issues.join(', ')}
                                  </Text>
                                </List.Item>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Box>
  );
};

export default DataIntegrityChecker;