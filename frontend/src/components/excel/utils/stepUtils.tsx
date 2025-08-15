import React from 'react';
import { Loader } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { ImportStep } from '../ExcelImportProgress';

type StepStatus = 'pending' | 'running' | 'completed' | 'error' | 'skipped';

export const getStepIcon = (step: ImportStep): React.ReactNode => {
  const iconMap: Record<StepStatus, React.ReactNode> = {
    completed: <IconCheck size={16} color="var(--mantine-color-green-6)" />,
    error: <IconX size={16} color="var(--mantine-color-red-6)" />,
    running: <Loader size={16} />,
    pending: <IconClock size={16} color="var(--mantine-color-gray-6)" />,
    skipped: <IconAlertTriangle size={16} color="var(--mantine-color-yellow-6)" />,
  };

  return iconMap[step.status] || iconMap.pending;
};

export const getStepColor = (status: StepStatus): string => {
  const colorMap: Record<StepStatus, string> = {
    completed: 'green',
    error: 'red',
    running: 'blue',
    skipped: 'yellow',
    pending: 'gray',
  };
  return colorMap[status] || 'gray';
};
