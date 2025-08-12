import { Paper, Title, Text, Group, Stack, Grid } from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconWorld,
  IconId,
  IconFileText,
} from '@tabler/icons-react';
import { Empresa } from '../../types';

interface EmpresaDetailInfoProps {
  empresa: Empresa;
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

const InfoField = ({ icon, label, value }: InfoFieldProps) => (
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

export function EmpresaDetailInfo({ empresa }: EmpresaDetailInfoProps) {
  const formatDateTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Información de Contacto */}
      <Paper p="lg" withBorder>
        <Title order={3} mb="md">
          Información de Contacto
        </Title>

        <Grid>
          <Grid.Col span={6}>
            <Stack gap="md">
              <InfoField
                icon={<IconMail size="1.2rem" color="gray" />}
                label="Email"
                value={empresa.mail}
              />
              <InfoField
                icon={<IconPhone size="1.2rem" color="gray" />}
                label="Teléfono"
                value={empresa.telefono}
              />
              <InfoField
                icon={<IconWorld size="1.2rem" color="gray" />}
                label="Sitio Web"
                value={(empresa as any).sitioWeb || (empresa as any).web}
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap="md">
              <InfoField
                icon={<IconMapPin size="1.2rem" color="gray" />}
                label="Dirección"
                value={empresa.direccion}
              />
              <InfoField
                icon={<IconCalendar size="1.2rem" color="gray" />}
                label="Última Actualización"
                value={formatDateTime(empresa.updatedAt)}
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Información Legal */}
      <Paper p="lg" withBorder>
        <Title order={3} mb="md">
          Información Legal
        </Title>

        <Grid>
          <Grid.Col span={6}>
            <Stack gap="md">
              <InfoField
                icon={<IconId size="1.2rem" color="gray" />}
                label="CUIT"
                value={empresa.cuit}
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap="md">
              <InfoField
                icon={<IconFileText size="1.2rem" color="gray" />}
                label="Observaciones"
                value={empresa.observaciones}
              />
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </>
  );
}
