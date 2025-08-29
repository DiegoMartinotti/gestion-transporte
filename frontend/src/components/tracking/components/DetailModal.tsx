import React from 'react';
import { Modal, Stack, Group, Text, Badge, Timeline, Grid } from '@mantine/core';
import { SeguimientoPago } from '../hooks/usePaymentTracker';
import {
  formatCurrency,
  getEstadoColor,
  getResultadoContactoColor,
} from '../utils/trackingHelpers';

// Componente para mostrar resumen financiero
const ResumenFinanciero: React.FC<{ seguimiento: SeguimientoPago }> = ({ seguimiento }) => (
  <Grid>
    <Grid.Col span={4}>
      <Text size="sm" c="dimmed">
        Monto Total
      </Text>
      <Text fw={500}>{formatCurrency(seguimiento.montoTotal)}</Text>
    </Grid.Col>
    <Grid.Col span={4}>
      <Text size="sm" c="dimmed">
        Monto Pagado
      </Text>
      <Text fw={500} c="green">
        {formatCurrency(seguimiento.montoAcumulado)}
      </Text>
    </Grid.Col>
    <Grid.Col span={4}>
      <Text size="sm" c="dimmed">
        Monto Pendiente
      </Text>
      <Text fw={500} c="orange">
        {formatCurrency(seguimiento.montoPendiente)}
      </Text>
    </Grid.Col>
  </Grid>
);

// Componente para mostrar historial de pagos
const HistorialPagos: React.FC<{ seguimiento: SeguimientoPago }> = ({ seguimiento }) => {
  if (seguimiento.pagosRegistrados.length === 0) return null;

  return (
    <div>
      <Text fw={500} mb="sm">
        Historial de Pagos
      </Text>
      <Timeline active={seguimiento.pagosRegistrados.length}>
        {seguimiento.pagosRegistrados.map((pago) => (
          <Timeline.Item key={pago.id} title={formatCurrency(pago.monto)}>
            <Text size="sm" c="dimmed">
              {pago.fecha.toLocaleDateString()} - {pago.metodoPago}
            </Text>
            {pago.referencia && <Text size="sm">Ref: {pago.referencia}</Text>}
            {pago.observaciones && (
              <Text size="sm" c="dimmed">
                {pago.observaciones}
              </Text>
            )}
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

// Componente para mostrar historial de contactos
const HistorialContactos: React.FC<{ seguimiento: SeguimientoPago }> = ({ seguimiento }) => {
  if (seguimiento.contactosRealizados.length === 0) return null;

  return (
    <div>
      <Text fw={500} mb="sm">
        Historial de Contactos
      </Text>
      <Timeline active={seguimiento.contactosRealizados.length}>
        {seguimiento.contactosRealizados.map((contacto) => (
          <Timeline.Item
            key={contacto.id}
            title={contacto.tipo.charAt(0).toUpperCase() + contacto.tipo.slice(1)}
          >
            <Text size="sm">{contacto.descripcion}</Text>
            <Text size="sm" c="dimmed">
              {contacto.fecha.toLocaleDateString()} -
              <Badge size="xs" color={getResultadoContactoColor(contacto.resultado)} ml="xs">
                {contacto.resultado}
              </Badge>
            </Text>
            {contacto.proximaAccion && (
              <Text size="sm" c="blue">
                Próxima acción: {contacto.proximaAccion}
                {contacto.fechaProximaAccion && (
                  <> ({contacto.fechaProximaAccion.toLocaleDateString()})</>
                )}
              </Text>
            )}
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

interface DetailModalProps {
  opened: boolean;
  onClose: () => void;
  seguimientoSeleccionado: SeguimientoPago | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  opened,
  onClose,
  seguimientoSeleccionado,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Detalle de Seguimiento" size="lg">
      {seguimientoSeleccionado && (
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500} size="lg">
              {seguimientoSeleccionado.numeroPartida}
            </Text>
            <Badge color={getEstadoColor(seguimientoSeleccionado.estado)}>
              {seguimientoSeleccionado.estado.toUpperCase()}
            </Badge>
          </Group>

          <Text>{seguimientoSeleccionado.cliente}</Text>
          <Text size="sm" c="dimmed">
            {seguimientoSeleccionado.descripcion}
          </Text>

          <ResumenFinanciero seguimiento={seguimientoSeleccionado} />
          <HistorialPagos seguimiento={seguimientoSeleccionado} />
          <HistorialContactos seguimiento={seguimientoSeleccionado} />
        </Stack>
      )}
    </Modal>
  );
};
