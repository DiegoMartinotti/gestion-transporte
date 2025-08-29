import React from 'react';
import { Modal, Stack, Alert, Group, Button, Select, Textarea, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { SeguimientoPago, ContactoSeguimiento } from '../hooks/usePaymentTracker';

interface ContactModalProps {
  opened: boolean;
  onClose: () => void;
  seguimientoSeleccionado: SeguimientoPago | null;
  nuevoContacto: Partial<ContactoSeguimiento>;
  setNuevoContacto: (contacto: Partial<ContactoSeguimiento>) => void;
  onRegistrarContacto: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  opened,
  onClose,
  seguimientoSeleccionado,
  nuevoContacto,
  setNuevoContacto,
  onRegistrarContacto,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Registrar Contacto" size="md">
      <Stack gap="md">
        {seguimientoSeleccionado && (
          <Alert color="blue" title={seguimientoSeleccionado.numeroPartida}>
            {seguimientoSeleccionado.cliente}
          </Alert>
        )}

        <DatePickerInput
          label="Fecha del Contacto"
          placeholder="Seleccionar fecha"
          value={nuevoContacto.fecha || new Date()}
          onChange={(date) => setNuevoContacto({ ...nuevoContacto, fecha: date || new Date() })}
        />

        <Select
          label="Tipo de Contacto"
          data={[
            { value: 'email', label: 'Email' },
            { value: 'telefono', label: 'Teléfono' },
            { value: 'visita', label: 'Visita' },
            { value: 'otro', label: 'Otro' },
          ]}
          value={nuevoContacto.tipo}
          onChange={(value) =>
            setNuevoContacto({ ...nuevoContacto, tipo: value as ContactoSeguimiento['tipo'] })
          }
        />

        <Textarea
          label="Descripción"
          placeholder="Describa el contacto realizado..."
          value={nuevoContacto.descripcion}
          onChange={(e) => setNuevoContacto({ ...nuevoContacto, descripcion: e.target.value })}
          required
        />

        <Select
          label="Resultado"
          data={[
            { value: 'exitoso', label: 'Exitoso' },
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'sin_respuesta', label: 'Sin Respuesta' },
          ]}
          value={nuevoContacto.resultado}
          onChange={(value) =>
            setNuevoContacto({
              ...nuevoContacto,
              resultado: value as ContactoSeguimiento['resultado'],
            })
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div>
            <Text component="label" size="sm" fw={500}>
              Próxima Acción
            </Text>
            <input
              type="text"
              placeholder="Describa la próxima acción..."
              value={nuevoContacto.proximaAccion || ''}
              onChange={(e) =>
                setNuevoContacto({ ...nuevoContacto, proximaAccion: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <DatePickerInput
          label="Fecha Próxima Acción"
          placeholder="Seleccionar fecha"
          value={nuevoContacto.fechaProximaAccion || null}
          onChange={(date) =>
            setNuevoContacto({ ...nuevoContacto, fechaProximaAccion: date || undefined })
          }
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onRegistrarContacto}>Registrar Contacto</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
