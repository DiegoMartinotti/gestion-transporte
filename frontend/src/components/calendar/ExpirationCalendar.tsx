import React, { useState, useMemo } from 'react';
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
  Alert
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
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

// Interfaces para documentos con vencimiento
interface DocumentoVencimiento {
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

interface VencimientoDia {
  fecha: Date;
  documentos: DocumentoVencimiento[];
  tipoEstado: 'vencido' | 'hoy' | 'proximo';
}

interface ExpirationCalendarProps {
  documentos: DocumentoVencimiento[];
  onRefresh?: () => void;
  onDocumentClick?: (documento: DocumentoVencimiento) => void;
}

const TIPOS_DOCUMENTO_LABELS: Record<string, string> = {
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
  otros: 'Otros'
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ExpirationCalendar: React.FC<ExpirationCalendarProps> = ({
  documentos,
  onRefresh,
  onDocumentClick
}) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todos');
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<VencimientoDia | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  // Procesar documentos para el calendario
  const vencimientosPorDia = useMemo(() => {
    const vencimientos = new Map<string, VencimientoDia>();
    const hoy = dayjs();

    documentos.forEach(doc => {
      if (!doc.fechaVencimiento) return;

      // Aplicar filtros
      if (filtroTipo !== 'todos' && doc.tipo !== filtroTipo) return;
      if (filtroEntidad !== 'todos' && doc.entidadTipo !== filtroEntidad) return;

      const fechaVenc = dayjs(doc.fechaVencimiento);
      const fechaKey = fechaVenc.format('YYYY-MM-DD');

      // Determinar estado
      let tipoEstado: 'vencido' | 'hoy' | 'proximo' = 'proximo';
      if (fechaVenc.isBefore(hoy, 'day')) {
        tipoEstado = 'vencido';
      } else if (fechaVenc.isSame(hoy, 'day')) {
        tipoEstado = 'hoy';
      }

      if (!vencimientos.has(fechaKey)) {
        vencimientos.set(fechaKey, {
          fecha: fechaVenc.toDate(),
          documentos: [],
          tipoEstado
        });
      }

      vencimientos.get(fechaKey)!.documentos.push(doc);
    });

    return vencimientos;
  }, [documentos, filtroTipo, filtroEntidad]);

  // Obtener indicadores para cada día
  const getDayIndicators = (fecha: Date) => {
    const fechaKey = dayjs(fecha).format('YYYY-MM-DD');
    const vencimiento = vencimientosPorDia.get(fechaKey);
    
    if (!vencimiento) return null;

    const totalDocs = vencimiento.documentos.length;
    let color = 'blue';
    
    if (vencimiento.tipoEstado === 'vencido') {
      color = 'red';
    } else if (vencimiento.tipoEstado === 'hoy') {
      color = 'orange';
    }

    return {
      count: totalDocs,
      color,
      estado: vencimiento.tipoEstado
    };
  };

  // Renderizar día personalizado
  const renderDay = (fecha: Date) => {
    const indicators = getDayIndicators(fecha);
    const isCurrentMonth = dayjs(fecha).month() === dayjs(fechaActual).month();
    
    return (
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: indicators ? 'pointer' : 'default',
          opacity: isCurrentMonth ? 1 : 0.5
        }}
        onClick={() => {
          if (indicators) {
            const fechaKey = dayjs(fecha).format('YYYY-MM-DD');
            const vencimiento = vencimientosPorDia.get(fechaKey);
            if (vencimiento) {
              setDocumentoSeleccionado(vencimiento);
              open();
            }
          }
        }}
      >
        <Text size="sm">{dayjs(fecha).date()}</Text>
        {indicators && (
          <Badge
            size="xs"
            color={indicators.color}
            variant="filled"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {indicators.count}
          </Badge>
        )}
      </Box>
    );
  };

  // Obtener opciones de filtro únicas
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(documentos.map(doc => doc.tipo));
    return Array.from(tipos).map(tipo => ({
      value: tipo,
      label: TIPOS_DOCUMENTO_LABELS[tipo] || tipo
    }));
  }, [documentos]);

  // Navegación de mes
  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = dayjs(fechaActual)
      .add(direccion === 'siguiente' ? 1 : -1, 'month')
      .toDate();
    setFechaActual(nuevaFecha);
  };

  // Estadísticas del mes actual
  const estadisticasMes = useMemo(() => {
    const inicioMes = dayjs(fechaActual).startOf('month');
    const finMes = dayjs(fechaActual).endOf('month');
    
    let vencidos = 0;
    let porVencer = 0;
    let vigentes = 0;

    Array.from(vencimientosPorDia.values()).forEach(vencimiento => {
      const fecha = dayjs(vencimiento.fecha);
      if (fecha.isBetween(inicioMes, finMes, 'day', '[]')) {
        if (vencimiento.tipoEstado === 'vencido') {
          vencidos += vencimiento.documentos.length;
        } else if (vencimiento.tipoEstado === 'hoy') {
          porVencer += vencimiento.documentos.length;
        } else {
          vigentes += vencimiento.documentos.length;
        }
      }
    });

    return { vencidos, porVencer, vigentes };
  }, [vencimientosPorDia, fechaActual]);

  return (
    <Stack>
      {/* Controles y filtros */}
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
            data={[
              { value: 'todos', label: 'Todos los tipos' },
              ...tiposUnicos
            ]}
            leftSection={<IconFilter size={16} />}
          />
          
          <Select
            placeholder="Tipo de entidad"
            value={filtroEntidad}
            onChange={(value) => setFiltroEntidad(value || 'todos')}
            data={[
              { value: 'todos', label: 'Todas las entidades' },
              { value: 'vehiculo', label: 'Vehículos' },
              { value: 'personal', label: 'Personal' }
            ]}
            leftSection={<IconFilter size={16} />}
          />
        </Group>
      </Paper>

      {/* Estadísticas del mes */}
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
            <Text ta="center" fw={700} size="lg" c="red">{estadisticasMes.vencidos}</Text>
            <Text ta="center" size="sm" c="red">Vencidos</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="orange.0">
            <Text ta="center" fw={700} size="lg" c="orange">{estadisticasMes.porVencer}</Text>
            <Text ta="center" size="sm" c="orange">Vencen hoy</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="green.0">
            <Text ta="center" fw={700} size="lg" c="green">{estadisticasMes.vigentes}</Text>
            <Text ta="center" size="sm" c="green">Por vencer</Text>
          </Card>
        </Group>
      </Paper>

      {/* Calendario */}
      <Paper p="md" withBorder>
        <Calendar
          date={fechaActual}
          onDateChange={(date: string) => setFechaActual(new Date(date))}
          renderDay={(date: string) => renderDay(new Date(date))}
          size="xl"
          firstDayOfWeek={1} // Lunes
          styles={{
            calendarHeader: {
              marginBottom: 16
            },
            day: {
              height: 60,
              fontSize: 14
            }
          }}
        />
        
        {/* Leyenda */}
        <Group justify="center" mt="md" gap="xl">
          <Group gap="xs">
            <Badge size="sm" color="red" variant="filled">•</Badge>
            <Text size="sm">Vencidos</Text>
          </Group>
          <Group gap="xs">
            <Badge size="sm" color="orange" variant="filled">•</Badge>
            <Text size="sm">Vencen hoy</Text>
          </Group>
          <Group gap="xs">
            <Badge size="sm" color="blue" variant="filled">•</Badge>
            <Text size="sm">Por vencer</Text>
          </Group>
        </Group>
      </Paper>

      {/* Modal de detalles del día */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          documentoSeleccionado ? (
            <Group>
              <IconCalendar size={20} />
              <Text fw={500}>
                Vencimientos - {dayjs(documentoSeleccionado.fecha).format('DD/MM/YYYY')}
              </Text>
            </Group>
          ) : 'Detalles'
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
                {documentoSeleccionado.documentos.map(doc => (
                  <Card key={doc._id} padding="sm" withBorder>
                    <Group justify="space-between">
                      <Group>
                        <ThemeIcon
                          size="lg"
                          color={doc.entidadTipo === 'vehiculo' ? 'blue' : 'green'}
                          variant="light"
                        >
                          {doc.entidadTipo === 'vehiculo' ? <IconTruck size={20} /> : <IconUser size={20} />}
                        </ThemeIcon>
                        
                        <Box>
                          <Text fw={500} size="sm">{doc.entidadNombre}</Text>
                          <Text size="xs" c="dimmed">{doc.entidadDetalle}</Text>
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
                            documentoSeleccionado.tipoEstado === 'vencido' ? 'red' :
                            documentoSeleccionado.tipoEstado === 'hoy' ? 'orange' : 'blue'
                          }
                          variant="light"
                        >
                          {documentoSeleccionado.tipoEstado === 'vencido' ? 'Vencido' :
                           documentoSeleccionado.tipoEstado === 'hoy' ? 'Vence hoy' : 'Por vencer'}
                        </Badge>
                        
                        {onDocumentClick && (
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => onDocumentClick(doc)}
                          >
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
    </Stack>
  );
};

export default ExpirationCalendar;