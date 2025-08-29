import React from 'react';
import { Card, Group, Text, Stack, Button, ActionIcon, Tooltip, Alert } from '@mantine/core';
import {
  IconCalendar,
  IconEye,
  IconBell,
  IconBellOff,
  IconX,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react';

interface DocumentoVencimiento {
  id: string;
  entidad: 'vehiculo' | 'personal';
  entidadId: string;
  entidadNombre: string;
  tipoDocumento: string;
  numeroDocumento?: string;
  fechaVencimiento: Date;
  diasRestantes: number;
  estado: 'vencido' | 'proximo' | 'vigente';
  empresa?: string;
}

interface CompactDocumentViewProps {
  vencidos: DocumentoVencimiento[];
  proximos: DocumentoVencimiento[];
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  setDetailModalOpened: (value: boolean) => void;
}

// Componente auxiliar para alertas de estado
const DocumentAlert: React.FC<{
  count: number;
  icon: React.ReactNode;
  color: string;
  messageKey: 'vencidos' | 'proximos' | 'vigente';
}> = ({ count, icon, color, messageKey }) => {
  const messages = {
    vencidos: `${count} documento${count > 1 ? 's' : ''} vencido${count > 1 ? 's' : ''}`,
    proximos: `${count} documento${count > 1 ? 's' : ''} próximo${count > 1 ? 's' : ''} a vencer`,
    vigente: 'Toda la documentación está vigente',
  };

  return (
    <Alert icon={icon} color={color} variant="light">
      <Text size="sm" fw={500}>
        {messages[messageKey]}
      </Text>
    </Alert>
  );
};

// Componente auxiliar para botones de acción
const CompactActions: React.FC<{
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  setDetailModalOpened: (value: boolean) => void;
}> = ({ alertasHabilitadas, setAlertasHabilitadas, setDetailModalOpened }) => (
  <Group gap="xs">
    <Tooltip label={alertasHabilitadas ? 'Deshabilitar alertas' : 'Habilitar alertas'}>
      <ActionIcon
        variant="light"
        color={alertasHabilitadas ? 'blue' : 'gray'}
        onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
      >
        {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
      </ActionIcon>
    </Tooltip>
    <Button
      variant="light"
      size="xs"
      leftSection={<IconEye size={14} />}
      onClick={() => setDetailModalOpened(true)}
    >
      Ver Detalle
    </Button>
  </Group>
);

export const CompactDocumentView: React.FC<CompactDocumentViewProps> = ({
  vencidos,
  proximos,
  alertasHabilitadas,
  setAlertasHabilitadas,
  setDetailModalOpened,
}) => {
  const hasExpired = vencidos.length > 0;
  const hasUpcoming = proximos.length > 0;
  const allCurrent = !hasExpired && !hasUpcoming;

  return (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendar size={18} />
          <Text fw={500}>Estado de Documentación</Text>
        </Group>
        <CompactActions
          alertasHabilitadas={alertasHabilitadas}
          setAlertasHabilitadas={setAlertasHabilitadas}
          setDetailModalOpened={setDetailModalOpened}
        />
      </Group>

      <Stack gap="xs">
        {hasExpired && (
          <DocumentAlert
            count={vencidos.length}
            icon={<IconX />}
            color="red"
            messageKey="vencidos"
          />
        )}
        {hasUpcoming && (
          <DocumentAlert
            count={proximos.length}
            icon={<IconAlertTriangle />}
            color="yellow"
            messageKey="proximos"
          />
        )}
        {allCurrent && (
          <DocumentAlert count={0} icon={<IconCheck />} color="green" messageKey="vigente" />
        )}
      </Stack>
    </Card>
  );
};
