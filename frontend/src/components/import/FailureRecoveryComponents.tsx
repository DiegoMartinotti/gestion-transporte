import * as React from 'react';
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
  Select,
  Checkbox,
  Modal,
  ThemeIcon,
  Progress,
  ScrollArea,
  NumberInput,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconDownload,
  IconInfoCircle,
  IconSettings,
} from '@tabler/icons-react';
import { RecoveryLog, RecoveryOption, RecoveryState, RetryConfig } from './FailureRecoveryTypes';

interface LogsTimelineProps {
  logs: RecoveryLog[];
}

export const LogsTimeline: React.FC<LogsTimelineProps> = ({ logs }) => (
  <ScrollArea style={{ height: 200 }}>
    <Timeline active={-1} bulletSize={20} lineWidth={2}>
      {logs.map((log, index) => (
        <Timeline.Item
          key={index}
          bullet={
            log.level === 'error' ? (
              <IconX size={12} />
            ) : log.level === 'warning' ? (
              <IconAlertCircle size={12} />
            ) : log.level === 'success' ? (
              <IconCheck size={12} />
            ) : (
              <IconInfoCircle size={12} />
            )
          }
          color={
            log.level === 'error'
              ? 'red'
              : log.level === 'warning'
                ? 'yellow'
                : log.level === 'success'
                  ? 'green'
                  : 'blue'
          }
        >
          <Text size="sm">{log.message}</Text>
          <Text size="xs" c="dimmed">
            {new Date(log.timestamp).toLocaleTimeString()}
          </Text>
        </Timeline.Item>
      ))}
    </Timeline>
  </ScrollArea>
);

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  failedRecords: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({ opened, onClose, failedRecords }) => (
  <Modal opened={opened} onClose={onClose} title="Exportar registros fallidos">
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />}>
        Se exportarán {failedRecords} registros que no pudieron ser procesados.
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

      <Checkbox label="Incluir detalles del error en cada registro" defaultChecked />

      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancelar
        </Button>
        <Button leftSection={<IconDownload size={16} />}>Descargar</Button>
      </Group>
    </Stack>
  </Modal>
);

interface RecoveryOptionsSectionProps {
  recoveryOptions: RecoveryOption[];
  selectedOptions: Set<string>;
  onSelectionChange: (options: Set<string>) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  retryConfig: RetryConfig;
  onRetryConfigChange: (config: RetryConfig) => void;
}

export const RecoveryOptionsSection: React.FC<RecoveryOptionsSectionProps> = ({
  recoveryOptions,
  selectedOptions,
  onSelectionChange,
  showAdvanced,
  onToggleAdvanced,
  retryConfig,
  onRetryConfigChange,
}) => (
  <Paper p="md" withBorder>
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>Opciones de recuperación</Text>
        <Button
          size="xs"
          variant="subtle"
          onClick={onToggleAdvanced}
          rightSection={<IconSettings size={14} />}
        >
          Configuración avanzada
        </Button>
      </Group>

      <RecoveryOptionsList
        recoveryOptions={recoveryOptions}
        selectedOptions={selectedOptions}
        onSelectionChange={onSelectionChange}
      />

      {showAdvanced && (
        <AdvancedConfigSection
          retryConfig={retryConfig}
          onRetryConfigChange={onRetryConfigChange}
        />
      )}
    </Stack>
  </Paper>
);

interface RecoveryOptionsListProps {
  recoveryOptions: RecoveryOption[];
  selectedOptions: Set<string>;
  onSelectionChange: (options: Set<string>) => void;
}

const RecoveryOptionsList: React.FC<RecoveryOptionsListProps> = ({
  recoveryOptions,
  selectedOptions,
  onSelectionChange,
}) => (
  <Stack gap="sm">
    {recoveryOptions.map((option) => (
      <Card
        key={option.id}
        withBorder
        style={{
          opacity: option.available ? 1 : 0.6,
          cursor: option.available ? 'pointer' : 'not-allowed',
        }}
      >
        <Group justify="space-between">
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
                onSelectionChange(newSelected);
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
              <Text fw={500}>{option.name}</Text>
              <Text size="sm" c="dimmed">
                {option.description}
              </Text>
              {option.reason && (
                <Text size="xs" c="red" mt={4}>
                  {option.reason}
                </Text>
              )}
            </div>
          </Group>
        </Group>
      </Card>
    ))}
  </Stack>
);

interface AdvancedConfigSectionProps {
  retryConfig: RetryConfig;
  onRetryConfigChange: (config: RetryConfig) => void;
}

const AdvancedConfigSection: React.FC<AdvancedConfigSectionProps> = ({
  retryConfig,
  onRetryConfigChange,
}) => (
  <Paper p="sm" withBorder>
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Configuración avanzada
      </Text>
      <SimpleGrid cols={2} spacing="sm">
        <NumberInput
          label="Tamaño de lote"
          description="Registros por lote"
          value={retryConfig.batchSize}
          onChange={(val) => onRetryConfigChange({ ...retryConfig, batchSize: Number(val) || 100 })}
          min={1}
          max={1000}
        />
        <NumberInput
          label="Delay entre reintentos"
          description="Milisegundos"
          value={retryConfig.retryDelay}
          onChange={(val) =>
            onRetryConfigChange({ ...retryConfig, retryDelay: Number(val) || 1000 })
          }
          min={100}
          max={10000}
        />
        <NumberInput
          label="Máximo de reintentos"
          description="Por registro"
          value={retryConfig.maxRetries}
          onChange={(val) => onRetryConfigChange({ ...retryConfig, maxRetries: Number(val) || 3 })}
          min={1}
          max={10}
        />
        <Checkbox
          label="Omitir errores irrecuperables"
          checked={retryConfig.skipErrors}
          onChange={(e) =>
            onRetryConfigChange({ ...retryConfig, skipErrors: e.currentTarget.checked })
          }
        />
      </SimpleGrid>
    </Stack>
  </Paper>
);

interface RecoveryStatusSectionProps {
  recoveryState: RecoveryState;
}

export const RecoveryStatusSection: React.FC<RecoveryStatusSectionProps> = ({ recoveryState }) => (
  <Paper p="md" withBorder>
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>Progreso de recuperación</Text>
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
        animated={recoveryState.status === 'recovering'}
      />

      {recoveryState.currentAction && (
        <Text size="sm" c="dimmed">
          {recoveryState.currentAction}...
        </Text>
      )}

      <LogsTimeline logs={recoveryState.logs} />
    </Stack>
  </Paper>
);
