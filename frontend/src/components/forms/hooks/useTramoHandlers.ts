import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { Site, TarifaHistorica } from '../../../types';
import { calculateDistance, validateTarifaConflicts } from '../helpers/tramoHelpers';

interface TramoFormValues {
  origen: string;
  destino: string;
  tarifasHistoricas: TarifaHistorica[];
}

export const useTramoHandlers = (
  form: {
    values: TramoFormValues;
    setFieldValue: (field: string, value: number) => void;
  },
  sitesFiltered: Site[],
  onSubmit: (values: TramoFormValues) => void
) => {
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [conflicts, setConflicts] = useState<
    Array<{
      tipo: string;
      metodoCalculo: string;
      fechaInicio: string;
      fechaFin: string;
      message: string;
    }>
  >([]);
  const [validatingConflicts, setValidatingConflicts] = useState(false);

  const handleValidateTarifaConflicts = useCallback(async () => {
    await validateTarifaConflicts(form.values, setConflicts, setValidatingConflicts);
  }, [form.values]);

  const handleCalculateDistance = async () => {
    await calculateDistance(
      form.values.origen,
      form.values.destino,
      sitesFiltered,
      setCalculatingDistance,
      (distance) => form.setFieldValue('distancia', distance)
    );
  };

  const handleSubmit = (values: TramoFormValues) => {
    if (conflicts.length > 0) {
      notifications.show({
        title: 'Error',
        message: 'Hay conflictos en las tarifas que deben resolverse',
        color: 'red',
      });
      return;
    }

    onSubmit(values);
  };

  return {
    calculatingDistance,
    conflicts,
    validatingConflicts,
    handleValidateTarifaConflicts,
    handleCalculateDistance,
    handleSubmit,
  };
};
