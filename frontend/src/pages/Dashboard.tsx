import { Container, Title, Text, SimpleGrid, Card, Group, ThemeIcon } from '@mantine/core';
import { IconUsers, IconBuilding, IconUser, IconMapPin, IconRoute, IconTruck, IconMap } from '@tabler/icons-react';

const stats = [
  { title: 'Clientes', value: '0', icon: IconUsers, color: 'blue' },
  { title: 'Empresas', value: '0', icon: IconBuilding, color: 'green' },
  { title: 'Personal', value: '0', icon: IconUser, color: 'yellow' },
  { title: 'Sites', value: '0', icon: IconMapPin, color: 'red' },
  { title: 'Tramos', value: '0', icon: IconRoute, color: 'violet' },
  { title: 'Vehículos', value: '0', icon: IconTruck, color: 'orange' },
  { title: 'Viajes', value: '0', icon: IconMap, color: 'teal' },
];

export default function Dashboard() {
  return (
    <Container size="xl">
      <Title order={1} mb="xl">Dashboard</Title>
      
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="lg">
        {stats.map((stat) => (
          <Card key={stat.title} p="lg" radius="md" withBorder>
            <Group justify="apart">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {stat.title}
                </Text>
                <Text fw={700} size="xl">
                  {stat.value}
                </Text>
              </div>
              <ThemeIcon color={stat.color} size={38} radius="md">
                <stat.icon size="1.1rem" stroke={1.5} />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Card mt="xl" p="lg" radius="md" withBorder>
        <Title order={2} size="h3" mb="md">
          Bienvenido al Sistema de Gestión de Transporte
        </Title>
        <Text c="dimmed">
          Sistema completo para la gestión de operaciones de transporte, incluyendo clientes, 
          sitios, rutas, vehículos, viajes y facturación.
        </Text>
      </Card>
    </Container>
  );
}