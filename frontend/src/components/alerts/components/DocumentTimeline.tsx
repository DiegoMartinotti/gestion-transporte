import React from 'react';
import { Timeline, Group, Text, Badge, ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface DocumentTimelineProps {
  documentos: DocumentoVencimiento[];
  getEstadoIcon: (estado: string) => React.ReactNode;
  getEstadoColor: (estado: string) => string;
  getEntidadIcon: (entidad: string) => React.ReactNode;
  onEditVehiculo?: (vehiculoId: string) => void;
  onEditPersonal?: (personalId: string) => void;
}

export const DocumentTimeline: React.FC<DocumentTimelineProps> = ({
  documentos,
  getEstadoIcon,
  getEstadoColor,
  getEntidadIcon,
  onEditVehiculo,
  onEditPersonal,
}) => {
  return (
    <Timeline active={-1} bulletSize={20} lineWidth={2}>
      {documentos.map((doc) => (
        <Timeline.Item
          key={doc.id}
          bullet={getEstadoIcon(doc.estado)}
          color={getEstadoColor(doc.estado)}
        >
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              {getEntidadIcon(doc.entidad)}
              <Text fw={500} size="sm">
                {doc.entidadNombre}
              </Text>
              <Badge size="xs" variant="light">
                {doc.tipoDocumento}
              </Badge>
            </Group>
            <Group gap="xs">
              <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                {doc.estado === 'vencido'
                  ? `${Math.abs(doc.diasRestantes)} días vencido`
                  : `${doc.diasRestantes} días restantes`}
              </Badge>
              <ActionIcon
                size="xs"
                variant="light"
                color="blue"
                onClick={() => {
                  if (doc.entidad === 'vehiculo' && onEditVehiculo) {
                    onEditVehiculo(doc.entidadId);
                  } else if (doc.entidad === 'personal' && onEditPersonal) {
                    onEditPersonal(doc.entidadId);
                  }
                }}
              >
                <IconEdit size={12} />
              </ActionIcon>
            </Group>
          </Group>

          <Text size="xs" c="dimmed" mb={5}>
            Vence: {format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
          </Text>

          {doc.numeroDocumento && (
            <Text size="xs" c="dimmed">
              Número: {doc.numeroDocumento}
            </Text>
          )}

          {doc.empresa && (
            <Text size="xs" c="dimmed">
              Empresa: {doc.empresa}
            </Text>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};
