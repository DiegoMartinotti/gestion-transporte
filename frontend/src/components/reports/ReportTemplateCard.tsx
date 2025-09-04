import React from 'react';
import { Card, Stack, Group, Badge, Title, Text } from '@mantine/core';
import { ReportTemplate } from '../../types/reports';

interface ReportTemplateCardProps {
  template: ReportTemplate;
  onUse: (template: ReportTemplate) => void;
}

export const ReportTemplateCard: React.FC<ReportTemplateCardProps> = ({ template, onUse }) => (
  <Card withBorder p="md" style={{ cursor: 'pointer' }} onClick={() => onUse(template)}>
    <Stack gap="sm">
      <Group justify="space-between">
        <Badge variant="light" size="sm">
          {template.category}
        </Badge>
        {template.isPopular && (
          <Badge color="yellow" size="sm">
            Popular
          </Badge>
        )}
      </Group>
      <Title order={5}>{template.name}</Title>
      <Text size="sm" c="dimmed" lineClamp={2}>
        {template.description}
      </Text>
      <Group gap="xs">
        {template.tags.map((tag) => (
          <Badge key={tag} variant="outline" size="xs">
            {tag}
          </Badge>
        ))}
      </Group>
    </Stack>
  </Card>
);
