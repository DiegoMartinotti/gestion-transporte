import React from 'react';
import { Stack } from '@mantine/core';
import { DetectionHeader } from './DetectionHeader';
import { AnalysisParameters } from './AnalysisParameters';
import { DetectionResult } from './DetectionResult';
import { ManualOverride } from './ManualOverride';
import { EmptyState } from './EmptyState';
import { useVehicleDetection } from './useVehicleDetection';

export interface VehicleDetectionResult {
  tipoUnidad: string;
  confidence: number;
  reasons: string[];
  recommendations: string[];
  alternativeTypes: Array<{
    tipo: string;
    confidence: number;
    reason: string;
  }>;
}

export interface VehicleSpecs {
  capacidadCarga: number;
  dimensiones?: {
    largo?: number;
    ancho?: number;
    alto?: number;
  };
  tipoCarroceria?: string;
  cantidadEjes?: number;
  pesoVacio?: number;
  combustible?: string;
}

interface VehicleTypeDetectorProps {
  vehicleSpecs: VehicleSpecs;
  onDetectionResult: (result: VehicleDetectionResult) => void;
  cargaEstimada?: number;
  distanciaViaje?: number;
  tipoRuta?: 'urbana' | 'ruta' | 'mixta';
}

export function VehicleTypeDetector({
  vehicleSpecs,
  onDetectionResult,
  cargaEstimada,
  distanciaViaje,
  tipoRuta = 'mixta',
}: VehicleTypeDetectorProps) {
  const {
    detecting,
    lastResult,
    manualOverride,
    performDetection,
    handleManualOverride,
    resetToAutomatic,
  } = useVehicleDetection({
    vehicleSpecs,
    cargaEstimada,
    distanciaViaje,
    tipoRuta,
    onDetectionResult,
  });

  return (
    <Stack gap="md">
      <DetectionHeader
        vehicleSpecs={vehicleSpecs}
        detecting={detecting}
        onDetect={performDetection}
      />

      <AnalysisParameters vehicleSpecs={vehicleSpecs} cargaEstimada={cargaEstimada} />

      {lastResult && <DetectionResult result={lastResult} />}

      <ManualOverride
        manualOverride={manualOverride}
        onManualOverride={handleManualOverride}
        onResetToAutomatic={resetToAutomatic}
      />

      {!vehicleSpecs.capacidadCarga && <EmptyState />}
    </Stack>
  );
}
