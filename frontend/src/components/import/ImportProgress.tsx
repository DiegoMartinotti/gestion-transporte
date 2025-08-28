import React, { useState, useEffect } from 'react';
import { Stack } from '@mantine/core';
import {
  MainProgressSection,
  DetailsCollapsed,
  StatusAlerts,
  ProcessingStats,
  calculateProcessingStats,
} from './ImportProgressComponents';

export interface ImportProgressProps {
  total: number;
  processed: number;
  errors: number;
  warnings: number;
  isProcessing: boolean;
  startTime?: Date;
  estimatedTime?: number;
  currentBatch?: number;
  totalBatches?: number;
  onRetry?: () => void;
  onCancel?: () => void;
}

// Configuración para el hook de estadísticas
interface ProcessingStatsConfig {
  processed: number;
  total: number;
  startTime: Date;
  successRate: number;
  isProcessing: boolean;
}

// Hook para manejo del estado de estadísticas
const useProcessingStats = (config: ProcessingStatsConfig) => {
  const [stats, setStats] = useState<ProcessingStats>({
    speed: 0,
    successRate: 0,
    estimatedCompletion: null,
    elapsedTime: 0,
  });

  useEffect(() => {
    const { isProcessing, startTime, processed, total, successRate } = config;
    if (isProcessing && startTime) {
      const interval = setInterval(() => {
        setStats(calculateProcessingStats(processed, total, startTime, successRate));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [config]);

  return stats;
};

// Hook para manejo de visibilidad de detalles
const useDetailsToggle = () => {
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => setShowDetails((prev) => !prev);

  return { showDetails, toggleDetails };
};

// Hook para cálculos derivados
const useDerivedStats = (total: number, processed: number, errors: number) => {
  const progress = total > 0 ? (processed / total) * 100 : 0;
  const successful = processed - errors;
  const successRate = processed > 0 ? (successful / processed) * 100 : 0;

  return { progress, successful, successRate };
};

export const ImportProgress: React.FC<ImportProgressProps> = ({
  total,
  processed,
  errors,
  warnings,
  isProcessing,
  startTime = new Date(),
  estimatedTime: _estimatedTime,
  currentBatch = 1,
  totalBatches = 1,
  onRetry,
  onCancel: _onCancel,
}) => {
  const { showDetails, toggleDetails } = useDetailsToggle();
  const { progress, successful, successRate } = useDerivedStats(total, processed, errors);
  const stats = useProcessingStats({
    processed,
    total,
    startTime,
    successRate,
    isProcessing,
  });

  return (
    <Stack gap="md">
      <MainProgressSection
        total={total}
        processed={processed}
        errors={errors}
        warnings={warnings}
        progress={progress}
        isProcessing={isProcessing}
        currentBatch={currentBatch}
        totalBatches={totalBatches}
        onToggleDetails={toggleDetails}
        showDetails={showDetails}
      />

      <DetailsCollapsed
        showDetails={showDetails}
        stats={stats}
        isProcessing={isProcessing}
        successful={successful}
        errors={errors}
        warnings={warnings}
        successRate={successRate}
        processed={processed}
      />

      <StatusAlerts
        errors={errors}
        warnings={warnings}
        onRetry={onRetry}
        isProcessing={isProcessing}
      />
    </Stack>
  );
};
