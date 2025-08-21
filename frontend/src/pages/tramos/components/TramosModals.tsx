import React from 'react';
import { TramoFormModal } from './TramoFormModal';
import { TramoDetailModal } from './TramoDetailModal';
import { TramoDeleteModal } from './TramoDeleteModal';
import { TramoImportModal } from './TramoImportModal';
import { Tramo, Cliente } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { TarifaCalculationResult, TramosImportResult, TramoFormData } from '../types';

interface LocalSite {
  _id: string;
  nombre: string;
  cliente: string;
}

interface TramosModalsProps {
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
  detailModal: ModalReturn<Tramo>;
  importModal: ModalReturn;
  clientes: Cliente[];
  sites: LocalSite[];
  onFormSubmit: (data: TramoFormData) => Promise<void>;
  onConfirmDelete: () => Promise<void>;
  onImportComplete: (result: TramosImportResult) => Promise<void>;
  _onCalculationChange?: (result: TarifaCalculationResult) => void;
}

export const TramosModals: React.FC<TramosModalsProps> = ({
  formModal,
  deleteModal,
  detailModal,
  importModal,
  clientes,
  sites,
  onFormSubmit,
  onConfirmDelete,
  onImportComplete,
}) => {
  return (
    <>
      <TramoFormModal
        formModal={formModal}
        clientes={clientes}
        sites={sites}
        onFormSubmit={onFormSubmit}
      />

      <TramoDetailModal detailModal={detailModal} formModal={formModal} />

      <TramoDeleteModal deleteModal={deleteModal} onConfirmDelete={onConfirmDelete} />

      <TramoImportModal importModal={importModal} onImportComplete={onImportComplete} />
    </>
  );
};
