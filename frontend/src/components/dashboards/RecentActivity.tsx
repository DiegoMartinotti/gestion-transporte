import { Paper, Stack, Title, Group, Text, Avatar, Badge, Button, ScrollArea, ActionIcon, Divider } from '@mantine/core';
import { IconRefresh, IconEye, IconTruck, IconUser, IconMapPin, IconFileInvoice, IconAlertTriangle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

interface ActivityItem {
  id: string;
  type: 'viaje' | 'cliente' | 'vehiculo' | 'factura' | 'alerta';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  entityId?: string;
  icon?: React.ComponentType<any>;
}

interface RecentActivityProps {
  limit?: number;
  showHeader?: boolean;
  height?: number;
}

export const RecentActivity = ({ limit = 10, showHeader = true, height = 400 }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    // Simulando datos - en producción sería una llamada real a la API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'viaje',
        title: 'Viaje completado',
        description: 'Viaje #VJ-2024-0156 - Buenos Aires → Córdoba',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
        user: 'Carlos Mendez',
        status: 'success',
        entityId: 'VJ-2024-0156',
        icon: IconTruck
      },
      {
        id: '2',
        type: 'cliente',
        title: 'Nuevo cliente registrado',
        description: 'Transportes San Juan S.A. - Registro completado',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
        user: 'Admin Sistema',
        status: 'info',
        entityId: 'CLI-0028',
        icon: IconUser
      },
      {
        id: '3',
        type: 'alerta',
        title: 'Documento vencido',
        description: 'Seguro vehículo PAT123 vence en 3 días',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        user: 'Sistema',
        status: 'warning',
        entityId: 'VEH-PAT123',
        icon: IconAlertTriangle
      },
      {
        id: '4',
        type: 'factura',
        title: 'Factura generada',
        description: 'Factura #FC-2024-0089 - Monto: $450.000',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        user: 'María González',
        status: 'success',
        entityId: 'FC-2024-0089',
        icon: IconFileInvoice
      },
      {
        id: '5',
        type: 'vehiculo',
        title: 'Vehículo en mantenimiento',
        description: 'Camión PAT456 ingresó a mantenimiento programado',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        user: 'Juan Pérez',
        status: 'info',
        entityId: 'VEH-PAT456',
        icon: IconTruck
      },
      {
        id: '6',
        type: 'viaje',
        title: 'Viaje iniciado',
        description: 'Viaje #VJ-2024-0157 - Rosario → Mendoza',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        user: 'Roberto Silva',
        status: 'info',
        entityId: 'VJ-2024-0157',
        icon: IconTruck
      },
      {
        id: '7',
        type: 'cliente',
        title: 'Site actualizado',
        description: 'Nuevas coordenadas para depósito central - Logística Norte',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        user: 'Ana Rodríguez',
        status: 'info',
        entityId: 'SITE-0142',
        icon: IconMapPin
      },
      {
        id: '8',
        type: 'alerta',
        title: 'Licencia por vencer',
        description: 'Licencia de conducir Juan Pérez vence en 7 días',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        user: 'Sistema',
        status: 'warning',
        entityId: 'PER-0015',
        icon: IconAlertTriangle
      }
    ];

    setActivities(mockActivities.slice(0, limit));
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [limit]);

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

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        {showHeader && (
          <Group justify="space-between">
            <Title order={4}>Actividad Reciente</Title>
            <ActionIcon 
              variant="subtle" 
              onClick={fetchActivities}
              loading={loading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        )}

        <ScrollArea h={height} scrollbarSize={8}>
          <Stack gap="xs">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Group key={index} gap="md" p="sm">
                  <Avatar size="sm" radius="md" />
                  <Stack gap={4} flex={1}>
                    <div style={{ height: 12, background: '#f1f3f4', borderRadius: 4, width: '70%' }} />
                    <div style={{ height: 10, background: '#f1f3f4', borderRadius: 4, width: '50%' }} />
                  </Stack>
                </Group>
              ))
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id}>
                  <Group gap="md" p="sm" style={{ borderRadius: 8 }}>
                    <Avatar 
                      size="sm" 
                      radius="md" 
                      color={getStatusColor(activity.status)}
                      variant="light"
                    >
                      {getActivityIcon(activity)}
                    </Avatar>
                    
                    <Stack gap={2} flex={1}>
                      <Group justify="space-between">
                        <Text fw={500} size="sm" lineClamp={1}>
                          {activity.title}
                        </Text>
                        <Group gap={4}>
                          {activity.status && (
                            <Badge 
                              size="xs" 
                              color={getStatusColor(activity.status)}
                              variant="dot"
                            >
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
                  
                  {index < activities.length - 1 && <Divider size="xs" />}
                </div>
              ))
            )}
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