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

const SEVERITY_COLORS = {
  error: 'red',
  warning: 'yellow',
  info: 'blue',
} as const;

const CATEGORY_COLORS = {
  financial: 'green',
  operational: 'blue',
  temporal: 'orange',
  capacity: 'violet',
  documentation: 'teal',
} as const;

const CATEGORY_NAMES = {
  financial: 'Financiero',
  operational: 'Operativo',
  temporal: 'Temporal',
  capacity: 'Capacidad',
  documentation: 'Documentación',
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
              <Badge
                size="xs"
                color={CATEGORY_COLORS[rule.category as keyof typeof CATEGORY_COLORS]}
              >
                {CATEGORY_NAMES[rule.category as keyof typeof CATEGORY_NAMES]}
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
            color={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}
            variant={summary.byCategory[category]?.failed > 0 ? 'filled' : 'light'}
            size="sm"
          >
            {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}: {stats.passed}/{stats.total}
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

const useBusinessRuleValidation = (
  rules: BusinessRule[],
  data: Record<string, unknown[]>,
  contextData?: Record<string, unknown>,
  autoValidate = true
) => {
  const validator = useMemo(() => {
    const enabledRuleIds = rules.filter((r) => r.enabled).map((r) => r.id);
    return new DefaultBusinessRuleValidator(rules, contextData, enabledRuleIds);
  }, [rules, contextData]);

  const { validationResults: baseValidationResults, runValidation } = useValidation(
    validator,
    data,
    autoValidate
  );

  const validationResults = useMemo(() => {
    return Object.entries(baseValidationResults)
      .filter(([_, result]) => result)
      .map(([_, result]) => result as BusinessRuleValidationResult);
  }, [baseValidationResults]);

  const toggleRule = useCallback(
    (ruleId: string) => {
      validator.toggleRule(ruleId);
      setTimeout(() => runValidation(), 0);
      return validator.isRuleEnabled(ruleId);
    },
    [validator, runValidation]
  );

  const getValidationSummary = useCallback(() => {
    const byCategory = validationResults.reduce(
      (acc, result) => {
        const cat = result.category;
        if (!acc[cat]) acc[cat] = { total: 0, passed: 0, failed: 0 };
        acc[cat].total++;
        result.passed ? acc[cat].passed++ : acc[cat].failed++;
        return acc;
      },
      {} as Record<string, { total: number; passed: number; failed: number }>
    );

    const total = validationResults.length;
    const passed = validationResults.filter((r) => r.passed).length;
    return { total, passed, failed: total - passed, byCategory };
  }, [validationResults]);

  return {
    validator,
    validationResults,
    toggleRule,
    getValidationSummary,
    runValidation,
    isValidating: false,
  };
};

interface ValidationControlsProps {
  onRevalidate: () => void;
  isValidating: boolean;
}
interface RulesListProps {
  rules: BusinessRule[];
  validationResults: BusinessRuleValidationResult[];
  validator: DefaultBusinessRuleValidator;
  expandedRules: Set<string>;
  onToggleRule: (ruleId: string) => void;
  onToggleExpansion: (ruleId: string) => void;
}

const ValidationControls: React.FC<ValidationControlsProps> = ({ onRevalidate, isValidating }) => (
  <Group justify="space-between" mb="md">
    <Title order={4}>Validación de Reglas de Negocio</Title>
    <Button
      leftSection={<IconRefresh size={16} />}
      loading={isValidating}
      onClick={onRevalidate}
      variant="light"
    >
      Revalidar
    </Button>
  </Group>
);

const RulesList: React.FC<RulesListProps> = ({
  rules,
  validationResults,
  validator,
  expandedRules,
  onToggleRule,
  onToggleExpansion,
}) => (
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
          onToggleRule={() => onToggleRule(rule.id)}
          onToggleExpansion={() => onToggleExpansion(rule.id)}
        />
      );
    })}
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
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const {
    validator,
    validationResults,
    toggleRule,
    getValidationSummary,
    runValidation,
    isValidating,
  } = useBusinessRuleValidation(rules, data, contextData, autoValidate);

  useEffect(() => {
    if (validationResults.length > 0) {
      onValidationComplete?.(validationResults);
    }
  }, [validationResults, onValidationComplete]);

  const toggleRuleExpansion = useCallback(
    (ruleId: string) => {
      const newExpanded = new Set(expandedRules);
      newExpanded.has(ruleId) ? newExpanded.delete(ruleId) : newExpanded.add(ruleId);
      setExpandedRules(newExpanded);
    },
    [expandedRules]
  );

  const handleToggleRule = useCallback(
    (ruleId: string) => {
      const enabled = toggleRule(ruleId);
      onRuleToggle?.(ruleId, enabled);
    },
    [toggleRule, onRuleToggle]
  );

  const summary = getValidationSummary();

  return (
    <Card>
      <ValidationControls onRevalidate={runValidation} isValidating={isValidating} />
      <ValidationSummary summary={summary} />
      <RulesList
        rules={rules}
        validationResults={validationResults}
        validator={validator}
        expandedRules={expandedRules}
        onToggleRule={handleToggleRule}
        onToggleExpansion={toggleRuleExpansion}
      />
    </Card>
  );
};

export default React.memo(BusinessRuleValidator);
