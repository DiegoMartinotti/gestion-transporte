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
  IconTruck,
  IconUsers,
  IconCalendar,
  IconAlertCircle,
  IconPlus,
  IconWorld,
  IconBuilding,
  IconId,
  IconFileText
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { Empresa } from '../../types';
import LoadingOverlay from '../base/LoadingOverlay';

interface EmpresaDetailProps {
  empresa: Empresa;
  onEdit?: (empresa: Empresa) => void;
  onDelete?: (empresa: Empresa) => void;
  onCreateVehiculo?: (empresa: Empresa) => void;
  onCreatePersonal?: (empresa: Empresa) => void;
  onViewVehiculos?: (empresa: Empresa) => void;
  onViewPersonal?: (empresa: Empresa) => void;
  loading?: boolean;
}

export function EmpresaDetail({
  empresa,
  onEdit,
  onDelete,
  onCreateVehiculo,
  onCreatePersonal,
  onViewVehiculos,
  onViewPersonal,
  loading = false
}: EmpresaDetailProps) {
  const [vehiculosCount, setVehiculosCount] = useState(0);
  const [personalCount, setPersonalCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  const initials = empresa.nombre
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const tipoColor = empresa.tipo === 'Propia' ? 'blue' : 'orange';

  // TODO: Implementar carga de estadísticas cuando estén disponibles los servicios
  useEffect(() => {
    // Simulación de carga de estadísticas
    setLoadingStats(true);
    setTimeout(() => {
      setVehiculosCount(empresa.flota?.length || 0);
      setPersonalCount(empresa.personal?.length || 0);
      setLoadingStats(false);
    }, 500);
  }, [empresa._id, empresa.flota, empresa.personal]);

  if (loading) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  return (
    <Stack gap="lg">
      {/* Header de la Empresa */}
      <Paper p="lg" withBorder>
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar
              color={tipoColor}
              radius="xl"
              size="xl"
            >
              {initials}
            </Avatar>
            
            <Stack gap="xs">
              <Group gap="sm" align="center">
                <Title order={2}>{empresa.nombre}</Title>
                <Badge
                  color={tipoColor}
                  variant="light"
                  size="lg"
                >
                  {empresa.tipo}
                </Badge>
                <Badge
                  color={empresa.activa ? 'green' : 'red'}
                  variant="light"
                  size="lg"
                >
                  {empresa.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </Group>
              
              {empresa.razonSocial && (
                <Text c="dimmed" size="md" fw={500}>
                  {empresa.razonSocial}
                </Text>
              )}
              
              <Text c="dimmed" size="sm">
                Empresa registrada el {new Date(empresa.createdAt).toLocaleDateString('es-AR', {
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
                onClick={() => onEdit(empresa)}
              >
                Editar
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size="1rem" />}
                onClick={() => onDelete(empresa)}
              >
                Eliminar
              </Button>
            )}
          </Group>
        </Group>

        {!empresa.activa && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            color="yellow"
            variant="light"
            mt="md"
          >
            <strong>Empresa Inactiva:</strong> Esta empresa no puede ser utilizada 
            para asignar personal o vehículos a viajes.
          </Alert>
        )}

        {empresa.tipo === 'Subcontratada' && (
          <Alert 
            icon={<IconBuilding size="1rem" />} 
            color="blue"
            variant="light"
            mt="md"
          >
            <strong>Empresa Subcontratada:</strong> Esta empresa es utilizada 
            para servicios externos y puede tener personal y vehículos asignados.
          </Alert>
        )}
      </Paper>

      {/* Información de Contacto */}
      <Paper p="lg" withBorder>
        <Title order={3} mb="md">Información de Contacto</Title>
        
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="md">
              {empresa.mail ? (
                <Group gap="sm">
                  <IconMail size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text>{empresa.mail}</Text>
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

              {empresa.telefono ? (
                <Group gap="sm">
                  <IconPhone size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Teléfono</Text>
                    <Text>{empresa.telefono}</Text>
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

              {empresa.sitioWeb ? (
                <Group gap="sm">
                  <IconWorld size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Sitio Web</Text>
                    <Text 
                      component="a"
                      href={empresa.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#228be6';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'inherit';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {empresa.sitioWeb}
                    </Text>
                  </Stack>
                </Group>
              ) : (
                <Group gap="sm">
                  <IconWorld size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Sitio Web</Text>
                    <Text c="dimmed">No especificado</Text>
                  </Stack>
                </Group>
              )}
            </Stack>
          </Grid.Col>

          <Grid.Col span={6}>
            <Stack gap="md">
              {empresa.contactoPrincipal ? (
                <Group gap="sm">
                  <IconUser size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Contacto Principal</Text>
                    <Text>{empresa.contactoPrincipal}</Text>
                  </Stack>
                </Group>
              ) : (
                <Group gap="sm">
                  <IconUser size="1.2rem" color="gray" />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed">Contacto Principal</Text>
                    <Text c="dimmed">No especificado</Text>
                  </Stack>
                </Group>
              )}

              <Group gap="sm" align="flex-start">
                <IconCalendar size="1.2rem" color="gray" />
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">Última Actualización</Text>
                  <Text>
                    {new Date(empresa.updatedAt).toLocaleDateString('es-AR', {
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

        {empresa.direccion && (
          <>
            <Divider my="md" />
            <Group gap="sm" align="flex-start">
              <IconMapPin size="1.2rem" color="gray" />
              <Stack gap={2}>
                <Text size="sm" c="dimmed">Dirección</Text>
                <Text>{empresa.direccion}</Text>
              </Stack>
            </Group>
          </>
        )}
      </Paper>

      {/* Información Legal */}
      <Paper p="lg" withBorder>
        <Title order={3} mb="md">Información Legal</Title>
        
        <Grid>
          <Grid.Col span={6}>
            {empresa.cuit ? (
              <Group gap="sm">
                <IconId size="1.2rem" color="gray" />
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">CUIT</Text>
                  <Text>{empresa.cuit}</Text>
                </Stack>
              </Group>
            ) : (
              <Group gap="sm">
                <IconId size="1.2rem" color="gray" />
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">CUIT</Text>
                  <Text c="dimmed">No especificado</Text>
                </Stack>
              </Group>
            )}
          </Grid.Col>

          <Grid.Col span={6}>
            {empresa.rut ? (
              <Group gap="sm">
                <IconFileText size="1.2rem" color="gray" />
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">RUT</Text>
                  <Text>{empresa.rut}</Text>
                </Stack>
              </Group>
            ) : (
              <Group gap="sm">
                <IconFileText size="1.2rem" color="gray" />
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">RUT</Text>
                  <Text c="dimmed">No especificado</Text>
                </Stack>
              </Group>
            )}
          </Grid.Col>
        </Grid>

        {empresa.observaciones && (
          <>
            <Divider my="md" />
            <Stack gap={2}>
              <Text size="sm" c="dimmed">Observaciones</Text>
              <Text>{empresa.observaciones}</Text>
            </Stack>
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
                  <IconTruck size="1.5rem" color="blue" />
                  <Title order={4}>Vehículos</Title>
                </Group>
                
                <Text size="xl" fw={700}>
                  {loadingStats ? '...' : vehiculosCount}
                </Text>
                
                <Text size="sm" c="dimmed">
                  Vehículos registrados
                </Text>
              </Stack>

              <Group gap="xs">
                {onViewVehiculos && (
                  <Tooltip label="Ver todos los vehículos">
                    <ActionIcon
                      variant="light"
                      onClick={() => onViewVehiculos(empresa)}
                    >
                      <IconTruck size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
                
                {onCreateVehiculo && (
                  <Tooltip label="Crear nuevo vehículo">
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => onCreateVehiculo(empresa)}
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
                  <IconUsers size="1.5rem" color="green" />
                  <Title order={4}>Personal</Title>
                </Group>
                
                <Text size="xl" fw={700}>
                  {loadingStats ? '...' : personalCount}
                </Text>
                
                <Text size="sm" c="dimmed">
                  Personal asignado
                </Text>
              </Stack>

              <Group gap="xs">
                {onViewPersonal && (
                  <Tooltip label="Ver todo el personal">
                    <ActionIcon
                      variant="light"
                      onClick={() => onViewPersonal(empresa)}
                    >
                      <IconUsers size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                )}
                
                {onCreatePersonal && (
                  <Tooltip label="Crear nuevo personal">
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => onCreatePersonal(empresa)}
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