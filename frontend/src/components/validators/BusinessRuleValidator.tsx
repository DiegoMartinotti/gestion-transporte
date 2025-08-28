import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Switch,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconSettings,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useValidation, BusinessRuleValidationResult } from './BaseValidator';
import { DefaultBusinessRuleValidator, defaultBusinessRules } from './DefaultBusinessRuleValidator';

// Interface legacy para compatibilidad con el código existente
interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'temporal' | 'capacity' | 'documentation';
  entityType: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  validationFn: (
    record: Record<string, unknown>,
    context?: Record<string, unknown>
  ) => {
    passed: boolean;
    message?: string;
    details?: unknown;
  };
}

interface BusinessRuleValidatorProps {
  data: Record<string, unknown[]>;
  contextData?: Record<string, unknown>;
  rules?: BusinessRule[];
  onValidationComplete?: (results: BusinessRuleValidationResult[]) => void;
  onRuleToggle?: (ruleId: string, enabled: boolean) => void;
  autoValidate?: boolean;
  entityType?: string;
  enabledByDefault?: boolean;
  showCategoryFilter?: boolean;
  showSeverityFilter?: boolean;
}

// Helpers para severidad y estado de reglas
const SEVERITY_COLORS = {
  error: 'red',
  warning: 'yellow',
  info: 'blue',
} as const;

const getStatusIcon = (
  result: BusinessRuleValidationResult | undefined,
  isEnabled: boolean,
  severity: string
) => {
  if (result && isEnabled) {
    return result.passed ? (
      <IconCheck size={16} color="green" />
    ) : (
      <IconX size={16} color={severity === 'error' ? 'red' : 'orange'} />
    );
  }
  return <IconSettings size={16} color="gray" />;
};

// Componente para renderizar detalles expandidos de una regla
interface RuleDetailsProps {
  result?: BusinessRuleValidationResult;
  isExpanded: boolean;
}

const RuleDetails: React.FC<RuleDetailsProps> = ({ result, isExpanded }) => {
  if (!result?.entityDetails?.length) return null;

  return (
    <Collapse in={isExpanded}>
      <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" fw={500} mb="xs">
          Registros que fallan ({result.entityDetails.length}):
        </Text>
        <Stack gap="xs">
          {result.entityDetails.slice(0, 5).map((detail, idx) => (
            <Box
              key={idx}
              p="xs"
              style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 4 }}
            >
              <Text size="xs" c="red" fw={500}>
                {detail.message}
              </Text>
              {detail.details && (
                <Text size="xs" c="dimmed" mt="2">
                  {JSON.stringify(detail.details, null, 2)}
                </Text>
              )}
            </Box>
          ))}
          {result.entityDetails.length > 5 && (
            <Text size="xs" c="dimmed">
              ... y {result.entityDetails.length - 5} registros más
            </Text>
          )}
        </Stack>
      </Box>
    </Collapse>
  );
};

// Componente para renderizar una tarjeta de regla de negocio individual
interface BusinessRuleCardProps {
  rule: BusinessRule;
  result?: BusinessRuleValidationResult;
  isEnabled: boolean;
  isExpanded: boolean;
  onToggleRule: () => void;
  onToggleExpansion: () => void;
}

const BusinessRuleCard: React.FC<BusinessRuleCardProps> = ({
  rule,
  result,
  isEnabled,
  isExpanded,
  onToggleRule,
  onToggleExpansion,
}) => {
  return (
    <Card withBorder opacity={isEnabled ? 1 : 0.6}>
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start">
          <Switch checked={isEnabled} onChange={onToggleRule} size="sm" />

          {getStatusIcon(result, isEnabled, rule.severity)}

          <Box>
            <Group gap="xs">
              <Text fw={500}>{rule.name}</Text>
              <Badge size="xs" color={CATEGORY_COLORS[rule.category]}>
                {CATEGORY_NAMES[rule.category]}
              </Badge>
              <Badge
                size="xs"
                color={SEVERITY_COLORS[rule.severity as keyof typeof SEVERITY_COLORS] || 'blue'}
              >
                {rule.severity}
              </Badge>
            </Group>

            <Group gap="xs" mt="xs">
              <Text size="sm" c="dimmed">
                {rule.description}
              </Text>
              <Tooltip label="Información sobre la regla">
                <ActionIcon variant="subtle" size="xs">
                  <IconInfoCircle size={12} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {result && isEnabled && (
              <Text size="sm" mt="xs" c={result.passed ? 'green' : 'red'}>
                {result.message}
              </Text>
            )}
          </Box>
        </Group>

        {result && result.entityDetails && result.entityDetails.length > 0 && (
          <ActionIcon variant="subtle" onClick={onToggleExpansion}>
            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>

      <RuleDetails result={result} isExpanded={isExpanded} />
    </Card>
  );
};

// Componente para mostrar el resumen de validación
interface ValidationSummaryProps {
  summary: {
    total: number;
    passed: number;
    failed: number;
    byCategory: Record<string, { total: number; passed: number; failed: number }>;
  };
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ summary }) => (
  <Stack gap="sm" mb="lg">
    <Progress value={summary.total > 0 ? (summary.passed / summary.total) * 100 : 0} />

    <Group>
      <Text size="sm">
        {summary.passed}/{summary.total} reglas cumplidas
      </Text>
      {summary.failed > 0 && (
        <Badge color="red" size="sm">
          {summary.failed} fallan
        </Badge>
      )}
    </Group>

    <Group>
      {Object.entries(summary.byCategory)
        .filter(([_, stats]) => stats.total > 0)
        .map(([category, stats]) => (
          <Badge
            key={category}
            color={CATEGORY_COLORS[category]}
            variant={summary.byCategory[category]?.failed > 0 ? 'filled' : 'light'}
            size="sm"
          >
            {CATEGORY_NAMES[category]}: {stats.passed}/{stats.total}
          </Badge>
        ))}
    </Group>

    {summary.failed > 0 && (
      <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
        {summary.failed} regla(s) de negocio no se cumplen
      </Alert>
    )}
  </Stack>
);

const BusinessRuleValidator: React.FC<BusinessRuleValidatorProps> = ({
  data,
  contextData,
  rules = defaultBusinessRules,
  onValidationComplete,
  onRuleToggle,
  autoValidate = true,
}) => {
  // Estados para la UI
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  // Crear instancia del validador con configuración dinámica
  const validator = useMemo(() => {
    const enabledRuleIds = rules.filter((r) => r.enabled).map((r) => r.id);
    return new DefaultBusinessRuleValidator(rules, contextData, enabledRuleIds);
  }, [rules, contextData]);

  // Usar el hook de validación
  const { validationResults: baseValidationResults, runValidation } = useValidation(
    validator,
    data,
    autoValidate
  );

  // Convertir resultados base a formato esperado por la UI
  const validationResults = useMemo(() => {
    return Object.entries(baseValidationResults)
      .filter(([_, result]) => result)
      .map(([_, result]) => result as BusinessRuleValidationResult);
  }, [baseValidationResults]);

  const isValidating = false; // El nuevo sistema es síncrono
  // Notificar cambios de validación
  useEffect(() => {
    if (validationResults.length > 0) {
      onValidationComplete?.(validationResults);
    }
  }, [validationResults, onValidationComplete]);

  const toggleRuleExpansion = useCallback(
    (ruleId: string) => {
      const newExpanded = new Set(expandedRules);
      if (newExpanded.has(ruleId)) {
        newExpanded.delete(ruleId);
      } else {
        newExpanded.add(ruleId);
      }
      setExpandedRules(newExpanded);
    },
    [expandedRules]
  );

  const toggleRule = useCallback(
    (ruleId: string) => {
      validator.toggleRule(ruleId);
      onRuleToggle?.(ruleId, validator.isRuleEnabled(ruleId));
      // Forzar revalidación después de cambiar las reglas habilitadas
      setTimeout(() => runValidation(), 0);
    },
    [validator, onRuleToggle, runValidation]
  );

  const getValidationSummary = useCallback(() => {
    const byCategory = validationResults.reduce(
      (acc, result) => {
        const category = result.category;
        if (!acc[category]) {
          acc[category] = { total: 0, passed: 0, failed: 0 };
        }
        acc[category].total++;
        if (result.passed) {
          acc[category].passed++;
        } else {
          acc[category].failed++;
        }
        return acc;
      },
      {} as Record<string, { total: number; passed: number; failed: number }>
    );

    const total = validationResults.length;
    const passed = validationResults.filter((r) => r.passed).length;
    const failed = total - passed;

    return { total, passed, failed, byCategory };
  }, [validationResults]);

  const summary = getValidationSummary();

  return (
    <Box>
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Validación de Reglas de Negocio</Title>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              loading={isValidating}
              onClick={runValidation}
              variant="light"
            >
              Revalidar
            </Button>
          </Group>
        </Group>

        <ValidationSummary summary={summary} />

        <Stack gap="xs">
          {rules.map((rule) => {
            const result = validationResults.find((r) => r.ruleId === rule.id);
            const isExpanded = expandedRules.has(rule.id);
            const isEnabled = validator.isRuleEnabled(rule.id);

            return (
              <BusinessRuleCard
                key={rule.id}
                rule={rule}
                result={result}
                isEnabled={isEnabled}
                isExpanded={isExpanded}
                onToggleRule={() => toggleRule(rule.id)}
                onToggleExpansion={() => toggleRuleExpansion(rule.id)}
              />
            );
          })}
        </Stack>
      </Card>
    </Box>
  );
};

// Comparador para React.memo
const arePropsEqual = (
  prevProps: BusinessRuleValidatorProps,
  nextProps: BusinessRuleValidatorProps
): boolean => {
  return (
    prevProps.data?.length === nextProps.data?.length &&
    prevProps.entityType === nextProps.entityType &&
    prevProps.enabledByDefault === nextProps.enabledByDefault &&
    prevProps.showCategoryFilter === nextProps.showCategoryFilter &&
    prevProps.showSeverityFilter === nextProps.showSeverityFilter &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.contextData) === JSON.stringify(nextProps.contextData) &&
    JSON.stringify(prevProps.rules) === JSON.stringify(nextProps.rules)
  );
};

export default React.memo(BusinessRuleValidator, arePropsEqual);
