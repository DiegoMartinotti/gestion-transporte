import { notifications } from '@mantine/notifications';
import {
  formulaService,
  Formula,
  CreateFormulaData,
  UpdateFormulaData,
} from '../services/formulaService';

export const createFormula = async (data: CreateFormulaData) => {
  await formulaService.create(data);
  notifications.show({
    title: 'Éxito',
    message: 'Fórmula creada correctamente',
    color: 'green',
  });
};

export const updateFormula = async (formulaId: string, data: UpdateFormulaData) => {
  await formulaService.update(formulaId, data);
  notifications.show({
    title: 'Éxito',
    message: 'Fórmula actualizada correctamente',
    color: 'green',
  });
};

export const showValidationError = () => {
  notifications.show({
    title: 'Error',
    message: 'La fórmula contiene errores. Por favor corrígela antes de guardar.',
    color: 'red',
  });
};

export const showConflictError = () => {
  notifications.show({
    title: 'Conflicto de vigencias',
    message: 'Existen fórmulas que se superponen en las fechas seleccionadas',
    color: 'red',
  });
};

export const showSubmitError = (error: unknown) => {
  const errorMessage =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Error al guardar la fórmula'
      : 'Error al guardar la fórmula';
  notifications.show({
    title: 'Error',
    message: errorMessage,
    color: 'red',
  });
};

export const validateSubmission = (
  validationResult: { isValid: boolean } | null,
  conflictos: Formula[]
): boolean => {
  if (!validationResult?.isValid) {
    showValidationError();
    return false;
  }

  if (conflictos.length > 0) {
    showConflictError();
    return false;
  }

  return true;
};

export const prepareSubmissionData = (values: {
  clienteId: string;
  tipoUnidad: string;
  formula: string;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
}) => {
  return {
    ...values,
    vigenciaDesde: values.vigenciaDesde.toISOString(),
    vigenciaHasta: values.vigenciaHasta?.toISOString() || null,
  };
};
