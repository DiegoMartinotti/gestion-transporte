import React, { useState, useEffect } from 'react';
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  getInitialValues,
  tarifaValidationRules,
  validateTarifaConflicts,
  TarifaHistorica,
} from './validation/tarifaValidation';
import {
  renderConflictAlerts,
  renderFormFields,
  renderPreview,
  renderActions,
} from './helpers/tarifaHelpers';

interface TarifaFormProps {
  tarifa?: TarifaHistorica | null;
  onSubmit: (data: Omit<TarifaHistorica, '_id'>) => void;
  onCancel: () => void;
  existingTarifas: TarifaHistorica[];
}

const TarifaForm: React.FC<TarifaFormProps> = ({ tarifa, onSubmit, onCancel, existingTarifas }) => {
  const [conflicts, setConflicts] = useState<string[]>([]);

  const form = useForm({
    initialValues: getInitialValues(tarifa),
    validate: tarifaValidationRules,
  });

  // Validar conflictos cuando cambien los valores relevantes
  useEffect(() => {
    const newConflicts = validateTarifaConflicts(form.values, existingTarifas, tarifa);
    setConflicts(newConflicts);
  }, [
    form.values.tipo,
    form.values.metodoCalculo,
    form.values.vigenciaDesde,
    form.values.vigenciaHasta,
    existingTarifas,
    tarifa,
    form.values,
  ]);

  const handleSubmit = (values: ReturnType<typeof getInitialValues>) => {
    if (conflicts.length > 0) return;

    onSubmit({
      tipo: values.tipo,
      metodoCalculo: values.metodoCalculo,
      valor: values.valor,
      valorPeaje: values.valorPeaje,
      vigenciaDesde: values.vigenciaDesde.toISOString(),
      vigenciaHasta: values.vigenciaHasta.toISOString(),
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {renderConflictAlerts(conflicts, form.isValid())}
        {renderFormFields(form)}
        {renderPreview(form.values)}
        {renderActions(onCancel, tarifa, form.isValid(), conflicts)}
      </Stack>
    </form>
  );
};

export default TarifaForm;
