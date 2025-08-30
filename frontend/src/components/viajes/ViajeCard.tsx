import { useState } from 'react';
import { Card, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Viaje } from '../../types/viaje';
import { notifications } from '@mantine/notifications';
import { ViajeCardCompact } from './ViajeCard/ViajeCardCompact';
import { ViajeCardHeader } from './ViajeCard/ViajeCardHeader';
import { ViajeCardDetails } from './ViajeCard/ViajeCardDetails';
import { ViajeDeleteModal } from './ViajeCard/ViajeDeleteModal';

interface ViajeCardProps {
  viaje: Viaje;
  onView?: (viaje: Viaje) => void;
  onEdit?: (viaje: Viaje) => void;
  onDelete?: (viaje: Viaje) => void;
  onClick?: (viaje: Viaje) => void;
  compact?: boolean;
  showActions?: boolean;
}

export function ViajeCard({
  viaje,
  onView,
  onEdit,
  onDelete,
  onClick,
  compact = false,
  showActions = true,
}: ViajeCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(viaje);
        notifications.show({
          title: 'Viaje eliminado',
          message: `El viaje #${viaje.numeroViaje} fue eliminado`,
          color: 'green',
        });
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el viaje',
        color: 'red',
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (compact) {
    return <ViajeCardCompact viaje={viaje} onClick={onClick} />;
  }

  const cardProps = onClick
    ? {
        onClick: () => onClick(viaje),
        style: { cursor: 'pointer' },
      }
    : {};

  return (
    <>
      <Card {...cardProps} padding="md" withBorder>
        <Stack gap="sm">
          <ViajeCardHeader
            viaje={viaje}
            showActions={showActions}
            onView={onView}
            onEdit={onEdit}
            onDeleteClick={() => setShowDeleteModal(true)}
          />

          <ViajeCardDetails viaje={viaje} />

          {viaje.observaciones && (
            <Alert icon={<IconAlertCircle size={14} />} color="blue" variant="light">
              <div dangerouslySetInnerHTML={{ __html: viaje.observaciones.slice(0, 100) }} />
            </Alert>
          )}
        </Stack>
      </Card>

      {onDelete && (
        <ViajeDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          viaje={viaje}
        />
      )}
    </>
  );
}
