import React, { useState } from 'react';
import { Stack } from '@mantine/core';
import { ImportHeader } from './components/ImportHeader';
import { ProgressOverview } from './components/ProgressOverview';
import { Statistics } from './components/Statistics';
import { StepsTimeline } from './components/StepsTimeline';
import { StatusAlerts } from './components/StatusAlerts';
import { useElapsedTime } from './hooks/useElapsedTime';

export interface ImportStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress?: number;
  message?: string;
  details?: string[];
  startTime?: Date;
  endTime?: Date;
  recordsProcessed?: number;
  recordsTotal?: number;
}

export interface ImportStats {
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  startTime: Date;
  estimatedEndTime?: Date;
  processingRate?: number; // records per second
}

export interface ExcelImportProgressProps {
  steps: ImportStep[];
  stats: ImportStats;
  fileName?: string;
  entityType?: string;
  isRunning?: boolean;
  canPause?: boolean;
  canCancel?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  _onCancel?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ExcelImportProgress: React.FC<ExcelImportProgressProps> = ({
  steps,
  stats,
  fileName = 'archivo.xlsx',
  entityType = 'datos',
  isRunning = false,
  canPause = false,
  canCancel = true,
  onPause,
  onResume,
  _onCancel,
  onRetry,
  showDetails = true,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const elapsedTime = useElapsedTime(isRunning, stats.startTime);

  const toggleStepDetails = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const getOverallProgress = (): number => {
    if (stats.totalRecords === 0) return 0;
    return Math.round((stats.processedRecords / stats.totalRecords) * 100);
  };

  const getEstimatedTimeRemaining = (): string | null => {
    if (!stats.processingRate || stats.processedRecords === 0) return null;

    const remainingRecords = stats.totalRecords - stats.processedRecords;
    const estimatedSeconds = Math.ceil(remainingRecords / stats.processingRate);
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasErrors = steps.some((step) => step.status === 'error');
  const isCompleted = steps.every(
    (step) => step.status === 'completed' || step.status === 'skipped'
  );

  return (
    <Stack gap="md">
      <ImportHeader
        fileName={fileName}
        entityType={entityType}
        isRunning={isRunning}
        isCompleted={isCompleted}
        hasErrors={hasErrors}
        canPause={canPause}
        canCancel={canCancel}
        onPause={onPause}
        onResume={onResume}
        onCancel={_onCancel}
        onRetry={onRetry}
      />

      <ProgressOverview
        stats={stats}
        hasErrors={hasErrors}
        isCompleted={isCompleted}
        isRunning={isRunning}
        overallProgress={getOverallProgress()}
      />

      <Statistics
        stats={stats}
        elapsedTime={elapsedTime}
        estimatedTimeRemaining={getEstimatedTimeRemaining()}
      />

      <StepsTimeline
        steps={steps}
        expandedSteps={expandedSteps}
        onToggleDetails={toggleStepDetails}
        showDetails={showDetails}
      />

      <StatusAlerts
        hasErrors={hasErrors}
        isCompleted={isCompleted}
        stats={stats}
        elapsedTime={elapsedTime}
      />
    </Stack>
  );
};

export default ExcelImportProgress;
