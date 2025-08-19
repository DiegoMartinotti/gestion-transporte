import React from 'react';
import { Modal, Stack, Group, Text, Badge, Grid } from '@mantine/core';
import { formatCurrency, getEstadoColor } from '../utils/formatters';
import { PartidaReportData, EstadoPartida } from '../types';

interface PartidaDetailModalProps {
  opened: boolean;
  onClose: () => void;
  partida: PartidaReportData | null;
}

const DetailHeader: React.FC<{
  numero: string;
  estado: EstadoPartida;
}> = ({ numero, estado }) => (
  <Group justify="space-between">
    <Text fw={500} size="lg">
      {numero}
    </Text>
    <Badge color={getEstadoColor(estado)}>{estado.toUpperCase()}</Badge>
  </Group>
);

const InfoGrid: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <Grid>{children}</Grid>;

const InfoField: React.FC<{
  label: string;
  value: string;
  span?: number;
}> = ({ label, value, span = 6 }) => (
  <Grid.Col span={span}>
    <Text size="sm" c="dimmed">
      {label}
    </Text>
    <Text fw={500}>{value}</Text>
  </Grid.Col>
);

const ColoredInfoField: React.FC<{
  label: string;
  value: string;
  color: string;
  span?: number;
}> = ({ label, value, color, span = 4 }) => (
  <Grid.Col span={span}>
    <Text size="sm" c="dimmed">
      {label}
    </Text>
    <Text fw={500} c={color}>
      {value}
    </Text>
  </Grid.Col>
);

const DescriptionField: React.FC<{
  descripcion: string;
}> = ({ descripcion }) => (
  <div>
    <Text size="sm" c="dimmed">
      Descripción
    </Text>
    <Text>{descripcion}</Text>
  </div>
);

const PaymentDateField: React.FC<{
  fechaPago?: Date;
}> = ({ fechaPago }) => {
  if (!fechaPago) return null;

  return (
    <div>
      <Text size="sm" c="dimmed">
        Fecha de Pago
      </Text>
      <Text c="green">{fechaPago.toLocaleDateString()}</Text>
    </div>
  );
};

export const PartidaDetailModal: React.FC<PartidaDetailModalProps> = ({
  opened,
  onClose,
  partida,
}) => {
  if (!partida) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Detalle de Partida" size="md">
      <Stack gap="md">
        <DetailHeader numero={partida.numero} estado={partida.estado} />

        <InfoGrid>
          <InfoField label="Orden de Compra" value={partida.ordenCompra} />
          <InfoField label="Cliente" value={partida.cliente} />
        </InfoGrid>

        <DescriptionField descripcion={partida.descripcion} />

        <InfoGrid>
          <ColoredInfoField
            label="Monto Original"
            value={formatCurrency(partida.montoOriginal)}
            color="blue"
          />
          <ColoredInfoField
            label="Importe Pagado"
            value={formatCurrency(partida.importePagado)}
            color="green"
          />
          <ColoredInfoField
            label="Importe Pendiente"
            value={formatCurrency(partida.importePendiente)}
            color="orange"
          />
        </InfoGrid>

        <InfoGrid>
          <InfoField label="Fecha Creación" value={partida.fechaCreacion.toLocaleDateString()} />
          <InfoField
            label="Fecha Vencimiento"
            value={partida.fechaVencimiento?.toLocaleDateString() || 'No definida'}
          />
        </InfoGrid>

        <PaymentDateField fechaPago={partida.fechaPago} />
      </Stack>
    </Modal>
  );
};
