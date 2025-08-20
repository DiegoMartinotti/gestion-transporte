import React from 'react';
import { ConfirmModal } from '../../../components/base';
import { ExcelImportModal } from '../../../components/modals';
import { Site } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { siteService } from '../../../services/siteService';
import { siteExcelService } from '../../../services/BaseExcelService';

interface SitesModalsProps {
  deleteModal: ModalReturn<Site>;
  importModal: ModalReturn;
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
      processExcelFile={siteService.processExcelFile.bind(siteService)}
      validateExcelFile={siteService.validateExcelFile.bind(siteService)}
      previewExcelFile={siteService.previewExcelFile.bind(siteService)}
      getTemplate={siteExcelService.getTemplate}
    />
  </>
);
