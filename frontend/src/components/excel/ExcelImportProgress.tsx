import React, { useEffect, useState } from 'react';
import {
  Stack,
  Paper,
  Text,
  Progress,
  Group,
  Badge,
  Box,
  Timeline,
  ThemeIcon,
  Alert,
  Button,
  ActionIcon,
  Collapse,
  Divider,
  ScrollArea,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconAlertTriangle,
  IconFileSpreadsheet,
  IconDatabase,
  IconUpload,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
} from '@tabler/icons-react';

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
  onCancel?: () => void;
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
  onCancel,
  onRetry,
  showDetails = true,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - stats.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, stats.startTime]);

  const toggleStepDetails = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const getStepIcon = (step: ImportStep) => {
    switch (step.status) {
      case 'completed':
        return <IconCheck size={16} color="var(--mantine-color-green-6)" />;
      case 'error':
        return <IconX size={16} color="var(--mantine-color-red-6)" />;
      case 'running':
        return <Loader size={16} />;
      case 'pending':
        return <IconClock size={16} color="var(--mantine-color-gray-6)" />;
      case 'skipped':
        return <IconAlertTriangle size={16} color="var(--mantine-color-yellow-6)" />;
      default:
        return <IconClock size={16} color="var(--mantine-color-gray-6)" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'running':
        return 'blue';
      case 'skipped':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getOverallProgress = () => {
    if (stats.totalRecords === 0) return 0;
    return Math.round((stats.processedRecords / stats.totalRecords) * 100);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!stats.processingRate || stats.processedRecords === 0) return null;
    
    const remainingRecords = stats.totalRecords - stats.processedRecords;
    const estimatedSeconds = Math.ceil(remainingRecords / stats.processingRate);
    return formatTime(estimatedSeconds);
  };

  const hasErrors = steps.some(step => step.status === 'error');
  const isCompleted = steps.every(step => step.status === 'completed' || step.status === 'skipped');

  return (
    <Stack gap="md">
      {/* Header */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconFileSpreadsheet size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={500} size="sm">
                Importación de {entityType}
              </Text>
              <Text size="xs" c="dimmed">
                {fileName}
              </Text>
            </Box>
          </Group>
          
          <Group gap="sm">
            {isRunning && canPause && onPause && (
              <ActionIcon variant="light" color="orange" onClick={onPause}>
                <IconPlayerPause size={16} />
              </ActionIcon>
            )}
            
            {!isRunning && onResume && !isCompleted && !hasErrors && (
              <ActionIcon variant="light" color="green" onClick={onResume}>
                <IconPlayerPlay size={16} />
              </ActionIcon>
            )}
            
            {hasErrors && onRetry && (
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                color="blue"
                size="sm"
                onClick={onRetry}
              >
                Reintentar
              </Button>
            )}
            
            {canCancel && onCancel && !isCompleted && (
              <Button
                leftSection={<IconX size={16} />}
                variant="light"
                color="red"
                size="sm"
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Progress Overview */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">
              Progreso General
            </Text>
            <Badge
              color={hasErrors ? 'red' : isCompleted ? 'green' : isRunning ? 'blue' : 'gray'}
              variant="light"
            >
              {hasErrors ? 'Con errores' : isCompleted ? 'Completado' : isRunning ? 'En progreso' : 'Pausado'}
            </Badge>
          </Group>
          
          <Progress
            value={getOverallProgress()}
            size="lg"
            color={hasErrors ? 'red' : isCompleted ? 'green' : 'blue'}
            animated={isRunning}
          />
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {stats.processedRecords} de {stats.totalRecords} registros procesados
            </Text>
            <Text size="sm" fw={500}>
              {getOverallProgress()}%
            </Text>
          </Group>
        </Stack>
      </Paper>

      {/* Statistics */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500} size="sm">
            Estadísticas
          </Text>
        </Group>
        
        <Group gap="xl">
          <Box>
            <Text size="xs" c="dimmed">
              Tiempo transcurrido
            </Text>
            <Text fw={500}>
              {formatTime(elapsedTime)}
            </Text>
          </Box>
          
          {getEstimatedTimeRemaining() && (
            <Box>
              <Text size="xs" c="dimmed">
                Tiempo estimado restante
              </Text>
              <Text fw={500}>
                {getEstimatedTimeRemaining()}
              </Text>
            </Box>
          )}
          
          <Box>
            <Text size="xs" c="dimmed">
              Exitosos
            </Text>
            <Text fw={500} c="green">
              {stats.successfulRecords}
            </Text>
          </Box>
          
          <Box>
            <Text size="xs" c="dimmed">
              Fallidos
            </Text>
            <Text fw={500} c="red">
              {stats.failedRecords}
            </Text>
          </Box>
          
          <Box>
            <Text size="xs" c="dimmed">
              Omitidos
            </Text>
            <Text fw={500} c="yellow">
              {stats.skippedRecords}
            </Text>
          </Box>
          
          {stats.processingRate && (
            <Box>
              <Text size="xs" c="dimmed">
                Velocidad
              </Text>
              <Text fw={500}>
                {Math.round(stats.processingRate)}/s
              </Text>
            </Box>
          )}
        </Group>
      </Paper>

      {/* Steps Timeline */}
      <Paper p="md" withBorder>
        <Text fw={500} size="sm" mb="md">
          Pasos de Importación
        </Text>
        
        <Timeline active={steps.findIndex(s => s.status === 'running')} bulletSize={24}>
          {steps.map((step, index) => (
            <Timeline.Item
              key={step.id}
              bullet={getStepIcon(step)}
              title={
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
                      {step.status === 'running' ? 'Ejecutando' :
                       step.status === 'completed' ? 'Completado' :
                       step.status === 'error' ? 'Error' :
                       step.status === 'skipped' ? 'Omitido' : 'Pendiente'}
                    </Badge>
                    {showDetails && (step.details || step.message) && (
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => toggleStepDetails(step.id)}
                      >
                        {expandedSteps[step.id] ? (
                          <IconChevronDown size={12} />
                        ) : (
                          <IconChevronRight size={12} />
                        )}
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              }
            >
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
              
              {showDetails && expandedSteps[step.id] && (
                <Collapse in={expandedSteps[step.id]}>
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
              )}
            </Timeline.Item>
          ))}
        </Timeline>
      </Paper>

      {/* Error Summary */}
      {hasErrors && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="red"
          title="Se encontraron errores durante la importación"
        >
          <Text size="sm">
            Algunos pasos fallaron durante el proceso de importación. 
            Revisa los detalles de cada paso y usa el botón "Reintentar" para continuar.
          </Text>
        </Alert>
      )}

      {/* Success Summary */}
      {isCompleted && !hasErrors && (
        <Alert
          icon={<IconCheck size={16} />}
          color="green"
          title="Importación completada exitosamente"
        >
          <Text size="sm">
            Se importaron {stats.successfulRecords} registros correctamente en {formatTime(elapsedTime)}.
            {stats.skippedRecords > 0 && ` Se omitieron ${stats.skippedRecords} registros.`}
          </Text>
        </Alert>
      )}
    </Stack>
  );
};

export default ExcelImportProgress;