import React from 'react';
import { Group, Card, Text, Button, Select, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { TIPOS_UNIDAD } from './detectionUtils';

interface ManualOverrideProps {
  manualOverride: string | null;
  onManualOverride: (value: string | null) => void;
  onResetToAutomatic: () => void;
}

export const ManualOverride: React.FC<ManualOverrideProps> = ({
  manualOverride,
  onManualOverride,
  onResetToAutomatic,
}) => {
  return (
    <Card withBorder>
      <Text fw={500} mb="md">
        Override Manual
      </Text>
      <Group>
        <Select
          placeholder="Seleccionar tipo manualmente"
          data={TIPOS_UNIDAD.map((t) => ({ value: t.value, label: t.label }))}
          value={manualOverride}
          onChange={onManualOverride}
          flex={1}
        />
        {manualOverride && (
          <Button variant="light" color="orange" onClick={onResetToAutomatic}>
            Volver a Automático
          </Button>
        )}
      </Group>
      {manualOverride && (
        <Alert icon={<IconAlertCircle size={16} />} color="orange" mt="md">
          Usando selección manual. La detección automática está deshabilitada.
        </Alert>
      )}
    </Card>
  );
};
