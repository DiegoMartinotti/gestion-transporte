import { Stack, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface FieldWrapperProps {
  label?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FieldWrapper({
  label,
  description,
  required,
  children
}: FieldWrapperProps) {
  return (
    <Stack gap="xs">
      {label && (
        <Text size="sm" fw={500}>
          {label}
          {required && <Text component="span" c="red" ml={4}>*</Text>}
        </Text>
      )}
      
      {children}
      
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
    </Stack>
  );
}