import React from 'react';
import {
  Modal,
  Stack,
  Alert,
  Group,
  Button,
  NumberInput,
  Select,
  Textarea,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { SeguimientoPago, PagoRegistrado } from '../hooks/usePaymentTracker';
import { formatCurrency } from '../utils/trackingHelpers';

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  seguimientoSeleccionado: SeguimientoPago | null;
  nuevoPago: Partial<PagoRegistrado>;
  setNuevoPago: (pago: Partial<PagoRegistrado>) => void;
  onRegistrarPago: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  opened,
  onClose,
  seguimientoSeleccionado,
  nuevoPago,
  setNuevoPago,
  onRegistrarPago,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Registrar Pago" size="md">
      <Stack gap="md">
        {seguimientoSeleccionado && (
          <Alert color="blue" title={seguimientoSeleccionado.numeroPartida}>
            Pendiente: {formatCurrency(seguimientoSeleccionado.montoPendiente)}
          </Alert>
        )}

        <DatePickerInput
          label="Fecha de Pago"
          placeholder="Seleccionar fecha"
          value={nuevoPago.fecha || null}
          onChange={(date) => setNuevoPago({ ...nuevoPago, fecha: date || undefined })}
          required
        />

        <NumberInput
          label="Monto"
          placeholder="Ingrese el monto"
          value={nuevoPago.monto}
          onChange={(value) => setNuevoPago({ ...nuevoPago, monto: Number(value) })}
          prefix="$"
          thousandSeparator="."
          decimalSeparator=","
          required
        />

        <Select
          label="Método de Pago"
          data={[
            { value: 'transferencia', label: 'Transferencia Bancaria' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'efectivo', label: 'Efectivo' },
            { value: 'otro', label: 'Otro' },
          ]}
          value={nuevoPago.metodoPago}
          onChange={(value) =>
            setNuevoPago({ ...nuevoPago, metodoPago: value as PagoRegistrado['metodoPago'] })
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <Text component="label" size="sm" fw={500}>
              Referencia
            </Text>
            <input
              type="text"
              placeholder="Número de referencia"
              value={nuevoPago.referencia || ''}
              onChange={(e) => setNuevoPago({ ...nuevoPago, referencia: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Observaciones adicionales..."
          value={nuevoPago.observaciones}
          onChange={(e) => setNuevoPago({ ...nuevoPago, observaciones: e.target.value })}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onRegistrarPago}>Registrar Pago</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
