import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ValidationAlertProps {
  hasErrors: boolean;
}

export function ValidationAlert({ hasErrors }: ValidationAlertProps) {
  if (!hasErrors) return null;

  return (
    <Alert icon={<IconAlertCircle size={16} />} title="Configuración incompleta" color="yellow">
      Revise las asignaciones marcadas en rojo para continuar.
    </Alert>
  );
}
