import { AppShell, Container, Group, ActionIcon, Text, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { Outlet } from 'react-router-dom';
import Navigation from '../ui/Navigation';
import { Breadcrumbs } from '../base';

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      onClick={() => toggleColorScheme()}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      {colorScheme === 'dark' ? <IconSun size="1.2rem" /> : <IconMoon size="1.2rem" />}
    </ActionIcon>
  );
}

export default function MainLayout() {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="100%" px="md" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Group justify="space-between" style={{ width: '100%' }}>
            <Text size="xl" fw={700}>
              Sistema de Gestión de Transporte
            </Text>
            <ThemeToggle />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Navigation />
      </AppShell.Navbar>

      <AppShell.Main>
        <Breadcrumbs />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}