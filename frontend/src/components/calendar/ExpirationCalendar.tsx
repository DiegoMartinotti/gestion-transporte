import React, { useState, useMemo } from 'react';
import { Box, Text, Badge, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
  DocumentoVencimiento,
  VencimientoDia,
  CalendarControls,
  MonthStats,
  CalendarView,
  DocumentModal,
  TIPOS_DOCUMENTO_LABELS,
  DATE_FORMAT,
} from './ExpirationCalendarHelpers';

dayjs.extend(isBetween);

interface ExpirationCalendarProps {
  documentos: DocumentoVencimiento[];
  onRefresh?: () => void;
  onDocumentClick?: (documento: DocumentoVencimiento) => void;
}

// Hook personalizado para lógica del calendario
function useExpirationCalendar(
  documentos: DocumentoVencimiento[],
  filtroTipo: string,
  filtroEntidad: string
) {
  return useMemo(() => {
    const vencimientos = new Map<string, VencimientoDia>();
    const hoy = dayjs();

    documentos.forEach((doc) => {
      if (!doc.fechaVencimiento) return;

      // Aplicar filtros
      if (filtroTipo !== 'todos' && doc.tipo !== filtroTipo) return;
      if (filtroEntidad !== 'todos' && doc.entidadTipo !== filtroEntidad) return;

      const fechaVenc = dayjs(doc.fechaVencimiento);
      const fechaKey = fechaVenc.format(DATE_FORMAT);

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
          tipoEstado,
        });
      }

      const vencimientoExistente = vencimientos.get(fechaKey);
      if (vencimientoExistente) {
        vencimientoExistente.documentos.push(doc);
      }
    });

    return vencimientos;
  }, [documentos, filtroTipo, filtroEntidad]);
}

// Hook para calcular estadísticas del mes
function useMonthStats(vencimientosPorDia: Map<string, VencimientoDia>, fechaActual: Date) {
  return useMemo(() => {
    const inicioMes = dayjs(fechaActual).startOf('month');
    const finMes = dayjs(fechaActual).endOf('month');

    let vencidos = 0;
    let porVencer = 0;
    let vigentes = 0;

    Array.from(vencimientosPorDia.values()).forEach((vencimiento) => {
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
}

// Hook para lógica de renderizado de días
function useDayRenderer(
  vencimientosPorDia: Map<string, VencimientoDia>,
  fechaActual: Date,
  setDocumentoSeleccionado: (doc: VencimientoDia) => void,
  open: () => void
) {
  const getDayIndicators = (fecha: Date) => {
    const fechaKey = dayjs(fecha).format(DATE_FORMAT);
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
      estado: vencimiento.tipoEstado,
    };
  };

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
          opacity: isCurrentMonth ? 1 : 0.5,
        }}
        onClick={() => {
          if (indicators) {
            const fechaKey = dayjs(fecha).format(DATE_FORMAT);
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
              justifyContent: 'center',
            }}
          >
            {indicators.count}
          </Badge>
        )}
      </Box>
    );
  };

  return { renderDay };
}

export const ExpirationCalendar: React.FC<ExpirationCalendarProps> = ({
  documentos,
  onRefresh,
  onDocumentClick,
}) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todos');
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<VencimientoDia | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  // Procesar documentos para el calendario
  const vencimientosPorDia = useExpirationCalendar(documentos, filtroTipo, filtroEntidad);

  // Calcular estadísticas
  const estadisticasMes = useMonthStats(vencimientosPorDia, fechaActual);

  // Lógica de renderizado
  const { renderDay } = useDayRenderer(
    vencimientosPorDia,
    fechaActual,
    setDocumentoSeleccionado,
    open
  );

  // Obtener opciones de filtro únicas
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(documentos.map((doc) => doc.tipo));
    return Array.from(tipos).map((tipo) => ({
      value: tipo,
      label: TIPOS_DOCUMENTO_LABELS[tipo] || tipo,
    }));
  }, [documentos]);

  // Navegación de mes
  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = dayjs(fechaActual)
      .add(direccion === 'siguiente' ? 1 : -1, 'month')
      .toDate();
    setFechaActual(nuevaFecha);
  };

  return (
    <Stack>
      <CalendarControls
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        filtroEntidad={filtroEntidad}
        setFiltroEntidad={setFiltroEntidad}
        tiposUnicos={tiposUnicos}
        onRefresh={onRefresh}
      />

      <MonthStats
        fechaActual={fechaActual}
        cambiarMes={cambiarMes}
        estadisticasMes={estadisticasMes}
      />

      <CalendarView
        fechaActual={fechaActual}
        setFechaActual={setFechaActual}
        renderDay={renderDay}
      />

      <DocumentModal
        opened={opened}
        onClose={close}
        documentoSeleccionado={documentoSeleccionado}
        onDocumentClick={onDocumentClick}
      />
    </Stack>
  );
};

export default ExpirationCalendar;
