import React, { useEffect, useState } from 'react';
import {
  Progress,
  Stack,
  Group,
  Text,
  Paper,
  Badge,
  Timeline,
  ThemeIcon,
  Card,
  SimpleGrid,
  RingProgress,
  Center,
  Title,
  Alert,
  Collapse,
  ActionIcon,
  Divider,
  Box,
  Transition,
  Button,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconClock,
  IconDatabase,
  IconFileImport,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconFileCheck,
  IconFileX,
  IconFileAlert,
  IconPercentage,
  IconTrendingUp,
  IconListCheck,
} from '@tabler/icons-react';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface ImportProgressProps {
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

interface ProcessingStats {
  speed: number;
  successRate: number;
  estimatedCompletion: Date | null;
  elapsedTime: number;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  total,
  processed,
  errors,
  warnings,
  isProcessing,
  startTime = new Date(),
  estimatedTime,
  currentBatch = 1,
  totalBatches = 1,
  onRetry,
  onCancel,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({
    speed: 0,
    successRate: 0,
    estimatedCompletion: null,
    elapsedTime: 0,
  });

  const progress = total > 0 ? (processed / total) * 100 : 0;
  const successful = processed - errors;
  const successRate = processed > 0 ? (successful / processed) * 100 : 0;

  useEffect(() => {
    if (isProcessing && startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - startTime.getTime();
        const elapsedSeconds = elapsed / 1000;
        
        const speed = elapsedSeconds > 0 ? processed / elapsedSeconds : 0;
        const remaining = total - processed;
        const estimatedSeconds = speed > 0 ? remaining / speed : 0;
        const estimatedCompletion = speed > 0 
          ? new Date(now.getTime() + estimatedSeconds * 1000)
          : null;
        
        setStats({
          speed: Math.round(speed * 10) / 10,
          successRate: Math.round(successRate * 10) / 10,
          estimatedCompletion,
          elapsedTime: elapsedSeconds,
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isProcessing, startTime, processed, total, successRate]);

  const getStatusColor = () => {
    if (errors > 0) return 'red';
    if (warnings > 0) return 'yellow';
    return 'green';
  };

  const getStatusIcon = () => {
    if (errors > 0) return <IconX size={16} />;
    if (warnings > 0) return <IconAlertCircle size={16} />;
    return <IconCheck size={16} />;
  };

  return (
    <Stack gap="md">
      {/* Progreso principal */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Group>
              <Text fw={500}>Progreso de importación</Text>
              <Badge color={getStatusColor()} leftSection={getStatusIcon()}>
                {processed} / {total}
              </Badge>
            </Group>
            
            <Group>
              {totalBatches > 1 && (
                <Badge variant="light">
                  Lote {currentBatch} de {totalBatches}
                </Badge>
              )}
              
              <ActionIcon
                variant="subtle"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <IconChevronUp /> : <IconChevronDown />}
              </ActionIcon>
            </Group>
          </Group>
          
          <Progress
            value={progress}
            size="xl"
            radius="md"
            color={getStatusColor()}
            striped={isProcessing}
            animated={isProcessing}
          />
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {Math.round(progress)}% completado
            </Text>
            
            {isProcessing && stats.estimatedCompletion && (
              <Text size="sm" c="dimmed">
                Tiempo estimado: {formatDistanceToNow(stats.estimatedCompletion)}
              </Text>
            )}
          </Group>
        </Stack>
      </Paper>
      
      {/* Estadísticas rápidas */}
      <SimpleGrid cols={4} spacing="md">
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="blue" variant="light">
              <IconFileImport size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Procesados</Text>
            <Text size="xl" fw={700}>{processed}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="green" variant="light">
              <IconFileCheck size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Exitosos</Text>
            <Text size="xl" fw={700} c="green">{successful}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="yellow" variant="light">
              <IconFileAlert size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Advertencias</Text>
            <Text size="xl" fw={700} c="yellow">{warnings}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack gap={4} align="center">
            <ThemeIcon size="lg" radius="md" c="red" variant="light">
              <IconFileX size={20} />
            </ThemeIcon>
            <Text size="xs" c="dimmed">Errores</Text>
            <Text size="xl" fw={700} c="red">{errors}</Text>
          </Stack>
        </Card>
      </SimpleGrid>
      
      {/* Detalles expandibles */}
      <Collapse in={showDetails}>
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Title order={5}>Detalles del proceso</Title>
            
            <SimpleGrid cols={2} spacing="lg">
              {/* Gráfico de anillo */}
              <Card withBorder>
                <Stack align="center">
                  <Text size="sm" fw={500}>Tasa de éxito</Text>
                  <RingProgress
                    size={120}
                    thickness={12}
                    sections={[
                      { value: stats.successRate, color: 'green' },
                      { value: 100 - stats.successRate, color: 'gray' },
                    ]}
                    label={
                      <Center>
                        <Stack gap={0} align="center">
                          <Text size="xl" fw={700}>
                            {Math.round(stats.successRate)}%
                          </Text>
                          <Text size="xs" c="dimmed">
                            éxito
                          </Text>
                        </Stack>
                      </Center>
                    }
                  />
                </Stack>
              </Card>
              
              {/* Estadísticas de rendimiento */}
              <Card withBorder>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Rendimiento</Text>
                  
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconTrendingUp size={16} color="var(--mantine-color-blue-6)" />
                      <Text size="sm">Velocidad:</Text>
                    </Group>
                    <Badge variant="light">
                      {stats.speed} registros/seg
                    </Badge>
                  </Group>
                  
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconClock size={16} color="var(--mantine-color-blue-6)" />
                      <Text size="sm">Tiempo transcurrido:</Text>
                    </Group>
                    <Badge variant="light">
                      {Math.floor(stats.elapsedTime / 60)}m {Math.floor(stats.elapsedTime % 60)}s
                    </Badge>
                  </Group>
                  
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconPercentage size={16} color="var(--mantine-color-blue-6)" />
                      <Text size="sm">Progreso por lote:</Text>
                    </Group>
                    <Badge variant="light">
                      {Math.round((currentBatch / totalBatches) * 100)}%
                    </Badge>
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>
            
            {/* Timeline de eventos */}
            <Divider />
            
            <Timeline active={-1} bulletSize={24} lineWidth={2}>
              <Timeline.Item
                bullet={<IconDatabase size={12} />}
                title="Inicio del proceso"
              >
                <Text c="dimmed" size="sm">
                  {startTime.toLocaleTimeString()} - Iniciando importación de {total} registros
                </Text>
              </Timeline.Item>
              
              {currentBatch > 1 && (
                <Timeline.Item
                  bullet={<IconListCheck size={12} />}
                  title={`Lotes procesados: ${currentBatch - 1}`}
                >
                  <Text c="dimmed" size="sm">
                    Completados {(currentBatch - 1) * Math.floor(total / totalBatches)} registros
                  </Text>
                </Timeline.Item>
              )}
              
              {warnings > 0 && (
                <Timeline.Item
                  bullet={<IconAlertCircle size={12} />}
                  title="Advertencias detectadas"
                  c="yellow"
                >
                  <Text c="dimmed" size="sm">
                    Se encontraron {warnings} advertencias durante el proceso
                  </Text>
                </Timeline.Item>
              )}
              
              {errors > 0 && (
                <Timeline.Item
                  bullet={<IconX size={12} />}
                  title="Errores encontrados"
                  c="red"
                >
                  <Text c="dimmed" size="sm">
                    {errors} registros no pudieron ser importados
                  </Text>
                </Timeline.Item>
              )}
              
              {!isProcessing && processed === total && (
                <Timeline.Item
                  bullet={<IconCheck size={12} />}
                  title="Proceso completado"
                  c="green"
                >
                  <Text c="dimmed" size="sm">
                    Importación finalizada en {Math.floor(stats.elapsedTime / 60)}m {Math.floor(stats.elapsedTime % 60)}s
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Stack>
        </Paper>
      </Collapse>
      
      {/* Alertas y acciones */}
      {errors > 0 && !isProcessing && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Errores en la importación"
          color="red"
        >
          <Stack gap="sm">
            <Text size="sm">
              Se encontraron {errors} errores durante la importación. 
              Puede revisar el detalle de los errores y corregirlos manualmente.
            </Text>
            
            {onRetry && (
              <Group>
                <Button
                  size="sm"
                  variant="light"
                  c="red"
                  leftSection={<IconRefresh size={16} />}
                  onClick={onRetry}
                >
                  Reintentar importación
                </Button>
              </Group>
            )}
          </Stack>
        </Alert>
      )}
      
      {warnings > 0 && errors === 0 && !isProcessing && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Importación completada con advertencias"
          color="yellow"
        >
          <Text size="sm">
            La importación se completó exitosamente, pero se encontraron {warnings} advertencias.
            Los registros fueron importados pero podrían requerir revisión.
          </Text>
        </Alert>
      )}
      
      {processed === total && errors === 0 && warnings === 0 && !isProcessing && (
        <Alert
          icon={<IconCheck size={16} />}
          title="Importación exitosa"
          color="green"
        >
          <Text size="sm">
            Todos los registros fueron importados correctamente sin errores ni advertencias.
          </Text>
        </Alert>
      )}
    </Stack>
  );
};