import { Group, Card, Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface ValidationStatusCardProps {
  riesgos: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    vehiculoId?: string;
  }>;
}

export function ValidationStatusCard({ riesgos }: ValidationStatusCardProps) {
  const hasErrors = riesgos.filter((r) => r.tipo === 'error').length > 0;

  return (
    <Card withBorder bg={hasErrors ? 'red.0' : 'green.0'}>
      <Group>
        {hasErrors ? (
          <IconAlertTriangle size={20} color="red" />
        ) : (
          <IconCheck size={20} color="green" />
        )}
        <div>
          <Text fw={500}>{hasErrors ? 'Configuración Incompleta' : 'Configuración Lista'}</Text>
          <Text size="sm" c="dimmed">
            {hasErrors
              ? 'Corrija los errores antes de continuar'
              : 'La configuración está completa y lista para usar'}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
