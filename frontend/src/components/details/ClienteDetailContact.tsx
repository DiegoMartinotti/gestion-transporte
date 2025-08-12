import { Paper, Title, Text, Group, Stack, Grid, Divider } from '@mantine/core';
import { IconMail, IconPhone, IconUser, IconCalendar, IconMapPin } from '@tabler/icons-react';
import { Cliente } from '../../types';

interface ClienteDetailContactProps {
  cliente: Cliente;
}

interface ContactFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

const ContactField = ({ icon, label, value }: ContactFieldProps) => (
  <Group gap="sm" align="flex-start">
    {icon}
    <Stack gap={2}>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text>
        {value || (
          <Text component="span" c="dimmed">
            No especificado
          </Text>
        )}
      </Text>
    </Stack>
  </Group>
);

export function ClienteDetailContact({ cliente }: ClienteDetailContactProps) {
  const formatDateTime = (date: string) =>
    new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Paper p="lg" withBorder>
      <Title order={3} mb="md">
        Información de Contacto
      </Title>

      <Grid>
        <Grid.Col span={6}>
          <Stack gap="md">
            <ContactField
              icon={<IconMail size="1.2rem" color="gray" />}
              label="Email"
              value={cliente.email}
            />
            <ContactField
              icon={<IconPhone size="1.2rem" color="gray" />}
              label="Teléfono"
              value={cliente.telefono}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={6}>
          <Stack gap="md">
            <ContactField
              icon={<IconUser size="1.2rem" color="gray" />}
              label="Persona de Contacto"
              value={cliente.contacto}
            />
            <ContactField
              icon={<IconCalendar size="1.2rem" color="gray" />}
              label="Última Actualización"
              value={formatDateTime(cliente.updatedAt)}
            />
          </Stack>
        </Grid.Col>
      </Grid>

      {cliente.direccion && (
        <>
          <Divider my="md" />
          <ContactField
            icon={<IconMapPin size="1.2rem" color="gray" />}
            label="Dirección"
            value={cliente.direccion}
          />
        </>
      )}
    </Paper>
  );
}
