import { NavLink, Stack, Divider, Text, Group, Avatar, ActionIcon } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  IconDashboard, 
  IconUsers, 
  IconBuilding, 
  IconUser, 
  IconMapPin, 
  IconRoute, 
  IconTruck, 
  IconMap,
  IconLogout,
  IconCalculator,
  IconCoin,
  IconFileText
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const navigationItems = [
  { label: 'Dashboard', icon: IconDashboard, link: '/' },
  { label: 'Clientes', icon: IconUsers, link: '/clientes' },
  { label: 'Empresas', icon: IconBuilding, link: '/empresas' },
  { label: 'Personal', icon: IconUser, link: '/personal' },
  { label: 'Sites', icon: IconMapPin, link: '/sites' },
  { label: 'Tramos', icon: IconRoute, link: '/tramos' },
  { label: 'Vehículos', icon: IconTruck, link: '/vehiculos' },
  { label: 'Extras', icon: IconCoin, link: '/extras' },
  { label: 'Viajes', icon: IconMap, link: '/viajes' },
  { label: 'Órdenes de Compra', icon: IconFileText, link: '/ordenes-compra' },
  { label: 'Calculadora', icon: IconCalculator, link: '/calculadora' },
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Stack h="100%" justify="space-between">
      <Stack gap="xs">
        {navigationItems.map((item) => (
          <NavLink
            key={item.link}
            href={item.link}
            label={item.label}
            leftSection={<item.icon size="1rem" stroke={1.5} />}
            active={location.pathname === item.link}
            onClick={(event) => {
              event.preventDefault();
              navigate(item.link);
            }}
          />
        ))}
      </Stack>

      <Stack gap="xs">
        <Divider />
        <Group justify="space-between" px="sm">
          <Group gap="xs">
            <Avatar size={32} radius="xl" color="blue">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {user?.nombre}
              </Text>
              <Text size="xs" c="dimmed">
                {user?.email}
              </Text>
            </Stack>
          </Group>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <IconLogout size="1rem" />
          </ActionIcon>
        </Group>
      </Stack>
    </Stack>
  );
}