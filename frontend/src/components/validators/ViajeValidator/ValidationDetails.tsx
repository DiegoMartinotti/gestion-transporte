import React from 'react';
import { Collapse, Card, Title, Stack, Box, Group, Text, Divider } from '@mantine/core';
import { ValidationRule, ValidationResult } from '../BaseValidator';
import { ViajeData } from './ViajeValidatorService';

interface ValidationDetailsProps {
  detailsOpened: boolean;
  validationRules: ValidationRule<ViajeData>[];
  validationResults: Record<string, ValidationResult>;
}

export const ValidationDetails: React.FC<ValidationDetailsProps> = ({
  detailsOpened,
  validationRules,
  validationResults,
}) => {
  return (
    <Collapse in={detailsOpened}>
      <Card withBorder>
        <Title order={5} mb="md">
          Detalles de Validación
        </Title>

        <Stack gap="md">
          {Object.entries(
            validationRules.reduce(
              (acc, rule) => {
                if (!acc[rule.category]) {
                  acc[rule.category] = [];
                }
                acc[rule.category].push(rule);
                return acc;
              },
              {} as Record<string, ValidationRule<ViajeData>[]>
            )
          ).map(([category, rules]) => (
            <Box key={category}>
              <Group mb="xs">
                <Text fw={500}>{category}</Text>
              </Group>

              <Stack gap="xs" pl="md">
                {rules.map((rule) => {
                  const result = validationResults[rule.id];
                  if (!result) return null;

                  return (
                    <Group key={rule.id} justify="space-between">
                      <Group gap="xs">
                        <Text
                          size="sm"
                          c={result.passed ? 'green' : rule.severity === 'error' ? 'red' : 'orange'}
                        >
                          {result.passed ? '✓' : '✗'}
                        </Text>
                        <Text size="sm">{rule.name}</Text>
                      </Group>
                      <Text size="sm" c={result.passed ? 'green' : 'dimmed'}>
                        {result.message}
                      </Text>
                    </Group>
                  );
                })}
              </Stack>

              <Divider mt="sm" />
            </Box>
          ))}
        </Stack>
      </Card>
    </Collapse>
  );
};
