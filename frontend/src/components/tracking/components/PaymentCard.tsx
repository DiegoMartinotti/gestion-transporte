import React from 'react';
import { Card, Group, Text, Badge, ActionIcon, Grid, Progress } from '@mantine/core';
import { IconEye, IconCurrency, IconPhone } from '@tabler/icons-react';
import { SeguimientoPago } from '../hooks/usePaymentTracker';
import {
  formatCurrency,
  getPrioridadColor,
  getEstadoColor,
  getResultadoContactoColor,
} from '../utils/trackingHelpers';

interface PaymentCardProps {
  seguimiento: SeguimientoPago;
  onViewDetail: (seguimiento: SeguimientoPago) => void;
  onRegisterPayment: (seguimiento: SeguimientoPago) => void;
  onRegisterContact: (seguimiento: SeguimientoPago) => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  seguimiento,
  onViewDetail,
  onRegisterPayment,
  onRegisterContact,
}) => {
  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <Text fw={500}>{seguimiento.numeroPartida}</Text>
          <Badge color={getEstadoColor(seguimiento.estado)} size="sm">
            {seguimiento.estado.toUpperCase()}
          </Badge>
          <Badge color={getPrioridadColor(seguimiento.prioridad)} size="sm">
            {seguimiento.prioridad.toUpperCase()}
          </Badge>
          {seguimiento.diasVencimiento && (
            <Badge color="red" size="sm">
              Vencida {seguimiento.diasVencimiento} días
            </Badge>
          )}
        </Group>
        <Group gap="xs">
          <ActionIcon variant="light" color="blue" onClick={() => onViewDetail(seguimiento)}>
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="green" onClick={() => onRegisterPayment(seguimiento)}>
            <IconCurrency size={16} />
          </ActionIcon>
          <ActionIcon variant="light" color="orange" onClick={() => onRegisterContact(seguimiento)}>
            <IconPhone size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={8}>
          <Text size="sm" c="dimmed" mb="xs">
            {seguimiento.cliente}
          </Text>
          <Text size="sm" mb="xs">
            {seguimiento.descripcion}
          </Text>

          {/* Progreso de Pagos */}
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed">
              Pagado: {formatCurrency(seguimiento.montoAcumulado)} /{' '}
              {formatCurrency(seguimiento.montoTotal)}
            </Text>
            <Text size="xs" c="dimmed">
              {((seguimiento.montoAcumulado / seguimiento.montoTotal) * 100).toFixed(1)}%
            </Text>
          </Group>
          <Progress
            value={(seguimiento.montoAcumulado / seguimiento.montoTotal) * 100}
            color={seguimiento.estado === 'pagada' ? 'green' : 'blue'}
            size="sm"
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Text size="sm" c="dimmed">
            Pendiente
          </Text>
          <Text size="lg" fw={700} c={seguimiento.montoPendiente > 0 ? 'orange' : 'green'}>
            {formatCurrency(seguimiento.montoPendiente)}
          </Text>

          {seguimiento.proximoSeguimiento && (
            <>
              <Text size="xs" c="dimmed" mt="xs">
                Próximo seguimiento
              </Text>
              <Text size="sm">{seguimiento.proximoSeguimiento.toLocaleDateString()}</Text>
            </>
          )}
        </Grid.Col>
      </Grid>

      {/* Último contacto */}
      {seguimiento.contactosRealizados.length > 0 && (
        <Group gap="xs" mt="sm">
          <Text size="xs" c="dimmed">
            Último contacto:
          </Text>
          <Badge
            size="xs"
            color={getResultadoContactoColor(
              seguimiento.contactosRealizados[seguimiento.contactosRealizados.length - 1].resultado
            )}
          >
            {seguimiento.contactosRealizados[seguimiento.contactosRealizados.length - 1].tipo}
          </Badge>
          <Text size="xs" c="dimmed">
            {seguimiento.contactosRealizados[
              seguimiento.contactosRealizados.length - 1
            ].fecha.toLocaleDateString()}
          </Text>
        </Group>
      )}
    </Card>
  );
};
