import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconTrash, IconCheck, IconX } from '@tabler/icons-react';

export type ConfirmModalType = 'delete' | 'confirm' | 'warning' | 'info';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ConfirmModalType;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

const TYPE_CONFIG = {
  delete: {
    color: 'red',
    icon: IconTrash,
    confirmColor: 'red',
    confirmVariant: 'filled' as const
  },
  warning: {
    color: 'yellow',
    icon: IconAlertTriangle,
    confirmColor: 'yellow',
    confirmVariant: 'filled' as const
  },
  confirm: {
    color: 'blue',
    icon: IconCheck,
    confirmColor: 'blue',
    confirmVariant: 'filled' as const
  },
  info: {
    color: 'blue',
    icon: IconCheck,
    confirmColor: 'blue',
    confirmVariant: 'filled' as const
  }
};

export default function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmLabel,
  cancelLabel = 'Cancelar',
  loading = false,
  children
}: ConfirmModalProps) {
  const config = TYPE_CONFIG[type];
  const IconComponent = config.icon;

  const defaultConfirmLabel = {
    delete: 'Eliminar',
    warning: 'Continuar',
    confirm: 'Confirmar',
    info: 'Aceptar'
  }[type];

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon
            color={config.color}
            variant="light"
            size="lg"
          >
            <IconComponent size="1.2rem" />
          </ThemeIcon>
          <Text fw={600}>{title}</Text>
        </Group>
      }
      centered
      overlayProps={{ backgroundOpacity: 0.6, blur: 3 }}
      withCloseButton={!loading}
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {message}
        </Text>

        {children}

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          
          <Button
            color={config.confirmColor}
            variant={config.confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            leftSection={!loading ? <IconComponent size="1rem" /> : undefined}
          >
            {confirmLabel || defaultConfirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}