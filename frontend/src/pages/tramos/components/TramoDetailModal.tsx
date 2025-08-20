import React from 'react';
import { Modal } from '@mantine/core';
import TramoDetail from '../../../components/details/TramoDetail';
import { Tramo } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';

interface TramoDetailModalProps {
  detailModal: ModalReturn<Tramo>;
  formModal: ModalReturn<Tramo>;
}

export const TramoDetailModal: React.FC<TramoDetailModalProps> = ({ detailModal, formModal }) => {
  return (
    <Modal
      opened={detailModal.isOpen}
      onClose={detailModal.close}
      title="Detalle del Tramo"
      size="xl"
    >
      {detailModal.selectedItem && (
        <TramoDetail
          tramo={detailModal.selectedItem}
          onEdit={() => {
            detailModal.close();
            if (detailModal.selectedItem) {
              formModal.openEdit(detailModal.selectedItem);
            }
          }}
          _onClose={detailModal.close}
        />
      )}
    </Modal>
  );
};
