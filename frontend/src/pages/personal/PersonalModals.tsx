import React, { Suspense } from 'react';
import { Modal } from '@mantine/core';
import type { Personal } from '../../types';
import { PersonalDetail } from '../../components/details/PersonalDetail';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import ConfirmModal from '../../components/base/ConfirmModal';
import { personalService } from '../../services/personalService';

// Lazy load del formulario complejo
const PersonalForm = React.lazy(() =>
  import('../../components/forms/PersonalForm').then((module) => ({ default: module.PersonalForm }))
);

interface PersonalModalsProps {
  formModal: {
    isOpen: boolean;
    selectedItem: Personal | null;
    close: () => void;
  };
  detailModal: {
    isOpen: boolean;
    selectedItem: Personal | null;
    close: () => void;
  };
  deleteModal: {
    isOpen: boolean;
    selectedItem: Personal | null;
    close: () => void;
  };
  importModal: {
    isOpen: boolean;
    close: () => void;
  };
  onFormSubmit: () => Promise<void>;
  onConfirmDelete: () => Promise<void>;
  onImportComplete: (result: unknown) => Promise<void>;
  onEditPersonal: (person: Personal) => void;
  onTemplateDownload: () => Promise<void>;
}

export const PersonalModals: React.FC<PersonalModalsProps> = ({
  formModal,
  detailModal,
  deleteModal,
  importModal,
  onFormSubmit,
  onConfirmDelete,
  onImportComplete,
  onEditPersonal,
  onTemplateDownload,
}) => {
  return (
    <>
      {/* Form Modal */}
      <Modal
        opened={formModal.isOpen}
        onClose={formModal.close}
        title={formModal.selectedItem ? 'Editar Personal' : 'Nuevo Personal'}
        size="xl"
      >
        <Suspense
          fallback={
            <div style={{ padding: '40px', textAlign: 'center' }}>Cargando formulario...</div>
          }
        >
          <PersonalForm
            personal={formModal.selectedItem || undefined}
            onSubmit={onFormSubmit}
            onCancel={formModal.close}
          />
        </Suspense>
      </Modal>

      {/* Detail Modal */}
      <Modal
        opened={detailModal.isOpen}
        onClose={detailModal.close}
        title="Detalles del Personal"
        size="xl"
      >
        {detailModal.selectedItem && (
          <PersonalDetail personal={detailModal.selectedItem} onEdit={onEditPersonal} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={onConfirmDelete}
        title="Eliminar Personal"
        message={
          deleteModal.selectedItem
            ? `¿Está seguro que desea eliminar a ${deleteModal.selectedItem.nombre} ${deleteModal.selectedItem.apellido}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        type="delete"
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        opened={importModal.isOpen}
        onClose={importModal.close}
        title="Importar Personal desde Excel"
        entityType="personal"
        onImportComplete={onImportComplete}
        processExcelFile={personalService.processExcelFile.bind(personalService)}
        validateExcelFile={personalService.validateExcelFile.bind(personalService)}
        previewExcelFile={personalService.previewExcelFile.bind(personalService)}
        getTemplate={onTemplateDownload}
      />
    </>
  );
};
