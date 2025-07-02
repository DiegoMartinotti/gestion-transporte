import React, { useState, useCallback, useMemo } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Alert,
  Timeline,
  Badge,
  Card,
  SimpleGrid,
  Title,
  Select,
  Checkbox,
  Divider,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  ThemeIcon,
  Progress,
  List,
  Code,
  Accordion,
  Table,
  ScrollArea,
  JsonInput,
  NumberInput,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconRefresh,
  IconCheck,
  IconX,
  IconDatabase,
  IconRestore,
  IconDownload,
  IconUpload,
  IconClock,
  IconFileAnalytics,
  IconBug,
  IconWand,
  IconFileExport,
  IconInfoCircle,
  IconChevronRight,
  IconSettings,
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconCopy,
} from '@tabler/icons-react';

interface FailureDetails {
  timestamp: Date;
  entityType: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorType: 'validation' | 'network' | 'server' | 'timeout' | 'unknown';
  errorMessage: string;
  stackTrace?: string;
  lastSuccessfulRow?: number;
  failedData?: any[];
  recoveryOptions: RecoveryOption[];
}

interface RecoveryOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
  available: boolean;
  reason?: string;
}

interface RecoveryState {
  status: 'idle' | 'analyzing' | 'recovering' | 'completed' | 'failed';
  progress: number;
  currentAction?: string;
  logs: RecoveryLog[];
}

interface RecoveryLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

interface FailureRecoveryProps {
  failure: FailureDetails;
  onRecover?: (result: RecoveryResult) => void;
  onCancel?: () => void;
}

interface RecoveryResult {
  success: boolean;
  recoveredRecords: number;
  remainingErrors: number;
  logs: RecoveryLog[];
}

export const FailureRecovery: React.FC<FailureRecoveryProps> = ({
  failure,
  onRecover,
  onCancel,
}) => {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    status: 'idle',
    progress: 0,
    logs: [],
  });
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [retryConfig, setRetryConfig] = useState({
    batchSize: 100,
    retryDelay: 1000,
    maxRetries: 3,
    skipErrors: false,
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // Análisis del fallo
  const failureAnalysis = useMemo(() => {
    const successRate = failure.totalRecords > 0 
      ? ((failure.processedRecords - failure.failedRecords) / failure.totalRecords) * 100 
      : 0;
    
    const canRetryFromCheckpoint = failure.lastSuccessfulRow !== undefined && failure.lastSuccessfulRow > 0;
    const hasPartialData = failure.failedData && failure.failedData.length > 0;
    
    const severity = failure.failedRecords === failure.totalRecords ? 'critical' :
                    failure.failedRecords > failure.totalRecords * 0.5 ? 'high' :
                    failure.failedRecords > failure.totalRecords * 0.1 ? 'medium' : 'low';
    
    return {
      successRate,
      canRetryFromCheckpoint,
      hasPartialData,
      severity,
    };
  }, [failure]);

  // Agregar log
  const addLog = useCallback((level: RecoveryLog['level'], message: string, details?: any) => {
    const log: RecoveryLog = {
      timestamp: new Date(),
      level,
      message,
      details,
    };
    
    setRecoveryState(prev => ({
      ...prev,
      logs: [...prev.logs, log],
    }));
  }, []);

  // Opciones de recuperación
  const recoveryOptions: RecoveryOption[] = useMemo(() => [
    {
      id: 'retry-all',
      name: 'Reintentar todo',
      description: 'Vuelve a procesar todos los registros desde el inicio',
      icon: <IconRefresh size={20} />,
      action: async () => {
        addLog('info', 'Iniciando reintento completo...');
        // Simulación - en producción esto llamaría al backend
        await new Promise(resolve => setTimeout(resolve, 2000));
        addLog('success', 'Reintento completado');
      },
      available: true,
    },
    {
      id: 'retry-checkpoint',
      name: 'Continuar desde checkpoint',
      description: `Retomar desde la fila ${failure.lastSuccessfulRow || 0}`,
      icon: <IconRestore size={20} />,
      action: async () => {
        addLog('info', `Retomando desde fila ${failure.lastSuccessfulRow}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        addLog('success', 'Procesamiento retomado exitosamente');
      },
      available: !!failureAnalysis.canRetryFromCheckpoint,
      reason: !failureAnalysis.canRetryFromCheckpoint ? 'No hay checkpoint disponible' : undefined,
    },
    {
      id: 'retry-failed',
      name: 'Solo reintentar fallidos',
      description: 'Procesar únicamente los registros que fallaron',
      icon: <IconBug size={20} />,
      action: async () => {
        addLog('info', `Reintentando ${failure.failedRecords} registros fallidos`);
        await new Promise(resolve => setTimeout(resolve, 1800));
        addLog('success', 'Registros fallidos reprocesados');
      },
      available: !!failureAnalysis.hasPartialData,
      reason: !failureAnalysis.hasPartialData ? 'No hay datos de registros fallidos' : undefined,
    },
    {
      id: 'export-failed',
      name: 'Exportar fallidos',
      description: 'Descargar los registros que no se pudieron procesar',
      icon: <IconDownload size={20} />,
      action: async () => {
        setShowExportModal(true);
      },
      available: !!failureAnalysis.hasPartialData,
      reason: !failureAnalysis.hasPartialData ? 'No hay datos para exportar' : undefined,
    },
    {
      id: 'auto-fix',
      name: 'Corrección automática',
      description: 'Intentar corregir errores comunes automáticamente',
      icon: <IconWand size={20} />,
      action: async () => {
        addLog('info', 'Analizando errores para corrección automática...');
        await new Promise(resolve => setTimeout(resolve, 2500));
        addLog('warning', 'Se corrigieron 15 errores automáticamente');
        addLog('info', 'Quedan 8 errores que requieren revisión manual');
      },
      available: failure.errorType === 'validation',
      reason: failure.errorType !== 'validation' ? 'Solo disponible para errores de validación' : undefined,
    },
  ], [failure, failureAnalysis, addLog]);

  // Ejecutar recuperación
  const executeRecovery = useCallback(async () => {
    setRecoveryState(prev => ({ ...prev, status: 'analyzing', progress: 10 }));
    addLog('info', 'Analizando opciones de recuperación...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRecoveryState(prev => ({ ...prev, status: 'recovering', progress: 30 }));
    
    // Ejecutar opciones seleccionadas
    const selectedOptionsList = recoveryOptions.filter(opt => selectedOptions.has(opt.id));
    
    for (let i = 0; i < selectedOptionsList.length; i++) {
      const option = selectedOptionsList[i];
      setRecoveryState(prev => ({
        ...prev,
        currentAction: option.name,
        progress: 30 + (60 / selectedOptionsList.length) * i,
      }));
      
      try {
        await option.action();
      } catch (error) {
        addLog('error', `Error al ejecutar ${option.name}: ${error}`);
      }
    }
    
    setRecoveryState(prev => ({ ...prev, status: 'completed', progress: 100 }));
    addLog('success', 'Proceso de recuperación completado');
    
    if (onRecover) {
      onRecover({
        success: true,
        recoveredRecords: failure.failedRecords * 0.8, // Simulación
        remainingErrors: failure.failedRecords * 0.2,
        logs: recoveryState.logs,
      });
    }
  }, [selectedOptions, recoveryOptions, failure, addLog, onRecover, recoveryState.logs]);

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'validation': return <IconAlertCircle size={20} />;
      case 'network': return <IconDatabase size={20} />;
      case 'server': return <IconX size={20} />;
      case 'timeout': return <IconClock size={20} />;
      default: return <IconBug size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <Stack spacing="lg">
      {/* Encabezado */}
      <Card withBorder>
        <Group position="apart">
          <div>
            <Title order={3}>Recuperación de fallos</Title>
            <Text size="sm" color="dimmed">
              Analiza y recupera los datos que no se pudieron importar
            </Text>
          </div>
          <Badge
            size="xl"
            color={getSeverityColor(failureAnalysis.severity)}
            leftSection={getErrorIcon(failure.errorType)}
          >
            {failure.errorType.toUpperCase()}
          </Badge>
        </Group>
      </Card>
      
      {/* Resumen del fallo */}
      <SimpleGrid cols={4} spacing="md">
        <Card withBorder>
          <Stack spacing={4} align="center">
            <Text size="xs" color="dimmed">Total registros</Text>
            <Text size="xl" weight={700}>{failure.totalRecords}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack spacing={4} align="center">
            <Text size="xs" color="dimmed">Procesados</Text>
            <Text size="xl" weight={700} color="green">
              {failure.processedRecords - failure.failedRecords}
            </Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack spacing={4} align="center">
            <Text size="xs" color="dimmed">Fallidos</Text>
            <Text size="xl" weight={700} color="red">{failure.failedRecords}</Text>
          </Stack>
        </Card>
        
        <Card withBorder>
          <Stack spacing={4} align="center">
            <Text size="xs" color="dimmed">Tasa de éxito</Text>
            <Text size="xl" weight={700}>
              {Math.round(failureAnalysis.successRate)}%
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>
      
      {/* Detalles del error */}
      <Paper p="md" withBorder>
        <Stack spacing="sm">
          <Group position="apart">
            <Text weight={500}>Detalles del error</Text>
            <Badge>{new Date(failure.timestamp).toLocaleString()}</Badge>
          </Group>
          
          <Alert
            icon={getErrorIcon(failure.errorType)}
            color={getSeverityColor(failureAnalysis.severity)}
          >
            <Text weight={500}>{failure.errorMessage}</Text>
          </Alert>
          
          {failure.stackTrace && (
            <Accordion>
              <Accordion.Item value="stack">
                <Accordion.Control icon={<IconBug size={16} />}>
                  Stack trace
                </Accordion.Control>
                <Accordion.Panel>
                  <Code block style={{ fontSize: 12 }}>
                    {failure.stackTrace}
                  </Code>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}
        </Stack>
      </Paper>
      
      {/* Opciones de recuperación */}
      <Paper p="md" withBorder>
        <Stack spacing="md">
          <Group position="apart">
            <Text weight={500}>Opciones de recuperación</Text>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => setShowAdvanced(!showAdvanced)}
              rightIcon={<IconSettings size={14} />}
            >
              Configuración avanzada
            </Button>
          </Group>
          
          <Stack spacing="sm">
            {recoveryOptions.map(option => (
              <Card
                key={option.id}
                withBorder
                style={{
                  opacity: option.available ? 1 : 0.6,
                  cursor: option.available ? 'pointer' : 'not-allowed',
                }}
              >
                <Group position="apart">
                  <Group>
                    <Checkbox
                      checked={selectedOptions.has(option.id)}
                      onChange={(e) => {
                        if (!option.available) return;
                        const newSelected = new Set(selectedOptions);
                        if (e.currentTarget.checked) {
                          newSelected.add(option.id);
                        } else {
                          newSelected.delete(option.id);
                        }
                        setSelectedOptions(newSelected);
                      }}
                      disabled={!option.available}
                    />
                    <ThemeIcon
                      size="lg"
                      radius="md"
                      variant="light"
                      color={option.available ? 'blue' : 'gray'}
                    >
                      {option.icon}
                    </ThemeIcon>
                    <div>
                      <Text weight={500}>{option.name}</Text>
                      <Text size="sm" color="dimmed">
                        {option.description}
                      </Text>
                      {option.reason && (
                        <Text size="xs" color="red" mt={4}>
                          {option.reason}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
          
          {showAdvanced && (
            <Paper p="sm" withBorder>
              <Stack spacing="sm">
                <Text size="sm" weight={500}>Configuración avanzada</Text>
                <SimpleGrid cols={2} spacing="sm">
                  <NumberInput
                    label="Tamaño de lote"
                    description="Registros por lote"
                    value={retryConfig.batchSize}
                    onChange={(val) => setRetryConfig(prev => ({ ...prev, batchSize: val || 100 }))}
                    min={1}
                    max={1000}
                  />
                  <NumberInput
                    label="Delay entre reintentos"
                    description="Milisegundos"
                    value={retryConfig.retryDelay}
                    onChange={(val) => setRetryConfig(prev => ({ ...prev, retryDelay: val || 1000 }))}
                    min={100}
                    max={10000}
                  />
                  <NumberInput
                    label="Máximo de reintentos"
                    description="Por registro"
                    value={retryConfig.maxRetries}
                    onChange={(val) => setRetryConfig(prev => ({ ...prev, maxRetries: val || 3 }))}
                    min={1}
                    max={10}
                  />
                  <Checkbox
                    label="Omitir errores irrecuperables"
                    checked={retryConfig.skipErrors}
                    onChange={(e) => setRetryConfig(prev => ({ ...prev, skipErrors: e.currentTarget.checked }))}
                  />
                </SimpleGrid>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>
      
      {/* Estado de recuperación */}
      {recoveryState.status !== 'idle' && (
        <Paper p="md" withBorder>
          <Stack spacing="md">
            <Group position="apart">
              <Text weight={500}>Progreso de recuperación</Text>
              <Badge color={recoveryState.status === 'completed' ? 'green' : 'blue'}>
                {recoveryState.status === 'analyzing' && 'Analizando...'}
                {recoveryState.status === 'recovering' && 'Recuperando...'}
                {recoveryState.status === 'completed' && 'Completado'}
                {recoveryState.status === 'failed' && 'Fallido'}
              </Badge>
            </Group>
            
            <Progress
              value={recoveryState.progress}
              size="lg"
              radius="md"
              striped={recoveryState.status === 'recovering'}
              animate={recoveryState.status === 'recovering'}
            />
            
            {recoveryState.currentAction && (
              <Text size="sm" color="dimmed">
                {recoveryState.currentAction}...
              </Text>
            )}
            
            {/* Logs */}
            <ScrollArea style={{ height: 200 }}>
              <Timeline active={-1} bulletSize={20} lineWidth={2}>
                {recoveryState.logs.map((log, index) => (
                  <Timeline.Item
                    key={index}
                    bullet={
                      log.level === 'error' ? <IconX size={12} /> :
                      log.level === 'warning' ? <IconAlertCircle size={12} /> :
                      log.level === 'success' ? <IconCheck size={12} /> :
                      <IconInfoCircle size={12} />
                    }
                    color={
                      log.level === 'error' ? 'red' :
                      log.level === 'warning' ? 'yellow' :
                      log.level === 'success' ? 'green' :
                      'blue'
                    }
                  >
                    <Text size="sm">{log.message}</Text>
                    <Text size="xs" color="dimmed">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </ScrollArea>
          </Stack>
        </Paper>
      )}
      
      {/* Acciones */}
      <Group position="apart">
        <Group>
          {recoveryState.status === 'completed' && (
            <Button
              variant="light"
              leftIcon={<IconFileExport size={16} />}
              onClick={() => {
                // Exportar logs
              }}
            >
              Exportar logs
            </Button>
          )}
        </Group>
        
        <Group>
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          
          <Button
            leftIcon={
              recoveryState.status === 'recovering' ? 
                <IconPlayerPause size={16} /> : 
                <IconPlayerPlay size={16} />
            }
            onClick={executeRecovery}
            disabled={selectedOptions.size === 0 || recoveryState.status === 'recovering'}
            loading={recoveryState.status === 'recovering'}
          >
            {recoveryState.status === 'recovering' ? 'Recuperando...' : 'Iniciar recuperación'}
          </Button>
        </Group>
      </Group>
      
      {/* Modal de exportación */}
      <Modal
        opened={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exportar registros fallidos"
      >
        <Stack spacing="md">
          <Alert icon={<IconInfoCircle size={16} />}>
            Se exportarán {failure.failedRecords} registros que no pudieron ser procesados.
          </Alert>
          
          <Select
            label="Formato de exportación"
            data={[
              { value: 'excel', label: 'Excel (.xlsx)' },
              { value: 'csv', label: 'CSV (.csv)' },
              { value: 'json', label: 'JSON (.json)' },
            ]}
            defaultValue="excel"
          />
          
          <Checkbox
            label="Incluir detalles del error en cada registro"
            defaultChecked
          />
          
          <Group position="right">
            <Button variant="default" onClick={() => setShowExportModal(false)}>
              Cancelar
            </Button>
            <Button leftIcon={<IconDownload size={16} />}>
              Descargar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};