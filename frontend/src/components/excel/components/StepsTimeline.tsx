import React from 'react';
import { Paper, Text, Timeline } from '@mantine/core';
import { ImportStep } from '../ExcelImportProgress';
import { StepItem } from './StepItem';

interface StepsTimelineProps {
  steps: ImportStep[];
  expandedSteps: Record<string, boolean>;
  onToggleDetails: (stepId: string) => void;
  showDetails: boolean;
}

export const StepsTimeline: React.FC<StepsTimelineProps> = ({
  steps,
  expandedSteps,
  onToggleDetails,
  showDetails,
}) => {
  const activeStepIndex = steps.findIndex((step) => step.status === 'running');

  return (
    <Paper p="md" withBorder>
      <Text fw={500} size="sm" mb="md">
        Pasos de Importación
      </Text>

      <Timeline active={activeStepIndex} bulletSize={24}>
        {steps.map((step) => (
          <StepItem
            key={step.id}
            step={step}
            expanded={expandedSteps[step.id]}
            onToggleDetails={onToggleDetails}
            showDetails={showDetails}
          />
        ))}
      </Timeline>
    </Paper>
  );
};
