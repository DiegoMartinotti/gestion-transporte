import React from 'react';
import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export const EmptyState: React.FC = () => {
  return (
    <Alert icon={<IconAlertCircle size={16} />} color="yellow">
      Especifique la capacidad de carga del vehículo para habilitar la detección automática.
    </Alert>
  );
};
