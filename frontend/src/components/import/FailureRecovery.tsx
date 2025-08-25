import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Card,
  SimpleGrid,
  Title,
  Paper,
  Alert,
  Badge,
  Accordion,
  Code,
} from '@mantine/core';
import { IconFileExport, IconPlayerPlay, IconPlayerPause, IconBug } from '@tabler/icons-react';
import {
  FailureRecoveryProps,
  RecoveryState,
  RecoveryLog,
  RetryConfig,
  RecoveryDetails,
} from './FailureRecoveryTypes';
import {
  getErrorIcon,
  getSeverityColor,
  useFailureAnalysis,
  useRecoveryOptions,
  executeRecoveryProcess,
} from './FailureRecoveryUtils';
import {
  RecoveryOptionsSection,
  RecoveryStatusSection,
  ExportModal,
} from './FailureRecoveryComponents';

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
  const [retryConfig, setRetryConfig] = useState<RetryConfig>({
    batchSize: 100,
    retryDelay: 1000,
    maxRetries: 3,
    skipErrors: false,
  });
  const [showExportModal, setShowExportModal] = useState(false);

  const failureAnalysis = useFailureAnalysis(failure);

  const addLog = useCallback(
    (level: RecoveryLog['level'], message: string, details?: RecoveryDetails) => {
      const log: RecoveryLog = {
        timestamp: new Date(),
        level,
        message,
        details,
      };

      setRecoveryState((prev) => ({
        ...prev,
        logs: [...prev.logs, log],
      }));
    },
    []
  );

  const recoveryOptions = useRecoveryOptions(failure, failureAnalysis, addLog, setShowExportModal);

  const executeRecovery = useCallback(async () => {
    await executeRecoveryProcess({
      selectedOptions,
      recoveryOptions,
      failure,
      addLog,
      setRecoveryState,
      onRecover,
      recoveryLogs: recoveryState.logs,
    });
  }, [selectedOptions, recoveryOptions, failure, addLog, onRecover, recoveryState.logs]);

  return (
    <Stack gap="lg">
      <FailureHeader failure={failure} failureAnalysis={failureAnalysis} />
      <FailureSummary failure={failure} failureAnalysis={failureAnalysis} />
      <ErrorDetails failure={failure} failureAnalysis={failureAnalysis} />

      <RecoveryOptionsSection
        recoveryOptions={recoveryOptions}
        selectedOptions={selectedOptions}
        onSelectionChange={setSelectedOptions}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        retryConfig={retryConfig}
        onRetryConfigChange={setRetryConfig}
      />

      {recoveryState.status !== 'idle' && <RecoveryStatusSection recoveryState={recoveryState} />}

      <ActionButtons
        recoveryState={recoveryState}
        selectedOptions={selectedOptions}
        executeRecovery={executeRecovery}
        onCancel={onCancel}
      />

      <ExportModal
        opened={showExportModal}
        onClose={() => setShowExportModal(false)}
        failedRecords={failure.failedRecords}
      />
    </Stack>
  );
};

interface FailureHeaderProps {
  failure: FailureRecoveryProps['failure'];
  failureAnalysis: ReturnType<typeof useFailureAnalysis>;
}

const FailureHeader: React.FC<FailureHeaderProps> = ({ failure, failureAnalysis }) => (
  <Card withBorder>
    <Group justify="space-between">
      <div>
        <Title order={3}>Recuperación de fallos</Title>
        <Text size="sm" c="dimmed">
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
);

interface FailureSummaryProps {
  failure: FailureRecoveryProps['failure'];
  failureAnalysis: ReturnType<typeof useFailureAnalysis>;
}

const FailureSummary: React.FC<FailureSummaryProps> = ({ failure, failureAnalysis }) => (
  <SimpleGrid cols={4} spacing="md">
    <Card withBorder>
      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed">
          Total registros
        </Text>
        <Text size="xl" fw={700}>
          {failure.totalRecords}
        </Text>
      </Stack>
    </Card>

    <Card withBorder>
      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed">
          Procesados
        </Text>
        <Text size="xl" fw={700} c="green">
          {failure.processedRecords - failure.failedRecords}
        </Text>
      </Stack>
    </Card>

    <Card withBorder>
      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed">
          Fallidos
        </Text>
        <Text size="xl" fw={700} c="red">
          {failure.failedRecords}
        </Text>
      </Stack>
    </Card>

    <Card withBorder>
      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed">
          Tasa de éxito
        </Text>
        <Text size="xl" fw={700}>
          {Math.round(failureAnalysis.successRate)}%
        </Text>
      </Stack>
    </Card>
  </SimpleGrid>
);

interface ErrorDetailsProps {
  failure: FailureRecoveryProps['failure'];
  failureAnalysis: ReturnType<typeof useFailureAnalysis>;
}

const ErrorDetails: React.FC<ErrorDetailsProps> = ({ failure, failureAnalysis }) => (
  <Paper p="md" withBorder>
    <Stack gap="sm">
      <Group justify="space-between">
        <Text fw={500}>Detalles del error</Text>
        <Badge>{new Date(failure.timestamp).toLocaleString()}</Badge>
      </Group>

      <Alert
        icon={getErrorIcon(failure.errorType)}
        color={getSeverityColor(failureAnalysis.severity)}
      >
        <Text fw={500}>{failure.errorMessage}</Text>
      </Alert>

      {failure.stackTrace && (
        <Accordion>
          <Accordion.Item value="stack">
            <Accordion.Control icon={<IconBug size={16} />}>Stack trace</Accordion.Control>
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
);

interface ActionButtonsProps {
  recoveryState: RecoveryState;
  selectedOptions: Set<string>;
  executeRecovery: () => Promise<void>;
  onCancel?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  recoveryState,
  selectedOptions,
  executeRecovery,
  onCancel,
}) => (
  <Group justify="space-between">
    <Group>
      {recoveryState.status === 'completed' && (
        <Button
          variant="light"
          leftSection={<IconFileExport size={16} />}
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
        leftSection={
          recoveryState.status === 'recovering' ? (
            <IconPlayerPause size={16} />
          ) : (
            <IconPlayerPlay size={16} />
          )
        }
        onClick={executeRecovery}
        disabled={selectedOptions.size === 0 || recoveryState.status === 'recovering'}
        loading={recoveryState.status === 'recovering'}
      >
        {recoveryState.status === 'recovering' ? 'Recuperando...' : 'Iniciar recuperación'}
      </Button>
    </Group>
  </Group>
);
