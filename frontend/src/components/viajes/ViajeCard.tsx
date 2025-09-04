import { Viaje } from '../../types/viaje';
import { useViajeDelete } from '../../hooks/useViajeDelete';
import { ViajeCardCompact } from './ViajeCard/ViajeCardCompact';
import { ViajeCardContent } from './ViajeCard/ViajeCardContent';
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
  const { showDeleteModal, setShowDeleteModal, handleDelete } = useViajeDelete(onDelete);

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
      <ViajeCardContent
        viaje={viaje}
        cardProps={cardProps}
        showActions={showActions}
        onView={onView}
        onEdit={onEdit}
        onDeleteClick={() => setShowDeleteModal(true)}
      />

      {onDelete && (
        <ViajeDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDelete(viaje)}
          viaje={viaje}
        />
      )}
    </>
  );
}
