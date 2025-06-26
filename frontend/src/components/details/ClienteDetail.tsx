import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Divider,
  Grid,
  Card,
  Avatar,
  Button,
  Tooltip,
  Alert
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconUser,
  IconEdit,
  IconTrash,
  IconMapSearch,
  IconRoute,
  IconCalendar,
  IconAlertCircle,
  IconPlus
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { Cliente } from '../../types';
import LoadingOverlay from '../base/LoadingOverlay';

interface ClienteDetailProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
  onCreateSite?: (cliente: Cliente) => void;
  onCreateTramo?: (cliente: Cliente) => void;
  onViewSites?: (cliente: Cliente) => void;
  onViewTramos?: (cliente: Cliente) => void;
  loading?: boolean;
}

export function ClienteDetail({
  cliente,
  onEdit,
  onDelete,
  onCreateSite,
  onCreateTramo,
  onViewSites,
  onViewTramos,
  loading = false
}: ClienteDetailProps) {
  const [sitesCount, setSitesCount] = useState(0);
  const [tramosCount, setTramosCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const initials = cliente.nombre
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // TODO: Implementar carga de estadísticas cuando estén disponibles los servicios
  useEffect(() => {
    // Simulación de carga de estadísticas
    setLoadingStats(true);
    setTimeout(() => {
      setSitesCount(0);
      setTramosCount(0);
      setLoadingStats(false);
    }, 500);
  }, [cliente._id]);

  if (loading) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  return (
    <Stack gap="lg">
      {/* Header del Cliente */}
      <Paper p="lg" withBorder>
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar
              color="blue"
              radius="xl"
              size="xl"
            >
              {initials}
            </Avatar>
            
            <Stack gap="xs">
              <Group gap="sm" align="center">
                <Title order={2}>{cliente.nombre}</Title>
                <Badge
                  color={cliente.activo ? 'green' : 'red'}
                  variant="light"
                  size="lg"
                >
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </Group>
              
              <Text c="dimmed" size="sm">
                Cliente registrado el {new Date(cliente.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Stack>
          </Group>

          <Group gap="sm">
            {onEdit && (
              <Button
                variant="outline"
                leftSection={<IconEdit size="1rem" />}
                onClick={() => onEdit(cliente)}
              >
                Editar
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size="1rem" />}
                onClick={() => onDelete(cliente)}
              >
                Eliminar
              </Button>
            )}
          </Group>
        </Group>

        {!cliente.activo && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            color="yellow"
            variant="light"
            mt="md"
          >
            <strong>Cliente Inactivo:</strong> Este cliente no puede ser utilizado 
            para crear nuevos viajes, tramos o sites.
          </Alert>
        )}
      </Paper>

      {/* Información de Contacto */}
      <Paper p="lg" withBorder>
        <Title order={3} mb="md">Información de Contacto</Title>
        
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="md">
              {cliente.email ? (
                <Group gap="sm">
                  <IconMail size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text>{cliente.email}</Text>
                  </Stack>
                </Group>
              ) : (
                <Group gap="sm">
                  <IconMail size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text c="dimmed">No especificado</Text>
                  </Stack>
                </Group>
              )}

              {cliente.telefono ? (
                <Group gap="sm">
                  <IconPhone size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Teléfono</Text>
                    <Text>{cliente.telefono}</Text>
                  </Stack>
                </Group>
              ) : (
                <Group gap="sm">
                  <IconPhone size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Teléfono</Text>
                    <Text c="dimmed">No especificado</Text>
                  </Stack>
                </Group>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap="md">
              {cliente.contacto ? (
                <Group gap="sm">
                  <IconUser size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Persona de Contacto</Text>
                    <Text>{cliente.contacto}</Text>
                  </Stack>
                </Group>
              ) : (
                <Group gap="sm">
                  <IconUser size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Persona de Contacto</Text>
                    <Text c="dimmed">No especificado</Text>
                  </Stack>
                </Group>
              )}

              <Group gap="sm" align="flex-start">
                <IconCalendar size="1.2rem" color="gray" />
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">Última Actualización</Text>
                  <Text>
                    {new Date(cliente.updatedAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </Stack>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>

        {cliente.direccion && (
          <>
            <Divider my="md" />
            <Group gap="sm" align="flex-start">
              <IconMapPin size="1.2rem" color="gray" />
              <Stack gap={2}>
                <Text size="sm" c="dimmed">Dirección</Text>
                <Text>{cliente.direccion}</Text>
              </Stack>
            </Group>
          </>
        )}
      </Paper>

      {/* Estadísticas y Acciones Rápidas */}
      <Grid>
        <Grid.Col span={6}>
          <Card p="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Group gap="sm">
                  <IconMapSearch size="1.5rem" color="blue" />
                  <Title order={4}>Sites</Title>
                </Group>
                
                <Text size="xl" fw={700}>
                  {loadingStats ? '...' : sitesCount}
                </Text>
                
                <Text size="sm" c="dimmed">
                  Ubicaciones registradas
                </Text>
              </Stack>

              <Group gap="xs">
                {onViewSites && (
                  <Tooltip label="Ver todos los sites">
                    <ActionIcon
                      variant="light"
                      onClick={() => onViewSites(cliente)}
                    >
                      <IconMapSearch size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
                
                {onCreateSite && (
                  <Tooltip label="Crear nuevo site">
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => onCreateSite(cliente)}
                    >
                      <IconPlus size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card p="lg" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Group gap="sm">
                  <IconRoute size="1.5rem" color="green" />
                  <Title order={4}>Tramos</Title>
                </Group>
                
                <Text size="xl" fw={700}>
                  {loadingStats ? '...' : tramosCount}
                </Text>
                
                <Text size="sm" c="dimmed">
                  Rutas configuradas
                </Text>
              </Stack>

              <Group gap="xs">
                {onViewTramos && (
                  <Tooltip label="Ver todos los tramos">
                    <ActionIcon
                      variant="light"
                      onClick={() => onViewTramos(cliente)}
                    >
                      <IconRoute size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
                
                {onCreateTramo && (
                  <Tooltip label="Crear nuevo tramo">
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => onCreateTramo(cliente)}
                    >
                      <IconPlus size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}