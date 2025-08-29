import React from 'react';
import {
  Box,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  ActionIcon,
  Select,
  Paper,
  Title,
  ThemeIcon,
  Modal,
  ScrollArea,
  Alert,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconTruck,
  IconUser,
  IconFileText,
  IconAlertTriangle,
  IconEye,
  IconRefresh,
} from '@tabler/icons-react';
import dayjs from 'dayjs';

// Interfaces para documentos con vencimiento
export interface DocumentoVencimiento {
  _id: string;
  tipo: string;
  numero?: string;
  fechaVencimiento: Date;
  fechaEmision?: Date;
  observaciones?: string;
  entidadTipo: 'vehiculo' | 'personal';
  entidadId: string;
  entidadNombre: string;
  entidadDetalle: string; // Patente para vehículos, tipo para personal
}

export interface VencimientoDia {
  fecha: Date;
  documentos: DocumentoVencimiento[];
  tipoEstado: 'vencido' | 'hoy' | 'proximo';
}

export const TIPOS_DOCUMENTO_LABELS: Record<string, string> = {
  licencia_conducir: 'Licencia de Conducir',
  carnet_conducir: 'Carnet de Conducir',
  vtv: 'VTV',
  seguro: 'Seguro',
  patente: 'Patente',
  habilitacion_municipal: 'Hab. Municipal',
  habilitacion_provincial: 'Hab. Provincial',
  habilitacion_nacional: 'Hab. Nacional',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  otros: 'Otros',
};

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const DATE_FORMAT = 'YYYY-MM-DD';

// Componente para controles y filtros
export function CalendarControls({
  filtroTipo,
  setFiltroTipo,
  filtroEntidad,
  setFiltroEntidad,
  tiposUnicos,
  onRefresh,
}: {
  filtroTipo: string;
  setFiltroTipo: (value: string) => void;
  filtroEntidad: string;
  setFiltroEntidad: (value: string) => void;
  tiposUnicos: { value: string; label: string }[];
  onRefresh?: () => void;
}) {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4}>Calendario de Vencimientos</Title>
        {onRefresh && (
          <ActionIcon variant="light" onClick={onRefresh}>
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>

      <Group grow>
        <Select
          placeholder="Tipo de documento"
          value={filtroTipo}
          onChange={(value) => setFiltroTipo(value || 'todos')}
          data={[{ value: 'todos', label: 'Todos los tipos' }, ...tiposUnicos]}
          leftSection={<IconFilter size={16} />}
        />

        <Select
          placeholder="Tipo de entidad"
          value={filtroEntidad}
          onChange={(value) => setFiltroEntidad(value || 'todos')}
          data={[
            { value: 'todos', label: 'Todas las entidades' },
            { value: 'vehiculo', label: 'Vehículos' },
            { value: 'personal', label: 'Personal' },
          ]}
          leftSection={<IconFilter size={16} />}
        />
      </Group>
    </Paper>
  );
}

// Componente para estadísticas del mes
export function MonthStats({
  fechaActual,
  cambiarMes,
  estadisticasMes,
}: {
  fechaActual: Date;
  cambiarMes: (direccion: 'anterior' | 'siguiente') => void;
  estadisticasMes: { vencidos: number; porVencer: number; vigentes: number };
}) {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <ActionIcon variant="light" onClick={() => cambiarMes('anterior')}>
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Text fw={500} size="lg">
            {MESES[dayjs(fechaActual).month()]} {dayjs(fechaActual).year()}
          </Text>
          <ActionIcon variant="light" onClick={() => cambiarMes('siguiente')}>
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Group grow>
        <Card padding="sm" withBorder bg="red.0">
          <Text ta="center" fw={700} size="lg" c="red">
            {estadisticasMes.vencidos}
          </Text>
          <Text ta="center" size="sm" c="red">
            Vencidos
          </Text>
        </Card>

        <Card padding="sm" withBorder bg="orange.0">
          <Text ta="center" fw={700} size="lg" c="orange">
            {estadisticasMes.porVencer}
          </Text>
          <Text ta="center" size="sm" c="orange">
            Vencen hoy
          </Text>
        </Card>

        <Card padding="sm" withBorder bg="green.0">
          <Text ta="center" fw={700} size="lg" c="green">
            {estadisticasMes.vigentes}
          </Text>
          <Text ta="center" size="sm" c="green">
            Por vencer
          </Text>
        </Card>
      </Group>
    </Paper>
  );
}

// Componente para el calendario
export function CalendarView({
  fechaActual,
  setFechaActual,
  renderDay,
}: {
  fechaActual: Date;
  setFechaActual: (date: Date) => void;
  renderDay: (fecha: Date) => React.ReactNode;
}) {
  return (
    <Paper p="md" withBorder>
      <Calendar
        date={fechaActual}
        onDateChange={(date: string) => setFechaActual(new Date(date))}
        renderDay={(date: string) => renderDay(new Date(date))}
        size="xl"
        firstDayOfWeek={1} // Lunes
        styles={{
          calendarHeader: {
            marginBottom: 16,
          },
          day: {
            height: 60,
            fontSize: 14,
          },
        }}
      />

      {/* Leyenda */}
      <Group justify="center" mt="md" gap="xl">
        <Group gap="xs">
          <Badge size="sm" color="red" variant="filled">
            •
          </Badge>
          <Text size="sm">Vencidos</Text>
        </Group>
        <Group gap="xs">
          <Badge size="sm" color="orange" variant="filled">
            •
          </Badge>
          <Text size="sm">Vencen hoy</Text>
        </Group>
        <Group gap="xs">
          <Badge size="sm" color="blue" variant="filled">
            •
          </Badge>
          <Text size="sm">Por vencer</Text>
        </Group>
      </Group>
    </Paper>
  );
}

// Componente para el modal de documentos
export function DocumentModal({
  opened,
  onClose,
  documentoSeleccionado,
  onDocumentClick,
}: {
  opened: boolean;
  onClose: () => void;
  documentoSeleccionado: VencimientoDia | null;
  onDocumentClick?: (documento: DocumentoVencimiento) => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        documentoSeleccionado ? (
          <Group>
            <IconCalendar size={20} />
            <Text fw={500}>
              Vencimientos - {dayjs(documentoSeleccionado.fecha).format('DD/MM/YYYY')}
            </Text>
          </Group>
        ) : (
          'Detalles'
        )
      }
      size="lg"
    >
      {documentoSeleccionado && (
        <Stack>
          {documentoSeleccionado.tipoEstado === 'vencido' && (
            <Alert color="red" icon={<IconAlertTriangle size={16} />}>
              Documentos vencidos en esta fecha
            </Alert>
          )}

          {documentoSeleccionado.tipoEstado === 'hoy' && (
            <Alert color="orange" icon={<IconCalendar size={16} />}>
              Documentos que vencen hoy
            </Alert>
          )}

          <ScrollArea.Autosize mah={400}>
            <Stack gap="xs">
              {documentoSeleccionado.documentos.map((doc) => (
                <Card key={doc._id} padding="sm" withBorder>
                  <Group justify="space-between">
                    <Group>
                      <ThemeIcon
                        size="lg"
                        color={doc.entidadTipo === 'vehiculo' ? 'blue' : 'green'}
                        variant="light"
                      >
                        {doc.entidadTipo === 'vehiculo' ? (
                          <IconTruck size={20} />
                        ) : (
                          <IconUser size={20} />
                        )}
                      </ThemeIcon>

                      <Box>
                        <Text fw={500} size="sm">
                          {doc.entidadNombre}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {doc.entidadDetalle}
                        </Text>
                        <Group gap="xs" mt={2}>
                          <IconFileText size={12} />
                          <Text size="xs">
                            {TIPOS_DOCUMENTO_LABELS[doc.tipo] || doc.tipo}
                            {doc.numero && ` - N° ${doc.numero}`}
                          </Text>
                        </Group>
                      </Box>
                    </Group>

                    <Group gap="xs">
                      <Badge
                        size="xs"
                        color={
                          documentoSeleccionado.tipoEstado === 'vencido'
                            ? 'red'
                            : documentoSeleccionado.tipoEstado === 'hoy'
                              ? 'orange'
                              : 'blue'
                        }
                        variant="light"
                      >
                        {documentoSeleccionado.tipoEstado === 'vencido'
                          ? 'Vencido'
                          : documentoSeleccionado.tipoEstado === 'hoy'
                            ? 'Vence hoy'
                            : 'Por vencer'}
                      </Badge>

                      {onDocumentClick && (
                        <ActionIcon size="sm" variant="light" onClick={() => onDocumentClick(doc)}>
                          <IconEye size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      )}
    </Modal>
  );
}
