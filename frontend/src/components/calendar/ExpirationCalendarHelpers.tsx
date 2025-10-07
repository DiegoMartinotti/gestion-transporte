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
interface CalendarControlsProps {
  readonly filtroTipo: string;
  readonly setFiltroTipo: (value: string) => void;
  readonly filtroEntidad: string;
  readonly setFiltroEntidad: (value: string) => void;
  readonly tiposUnicos: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly onRefresh?: () => void;
}

export function CalendarControls({
  filtroTipo,
  setFiltroTipo,
  filtroEntidad,
  setFiltroEntidad,
  tiposUnicos,
  onRefresh,
}: Readonly<CalendarControlsProps>) {
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
interface MonthStatsProps {
  readonly fechaActual: Date;
  readonly cambiarMes: (direccion: 'anterior' | 'siguiente') => void;
  readonly estadisticasMes: Readonly<{ vencidos: number; porVencer: number; vigentes: number }>;
}

export function MonthStats({
  fechaActual,
  cambiarMes,
  estadisticasMes,
}: Readonly<MonthStatsProps>) {
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
interface CalendarViewProps {
  readonly fechaActual: Date;
  readonly setFechaActual: (date: Date) => void;
  readonly renderDay: (fecha: Date) => React.ReactNode;
}

export function CalendarView({
  fechaActual,
  setFechaActual,
  renderDay,
}: Readonly<CalendarViewProps>) {
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

interface StatusAlertProps {
  readonly tipoEstado: string;
}

// Componente helper para el alert de estado
function StatusAlert({ tipoEstado }: Readonly<StatusAlertProps>) {
  if (tipoEstado === 'vencido') {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={16} />}>
        Documentos vencidos en esta fecha
      </Alert>
    );
  }

  if (tipoEstado === 'hoy') {
    return (
      <Alert color="orange" icon={<IconCalendar size={16} />}>
        Documentos que vencen hoy
      </Alert>
    );
  }

  return null;
}

// Componente helper para obtener color del badge
function getBadgeColor(tipoEstado: string): string {
  switch (tipoEstado) {
    case 'vencido':
      return 'red';
    case 'hoy':
      return 'orange';
    default:
      return 'blue';
  }
}

// Componente helper para obtener texto del badge
function getBadgeText(tipoEstado: string): string {
  switch (tipoEstado) {
    case 'vencido':
      return 'Vencido';
    case 'hoy':
      return 'Vence hoy';
    default:
      return 'Por vencer';
  }
}

// Componente para mostrar un documento individual
interface DocumentCardProps {
  readonly documento: DocumentoVencimiento;
  readonly tipoEstado: string;
  readonly onDocumentClick?: (documento: DocumentoVencimiento) => void;
}

function DocumentCard({ documento, tipoEstado, onDocumentClick }: Readonly<DocumentCardProps>) {
  return (
    <Card padding="sm" withBorder>
      <Group justify="space-between">
        <Group>
          <ThemeIcon
            size="lg"
            color={documento.entidadTipo === 'vehiculo' ? 'blue' : 'green'}
            variant="light"
          >
            {documento.entidadTipo === 'vehiculo' ? (
              <IconTruck size={20} />
            ) : (
              <IconUser size={20} />
            )}
          </ThemeIcon>

          <Box>
            <Text fw={500} size="sm">
              {documento.entidadNombre}
            </Text>
            <Text size="xs" c="dimmed">
              {documento.entidadDetalle}
            </Text>
            <Group gap="xs" mt={2}>
              <IconFileText size={12} />
              <Text size="xs">
                {TIPOS_DOCUMENTO_LABELS[documento.tipo] || documento.tipo}
                {documento.numero && ` - N° ${documento.numero}`}
              </Text>
            </Group>
          </Box>
        </Group>

        <Group gap="xs">
          <Badge size="xs" color={getBadgeColor(tipoEstado)} variant="light">
            {getBadgeText(tipoEstado)}
          </Badge>

          {onDocumentClick && (
            <ActionIcon size="sm" variant="light" onClick={() => onDocumentClick(documento)}>
              <IconEye size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Card>
  );
}

// Componente para el modal de documentos
interface DocumentModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
  readonly documentoSeleccionado: VencimientoDia | null;
  readonly onDocumentClick?: (documento: DocumentoVencimiento) => void;
}

export function DocumentModal({
  opened,
  onClose,
  documentoSeleccionado,
  onDocumentClick,
}: Readonly<DocumentModalProps>) {
  const modalTitle = documentoSeleccionado ? (
    <Group>
      <IconCalendar size={20} />
      <Text fw={500}>Vencimientos - {dayjs(documentoSeleccionado.fecha).format('DD/MM/YYYY')}</Text>
    </Group>
  ) : (
    'Detalles'
  );

  return (
    <Modal opened={opened} onClose={onClose} title={modalTitle} size="lg">
      {documentoSeleccionado && (
        <Stack>
          <StatusAlert tipoEstado={documentoSeleccionado.tipoEstado} />

          <ScrollArea.Autosize mah={400}>
            <Stack gap="xs">
              {documentoSeleccionado.documentos.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  documento={doc}
                  tipoEstado={documentoSeleccionado.tipoEstado}
                  onDocumentClick={onDocumentClick}
                />
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      )}
    </Modal>
  );
}
