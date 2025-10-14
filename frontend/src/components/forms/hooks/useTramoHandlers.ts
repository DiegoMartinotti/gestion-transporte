import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { Site, TarifaHistorica } from '../../../types';
import {
  calculateDistance,
  validateTarifaConflicts,
  TarifaConflict,
} from '../helpers/tramoHelpers';

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
  const [conflicts, setConflicts] = useState<TarifaConflict[]>([]);
  const [validatingConflicts, setValidatingConflicts] = useState(false);

  const handleValidateTarifaConflicts = useCallback(async () => {
    try {
      await validateTarifaConflicts({
        formValues: form.values,
        setConflicts,
        setValidatingConflicts,
      });
    } catch (error) {
      console.error('No se pudieron validar las tarifas del tramo:', error);
    }
  }, [form.values, setConflicts, setValidatingConflicts]);

  const handleCalculateDistance = async () => {
    try {
      await calculateDistance({
        origen: form.values.origen,
        destino: form.values.destino,
        sitesFiltered,
        setCalculatingDistance,
        onSuccess: (distance: number) => form.setFieldValue('distancia', distance),
      });
    } catch (error) {
      console.error('No se pudo calcular la distancia del tramo:', error);
    }
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
