import React, { useState } from 'react';
import { Container, Tabs, Badge, Group, Text } from '@mantine/core';
import {
  IconFileImport,
  IconHistory,
  IconAlertCircle,
  IconSettings,
} from '@tabler/icons-react';
import ImportWizard from '../../components/import/ImportWizard';
import { ImportHistory } from '../../components/import/ImportHistory';
import { FailureRecovery } from '../../components/import/FailureRecovery';
import { showNotification } from '@mantine/notifications';

// Datos de ejemplo para recuperación de fallos
const MOCK_FAILURE = {
  timestamp: new Date(),
  entityType: 'clientes',
  totalRecords: 1500,
  processedRecords: 1200,
  failedRecords: 300,
  errorType: 'validation' as const,
  errorMessage: 'Error de validación en múltiples registros',
  lastSuccessfulRow: 1200,
  failedData: [],
  recoveryOptions: [],
};

export const ImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string | null>('wizard');
  const [hasFailures] = useState(true); // Simulación de fallos pendientes

  const handleImportComplete = (result: any) => {
    showNotification({
      title: 'Importación completada',
      message: `Se importaron ${result.success} de ${result.total} registros`,
      color: result.failed > 0 ? 'yellow' : 'green',
    });
    
    // Cambiar a historial después de completar
    setActiveTab('history');
  };

  const handleRetryImport = (importId: string) => {
    showNotification({
      title: 'Reintentando importación',
      message: `Reintentando importación ${importId}...`,
      color: 'blue',
    });
  };

  const handleRecoveryComplete = (result: any) => {
    showNotification({
      title: 'Recuperación completada',
      message: `Se recuperaron ${result.recoveredRecords} registros`,
      color: 'green',
    });
  };

  return (
    <Container size="xl" py="lg">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab
            value="wizard"
            leftSection={<IconFileImport size={14} />}
          >
            Nueva importación
          </Tabs.Tab>
          
          <Tabs.Tab
            value="history"
            leftSection={<IconHistory size={14} />}
          >
            Historial
          </Tabs.Tab>
          
          <Tabs.Tab
            value="recovery"
            leftSection={<IconAlertCircle size={14} />}
            rightSection={
              hasFailures && (
                <Badge size="sm" c="red" variant="filled">
                  1
                </Badge>
              )
            }
          >
            Recuperación
          </Tabs.Tab>
          
          <Tabs.Tab
            value="settings"
            leftSection={<IconSettings size={14} />}
          >
            Configuración
          </Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="wizard" pt="xl">
          <ImportWizard
            onComplete={handleImportComplete}
          />
        </Tabs.Panel>
        
        <Tabs.Panel value="history" pt="xl">
          <ImportHistory
            onRetryImport={handleRetryImport}
          />
        </Tabs.Panel>
        
        <Tabs.Panel value="recovery" pt="xl">
          {hasFailures ? (
            <FailureRecovery
              failure={MOCK_FAILURE}
              onRecover={handleRecoveryComplete}
            />
          ) : (
            <Group justify="center" py="xl">
              <Text c="dimmed">No hay fallos pendientes de recuperación</Text>
            </Group>
          )}
        </Tabs.Panel>
        
        <Tabs.Panel value="settings" pt="xl">
          <Group justify="center" py="xl">
            <Text c="dimmed">Configuración de importación (próximamente)</Text>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};