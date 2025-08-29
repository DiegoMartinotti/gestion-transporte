import React from 'react';
import { Stack, Center, Title, SimpleGrid, Card, Text, Timeline, Group, Button } from '@mantine/core';
import { IconCheck, IconUpload, IconCheckupList, IconDatabase, IconHistory, IconRefresh } from '@tabler/icons-react';
import { ImportState } from '../types';

interface CompletionSummaryStepProps {
  importState: ImportState;
  onNewImport: () => void;
}

export const CompletionSummaryStep: React.FC<CompletionSummaryStepProps> = ({
  importState,
  onNewImport,
}) => (
  <Stack>
    <Center mb="xl">
      <IconCheck size={80} color="var(--mantine-color-green-6)" />
    </Center>

    <Title order={3} ta="center">
      Importación completada
    </Title>

    {importState.importResult && (
      <>
        <SimpleGrid cols={3} spacing="lg" mt="xl">
          <Card withBorder>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">
                Total procesados
              </Text>
              <Text size="xl" fw={700}>
                {importState.importResult.total}
              </Text>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">
                Importados
              </Text>
              <Text size="xl" fw={700} c="green">
                {importState.importResult.success}
              </Text>
            </Stack>
          </Card>

          <Card withBorder>
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">
                Fallidos
              </Text>
              <Text size="xl" fw={700} c="red">
                {importState.importResult.failed}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        <Timeline active={-1} bulletSize={24} lineWidth={2} mt="xl">
          <Timeline.Item bullet={<IconUpload size={12} />} title="Archivo cargado">
            <Text c="dimmed" size="sm">
              {importState.file?.name}
            </Text>
          </Timeline.Item>

          <Timeline.Item bullet={<IconCheckupList size={12} />} title="Datos validados">
            <Text c="dimmed" size="sm">
              {importState.validationErrors.length} errores encontrados
            </Text>
          </Timeline.Item>

          <Timeline.Item bullet={<IconDatabase size={12} />} title="Importación completada">
            <Text c="dimmed" size="sm">
              {new Date(importState.importResult.timestamp).toLocaleString()}
            </Text>
          </Timeline.Item>
        </Timeline>

        <Group justify="center" mt="xl">
          <Button
            variant="light"
            leftSection={<IconHistory size={16} />}
            onClick={() => {
              // Ir al historial de importaciones
            }}
          >
            Ver historial
          </Button>
          <Button
            variant="filled"
            leftSection={<IconRefresh size={16} />}
            onClick={onNewImport}
          >
            Nueva importación
          </Button>
        </Group>
      </>
    )}
  </Stack>
);