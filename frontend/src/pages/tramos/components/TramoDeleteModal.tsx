import React from 'react';
import ConfirmModal from '../../../components/base/ConfirmModal';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';

interface TramoDeleteModalProps {
  deleteModal: ModalReturn<Tramo>;
  onConfirmDelete: () => Promise<void>;
}

export const TramoDeleteModal: React.FC<TramoDeleteModalProps> = ({
  deleteModal,
  onConfirmDelete,
}) => {
  return (
    <ConfirmModal
      opened={deleteModal.isOpen}
      onClose={deleteModal.close}
      onConfirm={onConfirmDelete}
      title="Eliminar Tramo"
      message={`¿Está seguro de que desea eliminar el tramo ${
        deleteModal.selectedItem?.origen.nombre || ''
      } - ${deleteModal.selectedItem?.destino.nombre || ''}?`}
    />
  );
};
