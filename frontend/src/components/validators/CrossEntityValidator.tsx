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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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

// Interfaces para tipado fuerte
interface EntityRecord {
  id?: string;
  _id?: string;
  [key: string]: unknown;
}

interface EntityData {
  [entityType: string]: EntityRecord[];
}

interface ValidationDetail {
  record: EntityRecord;
  issue: string;
}

interface VehicleRecord {
  vehiculoId: string;
  [key: string]: unknown;
}

interface ValidationContext {
  passed: boolean;
  affectedRecords: number;
  details: ValidationDetail[];
}

// Extensión de ValidationResult para incluir detalles cross-entity
interface CrossEntityValidationResult {
  ruleId: string;
  passed: boolean;
  message: string;
  affectedRecords: number;
  details?: ValidationDetail[];
}

interface CrossEntityValidatorProps {
  data: EntityData;
  rules?: CrossEntityRuleConfig[];
  onValidationComplete?: (results: CrossEntityValidationResult[]) => void;
  autoValidate?: boolean;
}

// Clase validadora que extiende BaseValidator
class CrossEntityValidatorImpl extends BaseValidator<EntityData> {
  private validationMap: Record<
    string,
    (entityData: EntityRecord[], dependencyData: EntityData, context: ValidationContext) => void
  >;

  constructor(private rules: CrossEntityRuleConfig[]) {
    super();
    this.validationMap = {
      'cliente-site-relationship': this.validateClienteSiteRelationship.bind(this),
      'empresa-personal-relationship': this.validateEmpresaPersonalRelationship.bind(this),
      'empresa-vehiculo-relationship': this.validateEmpresaVehiculoRelationship.bind(this),
      'tramo-site-relationship': this.validateTramoSiteRelationship.bind(this),
      'tramo-cliente-relationship': this.validateTramoClienteRelationship.bind(this),
      'viaje-tramo-relationship': this.validateViajeTramoRelationship.bind(this),
      'viaje-vehiculo-relationship': this.validateViajeVehiculoRelationship.bind(this),
      'extra-cliente-relationship': this.validateExtraClienteRelationship.bind(this),
    };
  }

  getValidationRules(): ValidationRule<EntityData>[] {
    return this.rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      category: 'Cross-Entity',
      required: rule.severity === 'error',
      validator: (data: EntityData) => this.validateRule(rule, data),
    }));
  }

  private validateClienteSiteRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const clienteIds = new Set(dependencyData.clientes.map((c) => c.id || c._id));
    entityData.forEach((site) => {
      if (!clienteIds.has(site.clienteId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: site,
          issue: `Cliente no encontrado: ${site.clienteId as string}`,
        });
      }
    });
  }

  private validateEmpresaPersonalRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const empresaIds = new Set(dependencyData.empresas.map((e) => e.id || e._id));
    entityData.forEach((personal) => {
      if (!empresaIds.has(personal.empresaId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: personal,
          issue: `Empresa no encontrada: ${personal.empresaId as string}`,
        });
      }
    });
  }

  private validateEmpresaVehiculoRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const empresaVehiculoIds = new Set(dependencyData.empresas.map((e) => e.id || e._id));
    entityData.forEach((vehiculo) => {
      if (!empresaVehiculoIds.has(vehiculo.empresaId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: vehiculo,
          issue: `Empresa no encontrada: ${vehiculo.empresaId as string}`,
        });
      }
    });
  }

  private validateTramoSiteRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const siteIds = new Set(dependencyData.sites.map((s) => s.id || s._id));
    entityData.forEach((tramo) => {
      if (!siteIds.has(tramo.origenId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: tramo,
          issue: `Site origen no encontrado: ${tramo.origenId as string}`,
        });
      }
      if (!siteIds.has(tramo.destinoId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: tramo,
          issue: `Site destino no encontrado: ${tramo.destinoId as string}`,
        });
      }
    });
  }

  private validateTramoClienteRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const clienteTramoIds = new Set(dependencyData.clientes.map((c) => c.id || c._id));
    entityData.forEach((tramo) => {
      if (!clienteTramoIds.has(tramo.clienteId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: tramo,
          issue: `Cliente no encontrado: ${tramo.clienteId as string}`,
        });
      }
    });
  }

  private validateViajeTramoRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const tramoIds = new Set(dependencyData.tramos.map((t) => t.id || t._id));
    entityData.forEach((viaje) => {
      if (!tramoIds.has(viaje.tramoId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: viaje,
          issue: `Tramo no encontrado: ${viaje.tramoId as string}`,
        });
      }
    });
  }

  private validateViajeVehiculoRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const vehiculoIds = new Set(dependencyData.vehiculos.map((v) => v.id || v._id));
    entityData.forEach((viaje) => {
      const vehiculos = (viaje.vehiculos as VehicleRecord[]) || [];
      vehiculos.forEach((vehiculo: VehicleRecord) => {
        if (!vehiculoIds.has(vehiculo.vehiculoId)) {
          context.passed = false;
          context.affectedRecords++;
          context.details.push({
            record: viaje,
            issue: `Vehículo no encontrado: ${vehiculo.vehiculoId}`,
          });
        }
      });
    });
  }

  private validateExtraClienteRelationship(
    entityData: EntityRecord[],
    dependencyData: EntityData,
    context: ValidationContext
  ): void {
    const clienteExtraIds = new Set(dependencyData.clientes.map((c) => c.id || c._id));
    entityData.forEach((extra) => {
      if (!clienteExtraIds.has(extra.clienteId as string)) {
        context.passed = false;
        context.affectedRecords++;
        context.details.push({
          record: extra,
          issue: `Cliente no encontrado: ${extra.clienteId as string}`,
        });
      }
    });
  }

  private validateRule(
    rule: CrossEntityRuleConfig,
    data: EntityData
  ): BaseValidationResult & {
    ruleId: string;
    affectedRecords: number;
    details?: ValidationDetail[];
  } {
    const entityData = data[rule.entityType] || [];
    const dependencyData: EntityData = {};

    rule.dependencies.forEach((dep) => {
      dependencyData[dep] = data[dep] || [];
    });

    // Verificar que las dependencias existan
    const hasAllDependencies = rule.dependencies.every((dep) => data[dep] && data[dep].length > 0);

    if (!hasAllDependencies || !data[rule.entityType]) {
      return {
        ruleId: rule.id,
        passed: true,
        message: `Saltado: datos insuficientes para ${rule.name}`,
        affectedRecords: 0,
      };
    }

    const context: ValidationContext = {
      passed: true,
      affectedRecords: 0,
      details: [],
    };

    const validator = this.validationMap[rule.id];
    if (validator) {
      validator(entityData, dependencyData, context);
    }

    return {
      ruleId: rule.id,
      passed: context.passed,
      message: context.passed
        ? `Validación exitosa: ${rule.name}`
        : `${context.affectedRecords} registro(s) con problemas en ${rule.name}`,
      affectedRecords: context.affectedRecords,
      details: context.details.length > 0 ? context.details : undefined,
    } as BaseValidationResult & {
      ruleId: string;
      affectedRecords: number;
      details?: ValidationDetail[];
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

const getRuleIcon = (result: CrossEntityValidationResult, rule: CrossEntityRuleConfig) =>
  result.passed ? (
    <IconCheck size={16} color="green" />
  ) : (
    <IconX size={16} color={rule.severity === 'error' ? 'red' : 'orange'} />
  );

const getBadgeColor = (severity: string) =>
  severity === 'error' ? 'red' : severity === 'warning' ? 'yellow' : 'blue';

const DetailsList: React.FC<{ details: ValidationDetail[] }> = ({ details }) => (
  <List size="sm" withPadding>
    {details.slice(0, 10).map((detail, idx) => (
      <List.Item key={idx}>
        <Text size="xs" c="red">
          {detail.issue}
        </Text>
        <Text size="xs" c="dimmed">
          Registro: {JSON.stringify(detail.record, null, 0).slice(0, 100)}...
        </Text>
      </List.Item>
    ))}
    {details.length > 10 && (
      <List.Item>
        <Text size="xs" c="dimmed">
          ... y {details.length - 10} más
        </Text>
      </List.Item>
    )}
  </List>
);

const ValidationRuleCard: React.FC<{
  result: CrossEntityValidationResult;
  rule: CrossEntityRuleConfig;
  isExpanded: boolean;
  onToggle: (ruleId: string) => void;
}> = ({ result, rule, isExpanded, onToggle }) => {
  const hasDetails = Boolean(result.details && result.details.length > 0);

  return (
    <Card key={result.ruleId} withBorder>
      <Group justify="space-between" align="flex-start">
        <Group>
          {getRuleIcon(result, rule)}
          <Box>
            <Group gap="xs">
              <Text fw={500}>{rule.name}</Text>
              <Badge size="xs" color={getBadgeColor(rule.severity)}>
                {rule.severity}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {rule.description}
            </Text>
            <Text size="sm" mt="xs">
              {result.message}
            </Text>
          </Box>
        </Group>

        {hasDetails && (
          <ActionIcon variant="subtle" onClick={() => onToggle(result.ruleId)}>
            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>

      <Collapse in={isExpanded && hasDetails}>
        <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Text size="sm" fw={500} mb="xs">
            Registros afectados ({result.details?.length}):
          </Text>
          {result.details && <DetailsList details={result.details} />}
        </Box>
      </Collapse>
    </Card>
  );
};

export const CrossEntityValidator: React.FC<CrossEntityValidatorProps> = ({
  data,
  rules = defaultRules,
  onValidationComplete,
  autoValidate = true,
}) => {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const validatorInstance = new CrossEntityValidatorImpl(rules);
  const {
    validationResults: baseValidationResults,
    validationSummary,
    runValidation,
  } = useValidation(validatorInstance, data, autoValidate);

  const validationResults: CrossEntityValidationResult[] = Object.entries(
    baseValidationResults
  ).map(([ruleId, result]) => {
    const extendedResult = result as BaseValidationResult & {
      ruleId?: string;
      affectedRecords?: number;
      details?: ValidationDetail[];
    };
    return {
      ruleId,
      passed: Boolean(result.passed),
      message: result.message,
      affectedRecords: extendedResult.affectedRecords || 0,
      details: extendedResult.details,
    };
  });

  useEffect(() => {
    if (validationResults.length > 0 && onValidationComplete) {
      onValidationComplete(validationResults);
    }
  }, [validationResults, onValidationComplete]);

  const toggleRuleExpansion = (ruleId: string) => {
    setExpandedRules((prev) => {
      const newExpanded = new Set(prev);
      newExpanded.has(ruleId) ? newExpanded.delete(ruleId) : newExpanded.add(ruleId);
      return newExpanded;
    });
  };

  const summary = {
    total: validationSummary.totalRules,
    passed: validationSummary.passedRules,
    errors: validationSummary.errors.length,
    warnings: validationSummary.warnings.length,
  };

  return (
    <Box>
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Validación Cross-Entity</Title>
          <Button leftSection={<IconRefresh size={16} />} onClick={runValidation} variant="light">
            Revalidar
          </Button>
        </Group>

        <Stack gap="sm" mb="lg">
          <Group>
            <Text size="sm" c="dimmed">
              Progreso:
            </Text>
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
          {validationResults.map((result, _index) => {
            const rule = rules.find((r) => r.id === result.ruleId);
            return rule ? (
              <ValidationRuleCard
                key={result.ruleId}
                result={result}
                rule={rule}
                isExpanded={expandedRules.has(result.ruleId)}
                onToggle={toggleRuleExpansion}
              />
            ) : null;
          })}
        </Stack>
      </Card>
    </Box>
  );
};

export default CrossEntityValidator;
