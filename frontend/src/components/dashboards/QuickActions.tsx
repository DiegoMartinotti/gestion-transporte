import {
  Paper,
  SimpleGrid,
  UnstyledButton,
  Text,
  Group,
  ThemeIcon,
  Stack,
  Badge,
} from '@mantine/core';
import {
  IconTruck,
  IconMapPin,
  IconRoute,
  IconFileInvoice,
  IconUserPlus,
  IconTruckDelivery,
  IconReportAnalytics,
  IconSettings,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  path: string;
  badge?: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  compact?: boolean;
}

export const QuickActions = ({ compact = false }: QuickActionsProps) => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'nuevo-viaje',
      title: 'Nuevo Viaje',
      description: 'Crear un nuevo viaje',
      icon: IconTruckDelivery,
      color: 'blue',
      path: '/viajes/nuevo',
    },
    {
      id: 'nuevo-cliente',
      title: 'Nuevo Cliente',
      description: 'Registrar cliente',
      icon: IconUserPlus,
      color: 'green',
      path: '/clientes/nuevo',
    },
    {
      id: 'nuevo-vehiculo',
      title: 'Nuevo Vehículo',
      description: 'Agregar vehículo',
      icon: IconTruck,
      color: 'orange',
      path: '/vehiculos/nuevo',
    },
    {
      id: 'nuevo-site',
      title: 'Nuevo Site',
      description: 'Agregar ubicación',
      icon: IconMapPin,
      color: 'cyan',
      path: '/sites/nuevo',
    },
    {
      id: 'nuevo-tramo',
      title: 'Nuevo Tramo',
      description: 'Definir ruta',
      icon: IconRoute,
      color: 'violet',
      path: '/tramos/nuevo',
    },
    {
      id: 'facturacion',
      title: 'Facturación',
      description: 'Generar facturas',
      icon: IconFileInvoice,
      color: 'indigo',
      path: '/facturacion',
      badge: '12 pendientes',
    },
    {
      id: 'reportes',
      title: 'Reportes',
      description: 'Ver informes',
      icon: IconReportAnalytics,
      color: 'teal',
      path: '/reportes',
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: IconSettings,
      color: 'gray',
      path: '/configuracion',
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    if (!action.disabled) {
      navigate(action.path);
    }
  };

  const displayActions = compact ? actions.slice(0, 6) : actions;

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
      {displayActions.map((action) => (
        <Paper
          key={action.id}
          p="md"
          radius="md"
          withBorder
          style={{
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            opacity: action.disabled ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          className="hover:shadow-md"
        >
          <UnstyledButton
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            w="100%"
          >
            <Stack gap="sm" align="center" ta="center">
              <Group justify="center" pos="relative">
                <ThemeIcon size="xl" radius="md" color={action.color} variant="light">
                  <action.icon size={24} />
                </ThemeIcon>
                {action.badge && (
                  <Badge
                    size="xs"
                    color={action.color}
                    pos="absolute"
                    top={-5}
                    right={-5}
                    style={{ transform: 'translate(50%, -50%)' }}
                  >
                    {action.badge}
                  </Badge>
                )}
              </Group>

              <div>
                <Text fw={600} size="sm" lineClamp={1}>
                  {action.title}
                </Text>
                {!compact && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {action.description}
                  </Text>
                )}
              </div>
            </Stack>
          </UnstyledButton>
        </Paper>
      ))}
    </SimpleGrid>
  );
};
