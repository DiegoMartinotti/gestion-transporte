import React from 'react';
import { Stack, Text, Grid, Card, Group } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { ExportFormat } from '../../../types/reports';
import { FORMAT_OPTIONS } from './constants';

interface FormatSelectorProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
}) => {
  return (
    <Stack gap="sm">
      <Text fw={500} size="sm">
        Formato de Exportación
      </Text>
      <Grid>
        {FORMAT_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedFormat === option.value;

          return (
            <Grid.Col key={option.value} span={6}>
              <Card
                withBorder
                p="sm"
                style={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                  borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                }}
                onClick={() => onFormatChange(option.value)}
              >
                <Group gap="xs">
                  <IconComponent size={24} color={`var(--mantine-color-${option.color}-6)`} />
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {option.label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {option.description}
                    </Text>
                  </div>
                  {isSelected && <IconCheck size={16} color="var(--mantine-color-blue-6)" />}
                </Group>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
};
