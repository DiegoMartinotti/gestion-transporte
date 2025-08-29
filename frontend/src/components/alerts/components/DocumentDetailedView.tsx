import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Stack,
  Divider,
  Tooltip,
  Progress,
} from '@mantine/core';
import { IconCalendar, IconBell, IconBellOff } from '@tabler/icons-react';
import { DocumentTimeline } from './DocumentTimeline';

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

interface DocumentDetailedViewProps {
  documentos: DocumentoVencimiento[];
  vencidos: DocumentoVencimiento[];
  proximos: DocumentoVencimiento[];
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  getEstadoIcon: (estado: string) => React.ReactNode;
  getEstadoColor: (estado: string) => string;
  getEntidadIcon: (entidad: string) => React.ReactNode;
  onEditVehiculo?: (vehiculoId: string) => void;
  onEditPersonal?: (personalId: string) => void;
}

export const DocumentDetailedView: React.FC<DocumentDetailedViewProps> = ({
  documentos,
  vencidos,
  proximos,
  alertasHabilitadas,
  setAlertasHabilitadas,
  getEstadoIcon,
  getEstadoColor,
  getEntidadIcon,
  onEditVehiculo,
  onEditPersonal,
}) => {
  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group>
            <IconCalendar size={18} />
            <Text fw={500}>Alertas de Vencimiento</Text>
          </Group>
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
          </Group>
        </Group>
      </Card.Section>

      <Card.Section inheritPadding py="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Total de alertas
            </Text>
            <Badge
              color={vencidos.length > 0 ? 'red' : proximos.length > 0 ? 'yellow' : 'green'}
              variant="light"
            >
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
            </Badge>
          </Group>

          <Progress.Root size="lg">
            <Progress.Section value={(vencidos.length / documentos.length) * 100} color="red">
              <Progress.Label>Vencidos: {vencidos.length}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={(proximos.length / documentos.length) * 100} color="yellow">
              <Progress.Label>Próximos: {proximos.length}</Progress.Label>
            </Progress.Section>
          </Progress.Root>

          <Divider />

          <DocumentTimeline
            documentos={documentos}
            getEstadoIcon={getEstadoIcon}
            getEstadoColor={getEstadoColor}
            getEntidadIcon={getEntidadIcon}
            onEditVehiculo={onEditVehiculo}
            onEditPersonal={onEditPersonal}
          />
        </Stack>
      </Card.Section>
    </Card>
  );
};
