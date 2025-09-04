import { Card, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Viaje } from '../../../types/viaje';
import { ViajeCardHeader } from './ViajeCardHeader';
import { ViajeCardDetails } from './ViajeCardDetails';

interface ViajeCardContentProps {
  viaje: Viaje;
  cardProps: Record<string, any>;
  showActions: boolean;
  onView?: (viaje: Viaje) => void;
  onEdit?: (viaje: Viaje) => void;
  onDeleteClick: () => void;
}

export function ViajeCardContent({
  viaje,
  cardProps,
  showActions,
  onView,
  onEdit,
  onDeleteClick,
}: ViajeCardContentProps) {
  return (
    <Card {...cardProps} padding="md" withBorder>
      <Stack gap="sm">
        <ViajeCardHeader
          viaje={viaje}
          showActions={showActions}
          onView={onView}
          onEdit={onEdit}
          onDeleteClick={onDeleteClick}
        />

        <ViajeCardDetails viaje={viaje} />

        {viaje.observaciones && (
          <Alert icon={<IconAlertCircle size={14} />} color="blue" variant="light">
            <div dangerouslySetInnerHTML={{ __html: viaje.observaciones.slice(0, 100) }} />
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
