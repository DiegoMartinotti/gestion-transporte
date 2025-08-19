import React, { Suspense, lazy } from 'react';
import ConfirmModal from '../base/ConfirmModal';
import { VehiculoDetail } from '../details/VehiculoDetail';
import { VEHICULOS_CONSTANTS } from '../../constants/vehiculos';
import { Vehiculo } from '../../types/vehiculo';

const VehiculoForm = lazy(() => import('../forms/VehiculoForm'));

interface ModalState<T> {
  isOpen: boolean;
  selectedItem: T | null;
  close: () => void;
  onSuccess: () => void;
}

interface FormModalState<T> extends ModalState<T> {
  openEdit: (item: T) => void;
}

interface VehiculosModalesProps {
  deleteModal: ModalState<{ id: string; dominio?: string }>;
  formModal: FormModalState<Vehiculo>;
  detailModal: ModalState<Vehiculo> & {
    openView: (item: Vehiculo) => void;
  };
  handleDelete: () => void;
}

export const VehiculosModales: React.FC<VehiculosModalesProps> = ({
  deleteModal,
  formModal,
  detailModal,
  handleDelete,
}) => {
  return (
    <>
      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Eliminar Vehículo"
        message={`${VEHICULOS_CONSTANTS.MESSAGES.CONFIRM_DELETE} ${deleteModal.selectedItem?.dominio || ''}? Esta acción no se puede deshacer.`}
      />

      <Suspense
        fallback={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            {VEHICULOS_CONSTANTS.MESSAGES.LOADING_FORM}
          </div>
        }
      >
        <VehiculoForm
          opened={formModal.isOpen}
          onClose={formModal.close}
          vehiculo={formModal.selectedItem}
          onSuccess={formModal.onSuccess}
        />
      </Suspense>

      <VehiculoDetail
        vehiculo={detailModal.selectedItem}
        opened={detailModal.isOpen}
        onClose={detailModal.close}
        onEdit={(vehiculo: Vehiculo) => {
          detailModal.close();
          formModal.openEdit(vehiculo);
        }}
      />
    </>
  );
};

export default VehiculosModales;
