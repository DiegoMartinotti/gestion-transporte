import React from 'react';
import { Stack, Textarea, Select, Group, Button } from '@mantine/core';
import { DateInput } from '@mantine/dates';

export interface EventoFormData {
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones: string;
  responsable: string;
  fecha: Date;
}

interface EventoFormProps {
  formData: EventoFormData;
  setFormData: (data: EventoFormData) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitText: string;
}

export const EventoForm: React.FC<EventoFormProps> = ({
  formData,
  setFormData,
  onCancel,
  onSubmit,
  submitText,
}) => (
  <Stack gap="md">
    <Textarea
      label="Descripción"
      placeholder="Describa el evento..."
      required
      value={formData.descripcion}
      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
    />

    <Select
      label="Estado"
      required
      value={formData.estado}
      onChange={(value) => setFormData({ ...formData, estado: value as EventoFormData['estado'] })}
      data={[
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'en_progreso', label: 'En Progreso' },
        { value: 'completado', label: 'Completado' },
        { value: 'cancelado', label: 'Cancelado' },
      ]}
    />

    <DateInput
      label="Fecha"
      required
      value={formData.fecha}
      onChange={(date) => {
        setFormData({
          ...formData,
          fecha: date ? (typeof date === 'string' ? new Date(date) : date) : new Date(),
        });
      }}
    />

    <Textarea
      label="Observaciones"
      placeholder="Observaciones adicionales..."
      value={formData.observaciones}
      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
    />

    <Textarea
      label="Responsable"
      placeholder="Persona responsable..."
      value={formData.responsable}
      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
    />

    <Group justify="flex-end">
      <Button variant="light" onClick={onCancel}>
        Cancelar
      </Button>
      <Button onClick={onSubmit}>{submitText}</Button>
    </Group>
  </Stack>
);
