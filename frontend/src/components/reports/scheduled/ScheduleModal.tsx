import React from 'react';
import { Modal, Group, Button } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { ScheduleForm } from './ScheduleForm';
import { ReportDefinition } from '../../../types/reports';
import { ScheduleFormData } from './useScheduleForm';

interface ScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  form: UseFormReturnType<ScheduleFormData>;
  reportDefinitions: ReportDefinition[];
  isEditing: boolean;
  onSubmit: (values: ScheduleFormData) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  opened,
  onClose,
  form,
  reportDefinitions,
  isEditing,
  onSubmit,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Editar Reporte Programado' : 'Programar Nuevo Reporte'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <ScheduleForm form={form} reportDefinitions={reportDefinitions} />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{isEditing ? 'Actualizar' : 'Programar'}</Button>
        </Group>
      </form>
    </Modal>
  );
};
