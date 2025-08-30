import React from 'react';
import { Alert, Text } from '@mantine/core';
import { IconX, IconInfoCircle } from '@tabler/icons-react';

interface CoordinateAlertsProps {
  error?: string;
  showCopyPaste: boolean;
}

export default function CoordinateAlerts({ error, showCopyPaste }: CoordinateAlertsProps) {
  if (error) {
    return (
      <Alert color="red" variant="light" icon={<IconX size={16} />}>
        <Text size="sm">{error}</Text>
      </Alert>
    );
  }

  return (
    <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
      <Text size="xs">
        Formato: Latitud (-90 a 90), Longitud (-180 a 180). Para Argentina: Lat negativa, Lng
        negativa.
        {showCopyPaste && ' Puede pegar coordenadas en formato "lat,lng".'}
      </Text>
    </Alert>
  );
}
