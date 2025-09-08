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
  IconEye,
} from '@tabler/icons-react';
import type { Personal } from '../../types';
import type { PersonalCardProps, DocumentStatus } from './PersonalCardTypes';
import {
  calculateAge,
  convertDateToString,
  getDocumentStatus,
  getStatusColor,
  getTipoColor,
  isCurrentlyEmployed,
} from './PersonalCardHelpers';

// Componente para el modo compacto
function PersonalCardCompact({ personal, showActions, onView, onEdit }: PersonalCardProps) {
  const documentStatus = getDocumentStatus(personal);
  const statusColor = getStatusColor(personal, documentStatus);

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
          <Badge size="sm" color={statusColor} variant="light">
            {personal.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          {showActions && (
            <PersonalCardCompactActions personal={personal} onView={onView} onEdit={onEdit} />
          )}
        </Group>
      </Group>
    </Card>
  );
}

// Componente para acciones en modo compacto
function PersonalCardCompactActions({
  personal,
  onView,
  onEdit,
}: Pick<PersonalCardProps, 'personal' | 'onView' | 'onEdit'>) {
  return (
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
  );
}

// Componente para el header completo
function PersonalCardHeader({ personal }: { personal: Personal }) {
  const documentStatus = getDocumentStatus(personal);
  const statusColor = getStatusColor(personal, documentStatus);
  const employed = isCurrentlyEmployed(personal);

  return (
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
            <Badge color={getTipoColor(personal.tipo)} variant="light">
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
        <Badge size="lg" color={statusColor} variant={personal.activo ? 'light' : 'outline'}>
          {personal.activo ? 'Activo' : 'Inactivo'}
        </Badge>
        {!employed && (
          <Tooltip label="No tiene período de empleo activo">
            <ThemeIcon color="yellow" size="sm">
              <IconAlertTriangle size={12} />
            </ThemeIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  );
}

// Componente para información básica
function PersonalCardBasicInfo({ personal }: { personal: Personal }) {
  const empresa = typeof personal.empresa === 'object' ? personal.empresa : null;
  const age = calculateAge(convertDateToString(personal.fechaNacimiento));

  return (
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
  );
}

// Componente para estado de documentación
function PersonalCardDocumentation({
  personal,
  documentStatus,
}: {
  personal: Personal;
  documentStatus: DocumentStatus;
}) {
  if (personal.tipo !== 'Conductor' || documentStatus.total === 0) return null;

  return (
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
  );
}

// Componente para alertas
function PersonalCardAlerts({ documentStatus }: { documentStatus: DocumentStatus }) {
  return (
    <>
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
    </>
  );
}

// Componente para acciones
function PersonalCardActions({
  personal,
  onView,
  onToggleActive,
  onEdit,
  onDelete,
}: PersonalCardProps) {
  return (
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
              <ActionIcon color="blue" onClick={() => onEdit(personal)}>
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip label="Eliminar">
              <ActionIcon color="red" onClick={() => onDelete(personal)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
    </>
  );
}

// Componente principal simplificado
export const PersonalCard: React.FC<PersonalCardProps> = ({
  personal,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  showActions = true,
  compact = false,
}) => {
  if (compact) {
    return (
      <PersonalCardCompact
        personal={personal}
        showActions={showActions}
        onView={onView}
        onEdit={onEdit}
      />
    );
  }

  const documentStatus = getDocumentStatus(personal);

  return (
    <Card padding="lg" withBorder>
      <Stack gap="sm">
        <PersonalCardHeader personal={personal} />
        <PersonalCardBasicInfo personal={personal} />
        <PersonalCardDocumentation personal={personal} documentStatus={documentStatus} />
        <PersonalCardAlerts documentStatus={documentStatus} />

        {showActions && (
          <PersonalCardActions
            personal={personal}
            onView={onView}
            onToggleActive={onToggleActive}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}

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
