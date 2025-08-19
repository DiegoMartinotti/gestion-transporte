import React from 'react';
import {
  Timeline,
  Group,
  Text,
  Badge,
  ActionIcon,
  Progress,
  Collapse,
  Paper,
  ScrollArea,
  Stack,
} from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ImportStep } from '../ExcelImportProgress';
import { getStepIcon, getStepColor } from '../utils/stepUtils';

interface StepItemProps {
  step: ImportStep;
  expanded: boolean;
  onToggleDetails: (stepId: string) => void;
  showDetails: boolean;
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    running: 'Ejecutando',
    completed: 'Completado',
    error: 'Error',
    skipped: 'Omitido',
    pending: 'Pendiente',
  };
  return statusMap[status] || 'Pendiente';
};

const StepTitle: React.FC<{
  step: ImportStep;
  hasDetails: boolean;
  expanded: boolean;
  onToggleDetails: (id: string) => void;
}> = ({ step, hasDetails, expanded, onToggleDetails }) => (
  <Group justify="space-between" align="center">
    <Text fw={500} size="sm">
      {step.title}
    </Text>
    <Group gap="xs">
      {step.recordsProcessed !== undefined && step.recordsTotal !== undefined && (
        <Text size="xs" c="dimmed">
          {step.recordsProcessed}/{step.recordsTotal}
        </Text>
      )}
      <Badge size="xs" color={getStepColor(step.status)} variant="light">
        {getStatusText(step.status)}
      </Badge>
      {hasDetails && (
        <ActionIcon size="xs" variant="subtle" onClick={() => onToggleDetails(step.id)}>
          {expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </ActionIcon>
      )}
    </Group>
  </Group>
);

const StepContent: React.FC<{ step: ImportStep }> = ({ step }) => (
  <>
    <Text size="sm" c="dimmed" mb="xs">
      {step.description}
    </Text>

    {step.message && (
      <Text size="sm" c={step.status === 'error' ? 'red' : 'inherit'} mb="xs">
        {step.message}
      </Text>
    )}

    {step.progress !== undefined && step.status === 'running' && (
      <Progress value={step.progress} size="sm" mb="xs" animated />
    )}
  </>
);

const StepDetails: React.FC<{ step: ImportStep; expanded: boolean }> = ({ step, expanded }) => (
  <Collapse in={expanded}>
    <Paper p="sm" withBorder mt="xs">
      {step.details && step.details.length > 0 && (
        <ScrollArea h={100}>
          <Stack gap="xs">
            {step.details.map((detail, detailIndex) => (
              <Text key={detailIndex} size="xs" c="dimmed">
                • {detail}
              </Text>
            ))}
          </Stack>
        </ScrollArea>
      )}

      {step.startTime && (
        <Group gap="md" mt="xs">
          <Text size="xs" c="dimmed">
            Inicio: {step.startTime.toLocaleTimeString()}
          </Text>
          {step.endTime && (
            <Text size="xs" c="dimmed">
              Fin: {step.endTime.toLocaleTimeString()}
            </Text>
          )}
        </Group>
      )}
    </Paper>
  </Collapse>
);

export const StepItem: React.FC<StepItemProps> = ({
  step,
  expanded,
  onToggleDetails,
  showDetails,
}) => {
  const hasDetails = showDetails && !!(step.details || step.message);

  return (
    <Timeline.Item
      bullet={getStepIcon(step)}
      title={
        <StepTitle
          step={step}
          hasDetails={hasDetails}
          expanded={expanded}
          onToggleDetails={onToggleDetails}
        />
      }
    >
      <StepContent step={step} />
      {hasDetails && <StepDetails step={step} expanded={expanded} />}
    </Timeline.Item>
  );
};
