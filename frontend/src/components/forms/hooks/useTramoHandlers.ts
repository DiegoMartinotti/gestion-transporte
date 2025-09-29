import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { Site, TarifaHistorica } from '../../../types';
import { calculateDistance, validateTarifaConflicts } from '../helpers/tramoHelpers';

interface TramoFormValues {
  cliente: string;
  origen: string;
  destino: string;
  distancia: number;
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
  const [conflicts, setConflicts] = useState<unknown[]>([]);
  const [validatingConflicts, setValidatingConflicts] = useState(false);

  const handleValidateTarifaConflicts = useCallback(async () => {
    await validateTarifaConflicts({
      formValues: form.values,
      setConflicts,
      setValidatingConflicts,
    });
  }, [form.values]);

  const handleCalculateDistance = async () => {
    await calculateDistance({
      origen: form.values.origen,
      destino: form.values.destino,
      sitesFiltered,
      setCalculatingDistance,
      onSuccess: (distance: number) => form.setFieldValue('distancia', distance),
    });
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
