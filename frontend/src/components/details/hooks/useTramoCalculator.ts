import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { tramoService } from '../../../services/tramoService';
import { CalculationParams, CalculationResult } from '../TramoDetail.types';

export const useTramoCalculator = () => {
  const [calculatorOpened, { open: openCalculator, close: closeCalculator }] = useDisclosure();
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [calculationParams, setCalculationParams] = useState<CalculationParams>({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'TRMC',
    cantidad: 1,
    unidades: 1,
  });

  const calculateCost = async (tramoId: string) => {
    setCalculating(true);
    try {
      const result = await tramoService.calcularCosto(tramoId, calculationParams);
      setCalculationResult(result);
      notifications.show({
        title: 'Cálculo completado',
        message: `Costo calculado: $${result.costo}`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error al calcular costo del tramo', error);
      notifications.show({
        title: 'Error',
        message: 'Error al calcular costo',
        color: 'red',
      });
    } finally {
      setCalculating(false);
    }
  };

  const recalculateDistance = async (tramoId: string) => {
    try {
      await tramoService.recalcularDistancia(tramoId);
      notifications.show({
        title: 'Éxito',
        message: 'Distancia recalculada correctamente',
        color: 'green',
      });
    } catch (error) {
      console.error('Error al recalcular la distancia del tramo', error);
      notifications.show({
        title: 'Error',
        message: 'Error al recalcular distancia',
        color: 'red',
      });
    }
  };

  return {
    calculatorOpened,
    openCalculator,
    closeCalculator,
    calculating,
    calculationResult,
    calculationParams,
    setCalculationParams,
    calculateCost,
    recalculateDistance,
  };
};
