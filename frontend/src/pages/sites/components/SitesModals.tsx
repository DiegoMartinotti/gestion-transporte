import React from 'react';
import { ConfirmModal } from '../../../components/base';
import { ExcelImportModal } from '../../../components/modals';
import { Site } from '../../../types';
import { Modal } from '../../../hooks/useModal';
import { siteExcelService } from '../../../services/BaseExcelService';

interface SitesModalsProps {
  deleteModal: Modal<Site>;
  importModal: Modal;
  onDelete: (site: Site) => void;
  onImportComplete: () => void;
  onImportClose: () => void;
}

export const SitesModals: React.FC<SitesModalsProps> = ({
  deleteModal,
  importModal,
  onDelete,
  onImportComplete,
  onImportClose,
}) => (
  <>
    <ConfirmModal
      opened={deleteModal.isOpen}
      onClose={deleteModal.close}
      onConfirm={() => deleteModal.selectedItem && onDelete(deleteModal.selectedItem)}
      title="Confirmar eliminación"
      message={`¿Estás seguro de que deseas eliminar el site "${deleteModal.selectedItem?.nombre}"?`}
    />

    <ExcelImportModal
      opened={importModal.isOpen}
      onClose={onImportClose}
      title="Importar Sites"
      entityType="sites"
      onImportComplete={onImportComplete}
      processExcelFile={siteExcelService.processExcelFile}
      validateExcelFile={siteExcelService.validateExcelFile}
      previewExcelFile={siteExcelService.previewExcelFile}
      getTemplate={siteExcelService.getTemplate}
    />
  </>
);
