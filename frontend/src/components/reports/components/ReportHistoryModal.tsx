import React from 'react';
import { Modal, Stack, Card, Text, Group, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { ReportExecution, ReportDefinition } from '../../../types/reports';

interface ExecutionDetail {
  execution: ReportExecution;
  reportDefinition?: ReportDefinition;
}

interface ReportHistoryModalProps {
  opened: boolean;
  onClose: () => void;
  selectedExecutionDetail: ExecutionDetail | null;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({
  opened,
  onClose,
  selectedExecutionDetail,
}) => (
  <Modal opened={opened} onClose={onClose} title="Detalles de Ejecución" size="lg" centered>
    {selectedExecutionDetail && (
      <Stack gap="md">
        <Card withBorder>
          <Text fw={500} mb="xs">
            Información General
          </Text>
          <Group gap="md" wrap="wrap">
            <div>
              <Text size="sm" c="dimmed">
                Reporte
              </Text>
              <Text size="sm" fw={500}>
                {selectedExecutionDetail.execution.reportName}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Estado
              </Text>
              <Text size="sm" fw={500}>
                {selectedExecutionDetail.execution.status}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Formato
              </Text>
              <Text size="sm" fw={500} tt="uppercase">
                {selectedExecutionDetail.execution.format}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Usuario
              </Text>
              <Text size="sm" fw={500}>
                {selectedExecutionDetail.execution.createdBy}
              </Text>
            </div>
          </Group>
        </Card>

        {selectedExecutionDetail.execution.parameters &&
          Object.keys(selectedExecutionDetail.execution.parameters).length > 0 && (
            <Card withBorder>
              <Text fw={500} mb="xs">
                Parámetros
              </Text>
              <Stack gap="xs">
                {Object.entries(selectedExecutionDetail.execution.parameters).map(
                  ([key, value], index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm" c="dimmed">
                        {key}:
                      </Text>
                      <Text size="sm" fw={500}>
                        {String(value)}
                      </Text>
                    </Group>
                  )
                )}
              </Stack>
            </Card>
          )}

        {selectedExecutionDetail.execution.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Text fw={500} mb="xs">
              Error de ejecución
            </Text>
            <Text size="sm">{selectedExecutionDetail.execution.error}</Text>
          </Alert>
        )}
      </Stack>
    )}
  </Modal>
);
