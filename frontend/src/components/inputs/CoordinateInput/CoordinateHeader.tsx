import React from 'react';
import { Group, Text, Badge, Stack } from '@mantine/core';

interface CoordinateHeaderProps {
  label: string;
  description?: string;
  required: boolean;
  showValidation: boolean;
  isValid: boolean;
  value: { lat: number; lng: number };
}

export default function CoordinateHeader({
  label,
  description,
  required,
  showValidation,
  isValid,
  value,
}: CoordinateHeaderProps) {
  const getBadgeProps = () => {
    if (isValid) {
      return { color: 'green', text: 'Válidas' };
    }
    if (value.lat === 0 && value.lng === 0) {
      return { color: 'gray', text: 'Sin coordenadas' };
    }
    return { color: 'red', text: 'Inválidas' };
  };

  const badgeProps = getBadgeProps();

  return (
    <Group justify="space-between" align="end">
      <Stack gap={2}>
        <Text size="sm" fw={500}>
          {label}
          {required && (
            <Text component="span" c="red">
              {' '}
              *
            </Text>
          )}
        </Text>
        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>

      {showValidation && (
        <Badge color={badgeProps.color} variant="light" size="sm">
          {badgeProps.text}
        </Badge>
      )}
    </Group>
  );
}
