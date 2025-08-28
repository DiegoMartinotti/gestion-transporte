import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Alert,
  Stack,
  Badge,
  Group,
  Progress,
  Title,
  Button,
  Card,
} from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconX } from '@tabler/icons-react';
import {
  BaseValidator,
  ValidationRule,
  ValidationResult as BaseValidationResult,
  useValidation,
} from './BaseValidator';
import {
  CrossEntityRuleConfig,
  EntityRecord,
  EntityData,
  ValidationDetail,
  VehicleRecord,
  ValidationContext,
  CrossEntityValidationResult,
  CrossEntityValidatorProps,
} from './CrossEntityValidatorTypes';
import { defaultRules } from './CrossEntityValidatorRules';
import { ValidationRuleCard } from './CrossEntityValidatorComponents';

// Interfaces imported from CrossEntityValidatorTypes.ts
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

// Rules and UI components imported from separate files

// Components imported from CrossEntityValidatorComponents.tsx

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
