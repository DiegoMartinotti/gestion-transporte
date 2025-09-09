import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { VehicleDetectionResult, VehicleSpecs } from './VehicleTypeDetector';
import { detectVehicleType } from './detectionUtils';

interface UseVehicleDetectionProps {
  vehicleSpecs: VehicleSpecs;
  cargaEstimada?: number;
  distanciaViaje?: number;
  tipoRuta?: string;
  onDetectionResult: (result: VehicleDetectionResult) => void;
}

export const useVehicleDetection = ({
  vehicleSpecs,
  cargaEstimada,
  distanciaViaje,
  tipoRuta = 'mixta',
  onDetectionResult,
}: UseVehicleDetectionProps) => {
  const [detecting, setDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<VehicleDetectionResult | null>(null);
  const [manualOverride, setManualOverride] = useState<string | null>(null);

  const performDetection = useCallback(async () => {
    setDetecting(true);

    try {
      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = detectVehicleType(vehicleSpecs, cargaEstimada, distanciaViaje, tipoRuta);
      setLastResult(result);
      onDetectionResult(result);
    } catch (error) {
      console.error('Error in detection:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al detectar tipo de vehículo',
        color: 'red',
      });
    } finally {
      setDetecting(false);
    }
  }, [vehicleSpecs, cargaEstimada, distanciaViaje, tipoRuta, onDetectionResult]);

  useEffect(() => {
    if (vehicleSpecs.capacidadCarga) {
      performDetection();
    }
  }, [performDetection, vehicleSpecs.capacidadCarga]);

  const handleManualOverride = useCallback(
    (value: string | null) => {
      setManualOverride(value);
      if (value) {
        const manualResult: VehicleDetectionResult = {
          tipoUnidad: value,
          confidence: 100,
          reasons: ['Selección manual del usuario'],
          recommendations: ['Verificar que la selección manual sea correcta'],
          alternativeTypes: [],
        };
        onDetectionResult(manualResult);
      }
    },
    [onDetectionResult]
  );

  const resetToAutomatic = useCallback(() => {
    setManualOverride(null);
    if (lastResult) {
      onDetectionResult(lastResult);
    }
  }, [lastResult, onDetectionResult]);

  return {
    detecting,
    lastResult,
    manualOverride,
    performDetection,
    handleManualOverride,
    resetToAutomatic,
  };
};
