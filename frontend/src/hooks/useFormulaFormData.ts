import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { formulaService, ValidationResult, Formula } from '../services/formulaService';
import { clienteService } from '../services/clienteService';
import { Cliente } from '../types';
export interface FormValues {
  clienteId: string;
  tipoUnidad: 'Sider' | 'Bitren' | 'General';
  formula: string;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}

export const useFormulaFormData = (formulaId?: string) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [conflictos, setConflictos] = useState<Formula[]>([]);

  const loadClientes = useCallback(async () => {
    try {
      const response = await clienteService.getAll();
      const clientesData = Array.isArray(response)
        ? response
        : Array.isArray(response.data)
          ? response.data
          : response?.items || [];
      setClientes(clientesData);
    } catch (error) {
      console.error('Error loading clientes:', error);
      setClientes([]);
    }
  }, []);

  const loadFormula = useCallback(
    async (form: { setValues: (values: Partial<FormValues>) => void }) => {
      if (!formulaId) return;

      try {
        setLoading(true);
        const response = await formulaService.getById(formulaId);
        const formula = response.data;

        if (formula) {
          form.setValues({
            clienteId: formula.clienteId,
            tipoUnidad: formula.tipoUnidad,
            formula: formula.formula,
            vigenciaDesde: new Date(formula.vigenciaDesde),
            vigenciaHasta: formula.vigenciaHasta ? new Date(formula.vigenciaHasta) : null,
          });
        }
      } catch (error) {
        console.error('Error loading formula:', error);
        notifications.show({
          title: 'Error',
          message: 'No se pudo cargar la fórmula',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    },
    [formulaId]
  );

  const validateFormula = useCallback(async (formula: string) => {
    try {
      const result = await formulaService.validate(formula);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Error al validar la fórmula'],
      });
    }
  }, []);

  const checkConflictos = useCallback(
    async (values: Partial<FormValues>) => {
      if (!values.clienteId || !values.tipoUnidad || !values.vigenciaDesde) {
        return;
      }

      try {
        const response = await formulaService.checkConflictos({
          clienteId: values.clienteId,
          tipoUnidad: values.tipoUnidad,
          vigenciaDesde: values.vigenciaDesde,
          vigenciaHasta: values.vigenciaHasta || null,
          excludeId: formulaId,
        });
        setConflictos(response.data || []);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    },
    [formulaId]
  );

  return {
    clientes,
    loading,
    setLoading,
    validationResult,
    conflictos,
    loadClientes,
    loadFormula,
    validateFormula,
    checkConflictos,
  };
};
