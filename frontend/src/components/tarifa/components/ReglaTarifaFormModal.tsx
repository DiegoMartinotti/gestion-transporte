import React, { useEffect } from 'react';
import { Modal, Stack, Group, Button } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import FormBasicFields from './FormBasicFields';
import CondicionesForm from './CondicionesForm';
import ModificadoresForm from './ModificadoresForm';
import { IReglaTarifa, ReglaTarifaFormData } from '../../../types/tarifa';
import { Cliente } from '../../../types';

interface ReglaTarifaFormModalProps {
  opened: boolean;
  onClose: () => void;
  editingRule: IReglaTarifa | null;
  form: UseFormReturnType<ReglaTarifaFormData>;
  clientes: Cliente[];
  onSubmit: (values: ReglaTarifaFormData, editingRule?: IReglaTarifa | null) => void;
}

const ReglaTarifaFormModal: React.FC<ReglaTarifaFormModalProps> = ({
  opened,
  onClose,
  editingRule,
  form,
  clientes,
  onSubmit,
}) => {
  // Update form when editing
  useEffect(() => {
    if (editingRule) {
      form.setValues({
        codigo: editingRule.codigo,
        nombre: editingRule.nombre,
        descripcion: editingRule.descripcion || '',
        cliente: editingRule.cliente,
        metodoCalculo: editingRule.metodoCalculo,
        condiciones: editingRule.condiciones,
        operadorLogico: editingRule.operadorLogico,
        modificadores: editingRule.modificadores,
        prioridad: editingRule.prioridad,
        activa: editingRule.activa,
        fechaInicioVigencia: editingRule.fechaInicioVigencia,
        fechaFinVigencia: editingRule.fechaFinVigencia || '',
        aplicarEnCascada: editingRule.aplicarEnCascada || true,
        excluirOtrasReglas: editingRule.excluirOtrasReglas || false,
        diasSemana: editingRule.diasSemana || [],
        horariosAplicacion: editingRule.horariosAplicacion || {
          horaInicio: '',
          horaFin: '',
        },
      });
    } else {
      form.reset();
    }
  }, [editingRule, form]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingRule ? 'Editar Regla de Tarifa' : 'Nueva Regla de Tarifa'}
      size="xl"
    >
      <form onSubmit={form.onSubmit((values) => onSubmit(values, editingRule))}>
        <Stack gap="md">
          <FormBasicFields form={form} clientes={clientes} />

          {/* Condiciones - simplificado */}
          <CondicionesForm
            condiciones={form.values.condiciones}
            onCondicionesChange={(condiciones) => form.setFieldValue('condiciones', condiciones)}
          />

          {/* Modificadores - simplificado */}
          <ModificadoresForm
            modificadores={form.values.modificadores}
            onModificadoresChange={(modificadores) =>
              form.setFieldValue('modificadores', modificadores)
            }
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editingRule ? 'Actualizar' : 'Crear'} Regla</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ReglaTarifaFormModal;
