import React from 'react';
import { Modal, Stack, NumberInput, Switch, Select, Group, Button } from '@mantine/core';
import { ExpirationConfig } from '../ExpirationManagerBase';

interface ExpirationConfigModalProps {
  opened: boolean;
  onClose: () => void;
  tempConfig: ExpirationConfig;
  onTempConfigChange: React.Dispatch<React.SetStateAction<ExpirationConfig>>;
  onSave: () => void;
}

type FrecuenciaNotificaciones = 'diaria' | 'semanal' | 'personalizada';

export const ExpirationConfigModal: React.FC<ExpirationConfigModalProps> = ({
  opened,
  onClose,
  tempConfig,
  onTempConfigChange,
  onSave,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Configuración de Vencimientos" size="md">
      <Stack>
        <NumberInput
          label="Días para alerta crítica"
          value={tempConfig.diasCritico}
          onChange={(value) =>
            onTempConfigChange((prev) => ({ ...prev, diasCritico: Number(value) }))
          }
          min={1}
          max={30}
        />

        <NumberInput
          label="Días para alerta próxima"
          value={tempConfig.diasProximo}
          onChange={(value) =>
            onTempConfigChange((prev) => ({ ...prev, diasProximo: Number(value) }))
          }
          min={1}
          max={90}
        />

        <Switch
          label="Notificaciones automáticas"
          checked={tempConfig.notificacionesActivas}
          onChange={(event) =>
            onTempConfigChange((prev) => ({
              ...prev,
              notificacionesActivas: event.currentTarget.checked,
            }))
          }
        />

        <Select
          label="Frecuencia de notificaciones"
          value={tempConfig.frecuenciaNotificaciones}
          onChange={(value) =>
            onTempConfigChange((prev) => ({
              ...prev,
              frecuenciaNotificaciones: value as FrecuenciaNotificaciones,
            }))
          }
          data={[
            { value: 'diaria', label: 'Diaria' },
            { value: 'semanal', label: 'Semanal' },
            { value: 'personalizada', label: 'Personalizada' },
          ]}
          disabled={!tempConfig.notificacionesActivas}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>Guardar</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
