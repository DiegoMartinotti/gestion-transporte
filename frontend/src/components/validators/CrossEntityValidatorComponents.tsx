// Componentes de UI para CrossEntityValidator
import React from 'react';
import { Box, Text, List, Badge, Group, ActionIcon, Collapse, Card } from '@mantine/core';
import { IconCheck, IconX, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import {
  CrossEntityValidationResult,
  CrossEntityRuleConfig,
  ValidationDetail,
} from './CrossEntityValidatorTypes';

export const getRuleIcon = (result: CrossEntityValidationResult, rule: CrossEntityRuleConfig) =>
  result.passed ? (
    <IconCheck size={16} color="green" />
  ) : (
    <IconX size={16} color={rule.severity === 'error' ? 'red' : 'orange'} />
  );

export const getBadgeColor = (severity: string) =>
  severity === 'error' ? 'red' : severity === 'warning' ? 'yellow' : 'blue';

export const DetailsList: React.FC<{ details: ValidationDetail[] }> = ({ details }) => (
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

export const ValidationRuleCard: React.FC<{
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
              <Badge size="xs" variant="light">
                {rule.entityType} → {rule.dependencies.join(', ')}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" mt="xs">
              {rule.description}
            </Text>
            <Text size="sm" mt="xs" c={result.passed ? 'green' : 'red'}>
              {result.message}
            </Text>
            {result.affectedRecords > 0 && (
              <Badge size="xs" variant="light" mt="xs">
                {result.affectedRecords} afectados
              </Badge>
            )}
          </Box>
        </Group>

        {hasDetails && (
          <ActionIcon variant="subtle" onClick={() => onToggle(result.ruleId)}>
            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>

      {hasDetails && (
        <Collapse in={isExpanded}>
          <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Text size="sm" fw={500} mb="xs">
              Registros con problemas ({result.details?.length}):
            </Text>
            <DetailsList details={result.details || []} />
          </Box>
        </Collapse>
      )}
    </Card>
  );
};
