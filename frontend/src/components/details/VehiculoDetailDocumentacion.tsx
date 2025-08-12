import { Card, Group, Text, Timeline, Badge, Progress, Alert } from '@mantine/core';
import { IconCalendar, IconAlertTriangle } from '@tabler/icons-react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentoInfo, getEstadoColor, getEstadoIcon } from './VehiculoDetailHelpers';

interface VehiculoDetailDocumentacionProps {
  documentos: DocumentoInfo[];
  estadoGeneral: { estado: string; color: string; porcentaje: number };
}

export function VehiculoDetailDocumentacion({
  documentos,
  estadoGeneral,
}: VehiculoDetailDocumentacionProps) {
  const formatFecha = (fecha?: string) => {
    if (!fecha) return 'No especificado';
    try {
      const date = parseISO(fecha);
      if (!isValid(date)) return fecha;
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group>
            <IconCalendar size={18} />
            <Text fw={500}>Estado de Documentación</Text>
          </Group>
          <Badge color={estadoGeneral.color} variant="light">
            {estadoGeneral.estado}
          </Badge>
        </Group>
      </Card.Section>

      <Card.Section inheritPadding py="md">
        <Progress value={estadoGeneral.porcentaje} color={estadoGeneral.color} size="sm" mb="lg" />

        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {documentos.map((doc, index) => (
            <Timeline.Item
              key={index}
              bullet={getEstadoIcon(doc.estado)}
              color={getEstadoColor(doc.estado)}
              title={
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    {doc.nombre}
                  </Text>
                  {doc.numero && (
                    <Text size="xs" c="dimmed">
                      #{doc.numero}
                    </Text>
                  )}
                </Group>
              }
            >
              <Text size="xs" c="dimmed">
                {doc.vencimiento ? (
                  <>
                    Vence el {formatFecha(doc.vencimiento)}
                    {doc.diasRestantes > 0 && <> ({doc.diasRestantes} días restantes)</>}
                    {doc.diasRestantes < 0 && (
                      <> (vencido hace {Math.abs(doc.diasRestantes)} días)</>
                    )}
                  </>
                ) : (
                  'Sin información de vencimiento'
                )}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>

        {documentos.some((doc) => doc.estado === 'vencido') && (
          <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" mt="md">
            Este vehículo tiene documentación vencida y no puede ser utilizado en viajes.
          </Alert>
        )}
      </Card.Section>
    </Card>
  );
}
