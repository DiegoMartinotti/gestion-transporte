import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Avatar,
  Progress,
  Tooltip,
  Button,
  Divider,
  Grid,
  ThemeIcon,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconUser,
  IconPhone,
  IconMail,
  IconCalendar,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconId,
  IconBuilding,
  IconLicense,
  IconStethoscope,
  IconEye,
} from '@tabler/icons-react';
import type { Personal, Empresa } from '../../types';

interface PersonalCardProps {
  personal: Personal;
  onEdit?: (personal: Personal) => void;
  onDelete?: (personal: Personal) => void;
  onView?: (personal: Personal) => void;
  onToggleActive?: (personal: Personal) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const PersonalCard: React.FC<PersonalCardProps> = ({
  personal,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  showActions = true,
  compact = false,
}) => {
  const empresa = typeof personal.empresa === 'object' ? personal.empresa : null;
  
  // Calculate age
  const getAge = () => {
    if (!personal.fechaNacimiento) return null;
    const today = new Date();
    const birthDate = new Date(personal.fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Check document expiration status
  const getDocumentStatus = () => {
    const now = new Date();
    const documents = [];
    
    if (personal.documentacion?.licenciaConducir?.vencimiento) {
      const licencia = personal.documentacion.licenciaConducir.vencimiento;
      const daysUntilExpiry = Math.ceil((new Date(licencia).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      documents.push({
        name: 'Licencia',
        days: daysUntilExpiry,
        expired: daysUntilExpiry < 0,
        expiring: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      });
    }

    if (personal.documentacion?.carnetProfesional?.vencimiento) {
      const carnet = personal.documentacion.carnetProfesional.vencimiento;
      const daysUntilExpiry = Math.ceil((new Date(carnet).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      documents.push({
        name: 'Carnet Prof.',
        days: daysUntilExpiry,
        expired: daysUntilExpiry < 0,
        expiring: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      });
    }

    if (personal.documentacion?.evaluacionMedica?.vencimiento) {
      const medica = personal.documentacion.evaluacionMedica.vencimiento;
      const daysUntilExpiry = Math.ceil((new Date(medica).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      documents.push({
        name: 'Eval. Médica',
        days: daysUntilExpiry,
        expired: daysUntilExpiry < 0,
        expiring: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      });
    }

    if (personal.documentacion?.psicofisico?.vencimiento) {
      const psicofisico = personal.documentacion.psicofisico.vencimiento;
      const daysUntilExpiry = Math.ceil((new Date(psicofisico).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      documents.push({
        name: 'Psicofísico',
        days: daysUntilExpiry,
        expired: daysUntilExpiry < 0,
        expiring: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
      });
    }

    const expired = documents.filter(d => d.expired).length;
    const expiring = documents.filter(d => d.expiring).length;
    const total = documents.length;
    const valid = total - expired - expiring;

    return { expired, expiring, valid, total, documents };
  };

  const documentStatus = getDocumentStatus();
  const age = getAge();

  // Get status color
  const getStatusColor = () => {
    if (!personal.activo) return 'gray';
    if (documentStatus.expired > 0) return 'red';
    if (documentStatus.expiring > 0) return 'yellow';
    return 'green';
  };

  // Get tipo color
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Conductor': return 'blue';
      case 'Administrativo': return 'green';
      case 'Mecánico': return 'orange';
      case 'Supervisor': return 'purple';
      default: return 'gray';
    }
  };

  // Check if currently employed
  const isCurrentlyEmployed = () => {
    if (!personal.periodosEmpleo || personal.periodosEmpleo.length === 0) return false;
    const lastPeriod = personal.periodosEmpleo[personal.periodosEmpleo.length - 1];
    return !lastPeriod.fechaEgreso;
  };

  if (compact) {
    return (
      <Card padding="sm" withBorder>
        <Group justify="space-between">
          <Group gap="sm">
            <Avatar size="sm" radius="xl">
              <IconUser size={16} />
            </Avatar>
            <div>
              <Text size="sm" fw={500}>
                {personal.nombre} {personal.apellido}
              </Text>
              <Text size="xs" color="dimmed">
                {personal.dni} - {personal.tipo}
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Badge
              size="sm"
              color={getStatusColor()}
              variant="light"
            >
              {personal.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            {showActions && (
              <Group gap={4}>
                {onView && (
                  <ActionIcon size="sm" onClick={() => onView(personal)}>
                    <IconEye size={12} />
                  </ActionIcon>
                )}
                {onEdit && (
                  <ActionIcon size="sm" onClick={() => onEdit(personal)}>
                    <IconEdit size={12} />
                  </ActionIcon>
                )}
              </Group>
            )}
          </Group>
        </Group>
      </Card>
    );
  }

  return (
    <Card padding="lg" withBorder>
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <Avatar size="lg" radius="xl">
              <IconUser size={24} />
            </Avatar>
            <div>
              <Group gap="xs" align="center">
                <Text size="lg" fw={600}>
                  {personal.nombre} {personal.apellido}
                </Text>
                <Badge
                  color={getTipoColor(personal.tipo)}
                  variant="light"
                >
                  {personal.tipo}
                </Badge>
              </Group>
              <Group gap="xs" mt={4}>
                <Text size="sm" color="dimmed">
                  <IconId size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  DNI: {personal.dni}
                </Text>
                {personal.numeroLegajo && (
                  <Text size="sm" color="dimmed">
                    Legajo: {personal.numeroLegajo}
                  </Text>
                )}
              </Group>
            </div>
          </Group>
          
          <Group gap="xs">
            <Badge
              size="lg"
              color={getStatusColor()}
              variant={personal.activo ? 'light' : 'outline'}
            >
              {personal.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            {!isCurrentlyEmployed() && (
              <Tooltip label="No tiene período de empleo activo">
                <ThemeIcon color="yellow" size="sm">
                  <IconAlertTriangle size={12} />
                </ThemeIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Basic Info */}
        <Grid>
          <Grid.Col span={6}>
            {empresa && (
              <Group gap="xs">
                <IconBuilding size={14} color="gray" />
                <Text size="sm">
                  <strong>Empresa:</strong> {empresa.nombre}
                </Text>
              </Group>
            )}
            {age && (
              <Group gap="xs">
                <IconCalendar size={14} color="gray" />
                <Text size="sm">
                  <strong>Edad:</strong> {age} años
                </Text>
              </Group>
            )}
          </Grid.Col>
          <Grid.Col span={6}>
            {personal.contacto?.telefono && (
              <Group gap="xs">
                <IconPhone size={14} color="gray" />
                <Text size="sm">
                  <strong>Teléfono:</strong> {personal.contacto.telefono}
                </Text>
              </Group>
            )}
            {personal.contacto?.email && (
              <Group gap="xs">
                <IconMail size={14} color="gray" />
                <Text size="sm">
                  <strong>Email:</strong> {personal.contacto.email}
                </Text>
              </Group>
            )}
          </Grid.Col>
        </Grid>

        {/* Documentation Status */}
        {personal.tipo === 'Conductor' && documentStatus.total > 0 && (
          <>
            <Divider />
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>
                  <IconLicense size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Estado de Documentación
                </Text>
                <Text size="xs" color="dimmed">
                  {documentStatus.valid}/{documentStatus.total} vigentes
                </Text>
              </Group>
              
              <Progress
                size="sm"
                value={(documentStatus.valid / documentStatus.total) * 100}
                color="green"
              />
              
              <Group gap="xs" mt="xs">
                {documentStatus.valid > 0 && (
                  <Badge size="xs" color="green" variant="light">
                    {documentStatus.valid} vigente{documentStatus.valid > 1 ? 's' : ''}
                  </Badge>
                )}
                {documentStatus.expiring > 0 && (
                  <Badge size="xs" color="yellow" variant="light">
                    {documentStatus.expiring} por vencer
                  </Badge>
                )}
                {documentStatus.expired > 0 && (
                  <Badge size="xs" color="red" variant="light">
                    {documentStatus.expired} vencido{documentStatus.expired > 1 ? 's' : ''}
                  </Badge>
                )}
              </Group>
            </div>
          </>
        )}

        {/* Warning alerts */}
        {documentStatus.expired > 0 && (
          <Group gap="xs">
            <IconAlertTriangle size={16} color="red" />
            <Text size="sm" color="red">
              Tiene documentos vencidos que requieren atención inmediata
            </Text>
          </Group>
        )}

        {documentStatus.expiring > 0 && (
          <Group gap="xs">
            <IconAlertTriangle size={16} color="orange" />
            <Text size="sm" color="orange">
              Tiene documentos que vencen en los próximos 30 días
            </Text>
          </Group>
        )}

        {/* Actions */}
        {showActions && (
          <>
            <Divider />
            <Group justify="space-between">
              <Group gap="xs">
                {onView && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={14} />}
                    onClick={() => onView(personal)}
                  >
                    Ver Detalles
                  </Button>
                )}
              </Group>
              
              <Group gap="xs">
                {onToggleActive && (
                  <Tooltip label={personal.activo ? 'Desactivar' : 'Activar'}>
                    <ActionIcon
                      color={personal.activo ? 'red' : 'green'}
                      onClick={() => onToggleActive(personal)}
                    >
                      {personal.activo ? <IconX size={16} /> : <IconCheck size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
                {onEdit && (
                  <Tooltip label="Editar">
                    <ActionIcon
                      color="blue"
                      onClick={() => onEdit(personal)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip label="Eliminar">
                    <ActionIcon
                      color="red"
                      onClick={() => onDelete(personal)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </>
        )}
        
        {/* Observaciones */}
        {personal.observaciones && (
          <>
            <Divider />
            <Text size="sm" color="dimmed">
              <strong>Observaciones:</strong> {personal.observaciones}
            </Text>
          </>
        )}
      </Stack>
    </Card>
  );
};