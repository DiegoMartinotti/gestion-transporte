import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { useFormulaForm, FormValues } from '../../hooks/useFormulaForm';
import { FormContainer } from './FormulaForm/FormContainer';

interface FormulaFormProps {
  clienteId?: string;
  formulaId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export const FormulaForm: React.FC<FormulaFormProps> = ({
  clienteId,
  formulaId,
  onSave,
  onCancel,
}) => {
  const [showHelper, setShowHelper] = useState(false);

  const {
    clientes,
    loading,
    validationResult,
    conflictos,
    loadClientes,
    loadFormula,
    validateFormula,
    checkConflictos,
    handleSubmit,
  } = useFormulaForm(formulaId);

  const form = useForm<FormValues>({
    initialValues: {
      clienteId: clienteId || '',
      tipoUnidad: 'General',
      formula: 'Valor * Palets + Peaje',
      vigenciaDesde: new Date(),
      vigenciaHasta: null,
    },
    validate: {
      clienteId: (value) => (!value ? 'Cliente es requerido' : null),
      formula: (value) => (!value ? 'Fórmula es requerida' : null),
      vigenciaDesde: (value) => (!value ? 'Fecha de inicio es requerida' : null),
      vigenciaHasta: (value, values) => {
        if (value && values.vigenciaDesde && value <= values.vigenciaDesde) {
          return 'Fecha de fin debe ser posterior a la fecha de inicio';
        }
        return null;
      },
    },
  });

  const loadData = useCallback(() => {
    loadClientes();
    if (formulaId) {
      loadFormula(form);
    }
  }, [formulaId, loadClientes, loadFormula, form]);

  const validateCurrentFormula = useCallback(() => {
    if (form.values.formula) {
      validateFormula(form.values.formula);
    }
  }, [form.values.formula, validateFormula]);

  const checkFormConflictos = useCallback(() => {
    if (form.values.clienteId && form.values.tipoUnidad && form.values.vigenciaDesde) {
      checkConflictos(form.values);
    }
  }, [form.values, checkConflictos]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    validateCurrentFormula();
  }, [validateCurrentFormula]);

  useEffect(() => {
    checkFormConflictos();
  }, [checkFormConflictos]);

  const insertExample = useCallback(
    (formula: string) => {
      form.setFieldValue('formula', formula);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      handleSubmit(values, onSave);
    },
    [handleSubmit, onSave]
  );

  return (
    <FormContainer
      form={form}
      clientes={clientes}
      clienteId={clienteId}
      formulaId={formulaId}
      loading={loading}
      validationResult={validationResult}
      conflictos={conflictos}
      showHelper={showHelper}
      setShowHelper={setShowHelper}
      insertExample={insertExample}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};
