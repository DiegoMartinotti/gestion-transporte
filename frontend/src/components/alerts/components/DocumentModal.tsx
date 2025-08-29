import React from 'react';
import { Modal, Stack, Group, Text, Badge, Divider, Box, Timeline } from '@mantine/core';
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

interface DocumentModalProps {
  opened: boolean;
  onClose: () => void;
  vencidos: DocumentoVencimiento[];
  proximos: DocumentoVencimiento[];
  documentos: DocumentoVencimiento[];
  getEstadoIcon: (estado: string) => React.ReactNode;
  getEstadoColor: (estado: string) => string;
  getEntidadIcon: (entidad: string) => React.ReactNode;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  opened,
  onClose,
  vencidos,
  proximos,
  documentos,
  getEstadoIcon,
  getEstadoColor,
  getEntidadIcon,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Detalle de Vencimientos" size="lg" centered>
      <Stack gap="md">
        <Group justify="space-around">
          <Stack align="center" gap="xs">
            <Text size="xl" fw={700} c="red">
              {vencidos.length}
            </Text>
            <Text size="sm" c="dimmed">
              Vencidos
            </Text>
          </Stack>
          <Stack align="center" gap="xs">
            <Text size="xl" fw={700} c="yellow">
              {proximos.length}
            </Text>
            <Text size="sm" c="dimmed">
              Próximos
            </Text>
          </Stack>
          <Stack align="center" gap="xs">
            <Text size="xl" fw={700} c="blue">
              {documentos.length}
            </Text>
            <Text size="sm" c="dimmed">
              Total
            </Text>
          </Stack>
        </Group>
        <Divider />
        <Box style={{ maxHeight: 400, overflowY: 'auto' }}>
          <Timeline active={-1} bulletSize={16} lineWidth={1}>
            {documentos.map((doc) => (
              <Timeline.Item
                key={doc.id}
                bullet={getEstadoIcon(doc.estado)}
                color={getEstadoColor(doc.estado)}
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Group gap="xs">
                      {getEntidadIcon(doc.entidad)}
                      <Text fw={500} size="sm">
                        {doc.entidadNombre}
                      </Text>
                      <Badge size="xs" variant="light">
                        {doc.tipoDocumento}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
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
                  </Stack>
                  <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                    {doc.estado === 'vencido'
                      ? `${Math.abs(doc.diasRestantes)} días vencido`
                      : doc.estado === 'proximo'
                        ? `${doc.diasRestantes} días`
                        : 'Vigente'}
                  </Badge>
                </Group>
              </Timeline.Item>
            ))}
          </Timeline>
        </Box>
      </Stack>
    </Modal>
  );
};
