import {
  Paper,
  Stack,
  Title,
  Group,
  Text,
  Avatar,
  Badge,
  Button,
  ScrollArea,
  ActionIcon,
  Divider,
} from '@mantine/core';
import {
  IconRefresh,
  IconEye,
  IconTruck,
  IconUser,
  IconFileInvoice,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { ActivityItem, MOCK_ACTIVITIES } from './mockActivityData';

dayjs.extend(relativeTime);
dayjs.locale('es');

interface RecentActivityProps {
  limit?: number;
  showHeader?: boolean;
  height?: number;
}

// Helper function for status colors
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'success':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    case 'info':
    default:
      return 'blue';
  }
};

// Helper function for activity icons
const getActivityIcon = (activity: ActivityItem) => {
  if (activity.icon) {
    return <activity.icon size={16} />;
  }

  switch (activity.type) {
    case 'viaje':
      return <IconTruck size={16} />;
    case 'cliente':
      return <IconUser size={16} />;
    case 'vehiculo':
      return <IconTruck size={16} />;
    case 'factura':
      return <IconFileInvoice size={16} />;
    case 'alerta':
      return <IconAlertTriangle size={16} />;
    default:
      return <IconEye size={16} />;
  }
};

// Skeleton component for loading state
const ActivityItemSkeleton = ({ index }: { index: number }) => (
  <Group key={index} gap="md" p="sm">
    <Avatar size="sm" radius="md" />
    <Stack gap={4} flex={1}>
      <div style={{ height: 12, background: '#f1f3f4', borderRadius: 4, width: '70%' }} />
      <div style={{ height: 10, background: '#f1f3f4', borderRadius: 4, width: '50%' }} />
    </Stack>
  </Group>
);

// Individual activity item component
const ActivityItemComponent = ({
  activity,
  index,
  totalItems,
}: {
  activity: ActivityItem;
  index: number;
  totalItems: number;
}) => (
  <div key={activity.id}>
    <Group gap="md" p="sm" style={{ borderRadius: 8 }}>
      <Avatar size="sm" radius="md" color={getStatusColor(activity.status)} variant="light">
        {getActivityIcon(activity)}
      </Avatar>

      <Stack gap={2} flex={1}>
        <Group justify="space-between">
          <Text fw={500} size="sm" lineClamp={1}>
            {activity.title}
          </Text>
          <Group gap={4}>
            {activity.status && (
              <Badge size="xs" color={getStatusColor(activity.status)} variant="dot">
                {activity.status}
              </Badge>
            )}
            <Text size="xs" c="dimmed">
              {dayjs(activity.timestamp).fromNow()}
            </Text>
          </Group>
        </Group>

        <Text size="xs" c="dimmed" lineClamp={2}>
          {activity.description}
        </Text>

        {activity.user && (
          <Text size="xs" c="dimmed" fs="italic">
            por {activity.user}
          </Text>
        )}
      </Stack>

      {activity.entityId && (
        <ActionIcon size="sm" variant="subtle" color="gray">
          <IconEye size={12} />
        </ActionIcon>
      )}
    </Group>

    {index < totalItems - 1 && <Divider size="xs" />}
  </div>
);

export const RecentActivity = ({
  limit = 10,
  showHeader = true,
  height = 400,
}: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const mockActivities = useMemo(() => MOCK_ACTIVITIES, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setActivities(mockActivities.slice(0, limit));
    setLoading(false);
  }, [mockActivities, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        {showHeader && (
          <Group justify="space-between">
            <Title order={4}>Actividad Reciente</Title>
            <ActionIcon variant="subtle" onClick={fetchActivities} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        )}

        <ScrollArea h={height} scrollbarSize={8}>
          <Stack gap="xs">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <ActivityItemSkeleton key={index} index={index} />
                ))
              : activities.map((activity, index) => (
                  <ActivityItemComponent
                    key={activity.id}
                    activity={activity}
                    index={index}
                    totalItems={activities.length}
                  />
                ))}
          </Stack>
        </ScrollArea>

        {activities.length > 0 && (
          <Group justify="center">
            <Button variant="subtle" size="sm">
              Ver toda la actividad
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
};
