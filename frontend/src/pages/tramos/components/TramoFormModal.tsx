import React, { Suspense } from 'react';
import { Modal } from '@mantine/core';
import { Tramo, Cliente, Site } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { TramoFormData } from '../types';

const TramoForm = React.lazy(() => import('../../../components/forms/TramoForm'));

interface TramoFormModalProps {
  formModal: ModalReturn<Tramo>;
  clientes: Cliente[];
  sites: Site[];
  onFormSubmit: (data: TramoFormData) => Promise<void>;
}

export const TramoFormModal: React.FC<TramoFormModalProps> = ({
  formModal,
  clientes,
  sites,
  onFormSubmit,
}) => {
  return (
    <Modal
      opened={formModal.isOpen}
      onClose={formModal.close}
      title={formModal.selectedItem ? 'Editar Tramo' : 'Nuevo Tramo'}
      size="xl"
    >
      <Suspense
        fallback={
          <div style={{ padding: '40px', textAlign: 'center' }}>Cargando formulario...</div>
        }
      >
        <TramoForm
          tramo={formModal.selectedItem}
          clientes={clientes}
          sites={sites}
          onSubmit={onFormSubmit}
          onCancel={formModal.close}
        />
      </Suspense>
    </Modal>
  );
};
