import React from 'react';
import { Stack, Paper, Group, Box, Title, Text, Badge, Grid, Tabs } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { StatusTrackerItem, StatusConfig } from '../StatusTrackerBase';
import { DOMAIN_ICONS } from '../utils/statusHelpers';
import { StatusProgress } from './StatusProgress';
import { StatusMetadata } from './StatusMetadata';
import { StatusTimeline } from './StatusTimeline';
import { StatusActions } from './StatusActions';

interface StatusDetailedViewProps {
  item: StatusTrackerItem;
  config: StatusConfig;
  currentStatusConfig?: StatusConfig['estados'][0];
  allowedNextStates: StatusConfig['estados'];
  domain: 'viajes' | 'pagos' | 'general';
  showProgress: boolean;
  showMetadata: boolean;
  showEvents: boolean;
  showActions: boolean;
  readonly: boolean;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  customTabs: Array<{ label: string; content: React.ReactNode }>;
  customActions?: React.ReactNode;
  onOpenStatusModal: () => void;
  onOpenEventModal: () => void;
}

export const StatusDetailedView: React.FC<StatusDetailedViewProps> = ({
  item,
  config,
  currentStatusConfig,
  allowedNextStates,
  domain,
  showProgress,
  showMetadata,
  showEvents,
  showActions,
  readonly,
  selectedTab,
  setSelectedTab,
  customTabs,
  customActions,
  onOpenStatusModal,
  onOpenEventModal,
}) => {
  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Group justify="space-between" mb="md">
          <Group>
            {React.createElement(DOMAIN_ICONS[domain], { size: 24 })}
            <Box>
              <Title order={4}>{item.titulo}</Title>
              {item.descripcion && (
                <Text size="sm" c="dimmed">
                  {item.descripcion}
                </Text>
              )}
            </Box>
          </Group>

          <Group gap="xs">
            <Badge
              size="lg"
              color={currentStatusConfig?.color || 'gray'}
              leftSection={currentStatusConfig?.icon}
            >
              {currentStatusConfig?.label || item.estadoActual}
            </Badge>
          </Group>
        </Group>

        <Grid>
          <Grid.Col span={6}>
            {showProgress && (
              <StatusProgress
                item={item}
                config={config}
                currentStatusConfig={currentStatusConfig}
              />
            )}
          </Grid.Col>
          <Grid.Col span={6}>
            {showMetadata && <StatusMetadata item={item} domain={domain} />}
          </Grid.Col>
        </Grid>
      </Paper>

      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'timeline')}>
        <Tabs.List>
          <Tabs.Tab value="timeline" leftSection={<IconHistory size={16} />}>
            Timeline
          </Tabs.Tab>
          {customTabs.map((tab) => (
            <Tabs.Tab key={tab.label} value={tab.label.toLowerCase()}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="timeline" pt="md">
          {showEvents && <StatusTimeline item={item} />}
        </Tabs.Panel>

        {customTabs.map((tab) => (
          <Tabs.Panel key={tab.label} value={tab.label.toLowerCase()} pt="md">
            {tab.content}
          </Tabs.Panel>
        ))}
      </Tabs>

      {showActions && !readonly && (
        <StatusActions
          allowedNextStates={allowedNextStates}
          onOpenStatusModal={onOpenStatusModal}
          onOpenEventModal={onOpenEventModal}
          customActions={customActions}
        />
      )}
    </Stack>
  );
};
