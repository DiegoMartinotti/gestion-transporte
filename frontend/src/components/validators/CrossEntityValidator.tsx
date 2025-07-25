import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Alert,
  List,
  Stack,
  Badge,
  Group,
  ActionIcon,
  Collapse,
  Progress,
  Card,
  Title,
  Button,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
} from '@tabler/icons-react';
import {
  BaseValidator,
  ValidationRule,
  ValidationResult as BaseValidationResult,
  useValidation,
} from './BaseValidator';

// Configuración simple para cross-entity rules
interface CrossEntityRuleConfig {
  id: string;
  name: string;
  description: string;
  entityType: string;
  dependencies: string[];
  severity: 'error' | 'warning' | 'info';
}

// Extensión de ValidationResult para incluir detalles cross-entity
interface CrossEntityValidationResult extends BaseValidationResult {
  ruleId: string;
  affectedRecords: number;
  details?: any[];
}

interface CrossEntityValidatorProps {
  data: Record<string, any[]>;
  rules?: CrossEntityRuleConfig[];
  onValidationComplete?: (results: CrossEntityValidationResult[]) => void;
  autoValidate?: boolean;
}

// Clase validadora que extiende BaseValidator
class CrossEntityValidatorImpl extends BaseValidator<Record<string, any[]>> {
  constructor(private rules: CrossEntityRuleConfig[]) {
    super();
  }

  getValidationRules(): ValidationRule<Record<string, any[]>>[] {
    return this.rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      category: 'Cross-Entity',
      required: rule.severity === 'error',
      validator: (data: Record<string, any[]>) => this.validateRule(rule, data)
    }));
  }

  private validateRule(rule: CrossEntityRuleConfig, data: Record<string, any[]>): BaseValidationResult & { ruleId: string; affectedRecords: number; details?: any[] } {
    const entityData = data[rule.entityType] || [];
    const dependencyData: Record<string, any[]> = {};
    
    rule.dependencies.forEach(dep => {
      dependencyData[dep] = data[dep] || [];
    });

    // Verificar que las dependencias existan
    const hasAllDependencies = rule.dependencies.every(dep => data[dep] && data[dep].length > 0);
    
    if (!hasAllDependencies || !data[rule.entityType]) {
      return {
        ruleId: rule.id,
        passed: true,
        message: `Saltado: datos insuficientes para ${rule.name}`,
        affectedRecords: 0,
      };
    }

    let passed = true;
    let affectedRecords = 0;
    const details: any[] = [];

    switch (rule.id) {
      case 'cliente-site-relationship':
        const clienteIds = new Set(dependencyData.clientes.map(c => c.id || c._id));
        entityData.forEach(site => {
          if (!clienteIds.has(site.clienteId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: site,
              issue: `Cliente no encontrado: ${site.clienteId}`,
            });
          }
        });
        break;

      case 'empresa-personal-relationship':
        const empresaIds = new Set(dependencyData.empresas.map(e => e.id || e._id));
        entityData.forEach(personal => {
          if (!empresaIds.has(personal.empresaId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: personal,
              issue: `Empresa no encontrada: ${personal.empresaId}`,
            });
          }
        });
        break;

      case 'empresa-vehiculo-relationship':
        const empresaVehiculoIds = new Set(dependencyData.empresas.map(e => e.id || e._id));
        entityData.forEach(vehiculo => {
          if (!empresaVehiculoIds.has(vehiculo.empresaId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: vehiculo,
              issue: `Empresa no encontrada: ${vehiculo.empresaId}`,
            });
          }
        });
        break;

      case 'tramo-site-relationship':
        const siteIds = new Set(dependencyData.sites.map(s => s.id || s._id));
        entityData.forEach(tramo => {
          if (!siteIds.has(tramo.origenId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: tramo,
              issue: `Site origen no encontrado: ${tramo.origenId}`,
            });
          }
          if (!siteIds.has(tramo.destinoId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: tramo,
              issue: `Site destino no encontrado: ${tramo.destinoId}`,
            });
          }
        });
        break;

      case 'tramo-cliente-relationship':
        const clienteTramoIds = new Set(dependencyData.clientes.map(c => c.id || c._id));
        entityData.forEach(tramo => {
          if (!clienteTramoIds.has(tramo.clienteId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: tramo,
              issue: `Cliente no encontrado: ${tramo.clienteId}`,
            });
          }
        });
        break;

      case 'viaje-tramo-relationship':
        const tramoIds = new Set(dependencyData.tramos.map(t => t.id || t._id));
        entityData.forEach(viaje => {
          if (!tramoIds.has(viaje.tramoId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: viaje,
              issue: `Tramo no encontrado: ${viaje.tramoId}`,
            });
          }
        });
        break;

      case 'viaje-vehiculo-relationship':
        const vehiculoIds = new Set(dependencyData.vehiculos.map(v => v.id || v._id));
        entityData.forEach(viaje => {
          const vehiculos = viaje.vehiculos || [];
          vehiculos.forEach((vehiculo: any) => {
            if (!vehiculoIds.has(vehiculo.vehiculoId)) {
              passed = false;
              affectedRecords++;
              details.push({
                record: viaje,
                issue: `Vehículo no encontrado: ${vehiculo.vehiculoId}`,
              });
            }
          });
        });
        break;

      case 'extra-cliente-relationship':
        const clienteExtraIds = new Set(dependencyData.clientes.map(c => c.id || c._id));
        entityData.forEach(extra => {
          if (!clienteExtraIds.has(extra.clienteId)) {
            passed = false;
            affectedRecords++;
            details.push({
              record: extra,
              issue: `Cliente no encontrado: ${extra.clienteId}`,
            });
          }
        });
        break;
    }

    return {
      ruleId: rule.id,
      passed,
      message: passed 
        ? `Validación exitosa: ${rule.name}`
        : `${affectedRecords} registro(s) con problemas en ${rule.name}`,
      affectedRecords,
      details: details.length > 0 ? details : undefined,
    };
  }
}

const defaultRules: CrossEntityRuleConfig[] = [
  {
    id: 'cliente-site-relationship',
    name: 'Relación Cliente-Site',
    description: 'Verificar que todos los sites pertenezcan a clientes existentes',
    entityType: 'sites',
    dependencies: ['clientes'],
    severity: 'error',
  },
  {
    id: 'empresa-personal-relationship',
    name: 'Relación Empresa-Personal',
    description: 'Verificar que todo el personal pertenezca a empresas existentes',
    entityType: 'personal',
    dependencies: ['empresas'],
    severity: 'error',
  },
  {
    id: 'empresa-vehiculo-relationship',
    name: 'Relación Empresa-Vehículo',
    description: 'Verificar que todos los vehículos pertenezcan a empresas existentes',
    entityType: 'vehiculos',
    dependencies: ['empresas'],
    severity: 'error',
  },
  {
    id: 'tramo-site-relationship',
    name: 'Relación Tramo-Site',
    description: 'Verificar que origen y destino de tramos sean sites existentes',
    entityType: 'tramos',
    dependencies: ['sites'],
    severity: 'error',
  },
  {
    id: 'tramo-cliente-relationship',
    name: 'Relación Tramo-Cliente',
    description: 'Verificar que los tramos pertenezcan a clientes existentes',
    entityType: 'tramos',
    dependencies: ['clientes'],
    severity: 'error',
  },
  {
    id: 'viaje-tramo-relationship',
    name: 'Relación Viaje-Tramo',
    description: 'Verificar que los viajes usen tramos existentes',
    entityType: 'viajes',
    dependencies: ['tramos'],
    severity: 'error',
  },
  {
    id: 'viaje-vehiculo-relationship',
    name: 'Relación Viaje-Vehículo',
    description: 'Verificar que los viajes usen vehículos existentes',
    entityType: 'viajes',
    dependencies: ['vehiculos'],
    severity: 'warning',
  },
  {
    id: 'extra-cliente-relationship',
    name: 'Relación Extra-Cliente',
    description: 'Verificar que los extras pertenezcan a clientes existentes',
    entityType: 'extras',
    dependencies: ['clientes'],
    severity: 'error',
  },
];

export const CrossEntityValidator: React.FC<CrossEntityValidatorProps> = ({
  data,
  rules = defaultRules,
  onValidationComplete,
  autoValidate = true,
}) => {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  
  // Crear instancia del validador
  const validatorInstance = new CrossEntityValidatorImpl(rules);
  
  // Usar el hook de validación
  const {
    validationResults: baseValidationResults,
    validationSummary,
    runValidation
  } = useValidation(validatorInstance, data, autoValidate);

  // Convertir resultados a formato CrossEntityValidationResult
  const validationResults: CrossEntityValidationResult[] = Object.entries(baseValidationResults).map(([ruleId, result]) => {
    const rule = rules.find(r => r.id === ruleId);
    const extendedResult = result as BaseValidationResult & { ruleId?: string; affectedRecords?: number; details?: any[] };
    
    return {
      ruleId,
      passed: result.passed,
      message: result.message,
      affectedRecords: extendedResult.affectedRecords || 0,
      details: extendedResult.details
    };
  });

  // Notificar resultados al callback cuando se complete la validación
  useEffect(() => {
    if (validationResults.length > 0 && onValidationComplete) {
      onValidationComplete(validationResults);
    }
  }, [validationSummary.totalRules, onValidationComplete]);

  const toggleRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const summary = {
    total: validationSummary.totalRules,
    passed: validationSummary.passedRules,
    errors: validationSummary.errors.length,
    warnings: validationSummary.warnings.length
  };

  return (
    <Box>
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Validación Cross-Entity</Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={runValidation}
            variant="light"
          >
            Revalidar
          </Button>
        </Group>

        <Stack gap="sm" mb="lg">
          <Group>
            <Text size="sm" c="dimmed">Progreso:</Text>
            <Badge color={summary.errors > 0 ? 'red' : summary.warnings > 0 ? 'yellow' : 'green'}>
              {summary.passed}/{summary.total} reglas pasadas
            </Badge>
          </Group>
          
          <Progress
            value={(summary.passed / summary.total) * 100}
            color={summary.errors > 0 ? 'red' : summary.warnings > 0 ? 'yellow' : 'green'}
            size="sm"
          />

          {summary.errors > 0 && (
            <Alert icon={<IconX size={16} />} color="red" variant="light">
              {summary.errors} error(es) crítico(s) encontrado(s)
            </Alert>
          )}

          {summary.warnings > 0 && (
            <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
              {summary.warnings} advertencia(s) encontrada(s)
            </Alert>
          )}
        </Stack>

        <Stack gap="xs">
          {validationResults.map((result, index) => {
            const rule = rules.find(r => r.id === result.ruleId);
            if (!rule) return null;

            const isExpanded = expandedRules.has(result.ruleId);

            return (
              <Card key={result.ruleId} withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group>
                    {result.passed ? (
                      <IconCheck size={16} color="green" />
                    ) : (
                      <IconX size={16} color={rule.severity === 'error' ? 'red' : 'orange'} />
                    )}
                    <Box>
                      <Group gap="xs">
                        <Text fw={500}>{rule.name}</Text>
                        <Badge 
                          size="xs" 
                          color={rule.severity === 'error' ? 'red' : rule.severity === 'warning' ? 'yellow' : 'blue'}
                        >
                          {rule.severity}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">{rule.description}</Text>
                      <Text size="sm" mt="xs">{result.message}</Text>
                    </Box>
                  </Group>

                  {result.details && result.details.length > 0 && (
                    <ActionIcon
                      variant="subtle"
                      onClick={() => toggleRuleExpansion(result.ruleId)}
                    >
                      {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                  )}
                </Group>

                <Collapse in={isExpanded && !!(result.details && result.details.length > 0)}>
                  <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="sm" fw={500} mb="xs">
                      Registros afectados ({result.details?.length}):
                    </Text>
                    <List size="sm" withPadding>
                      {result.details?.slice(0, 10).map((detail, idx) => (
                        <List.Item key={idx}>
                          <Text size="xs" c="red">
                            {detail.issue}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Registro: {JSON.stringify(detail.record, null, 0).slice(0, 100)}...
                          </Text>
                        </List.Item>
                      ))}
                      {result.details && result.details.length > 10 && (
                        <List.Item>
                          <Text size="xs" c="dimmed">
                            ... y {result.details.length - 10} más
                          </Text>
                        </List.Item>
                      )}
                    </List>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      </Card>
    </Box>
  );
};

export default CrossEntityValidator;