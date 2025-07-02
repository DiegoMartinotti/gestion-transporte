import { Text } from '@mantine/core';

interface VariableHelperProps {
  variables?: string[];
}

export function VariableHelper({ variables = [] }: VariableHelperProps) {
  return <Text size="sm">Variables: {variables.join(', ')}</Text>;
}
