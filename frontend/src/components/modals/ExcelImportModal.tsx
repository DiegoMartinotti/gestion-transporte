import { Modal } from '@mantine/core';
import { ExcelImportModalContent } from './ExcelImportModalContent';
import CorrectionUploadModal from './CorrectionUploadModal';
import { useExcelImportState } from '../../hooks/useExcelImportState';
import { useExcelImportActions } from '../../hooks/useExcelImportActions';
import type { ExcelImportModalProps } from './types/ExcelImportModalTypes';

export function ExcelImportModal(props: ExcelImportModalProps) {
  const {
    opened,
    onClose,
    title,
    entityType,
    onImportComplete,
    processExcelFile,
    validateExcelFile,
    previewExcelFile,
    getTemplate,
  } = props;

  // Use custom hooks for state and actions
  const state = useExcelImportState();
  const actions = useExcelImportActions({
    state,
    processExcelFile,
    validateExcelFile,
    previewExcelFile,
    getTemplate,
    onImportComplete,
  });

  const handleClose = () => {
    actions.resetState();
    onClose();
  };

  const handleCorrectionUploadSuccess = (reintentoResult?: unknown) => {
    actions.handleCorrectionUploadSuccess(reintentoResult, onImportComplete);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={!state.loading}
    >
      <ExcelImportModalContent
        entityType={entityType}
        onImportComplete={onImportComplete}
        processExcelFile={processExcelFile}
        validateExcelFile={validateExcelFile}
        previewExcelFile={previewExcelFile}
        getTemplate={getTemplate}
        onClose={handleClose}
      />

      {/* Modal de carga de corrección */}
      <CorrectionUploadModal
        opened={state.correctionUploadModalOpen}
        onClose={() => actions.setCorrectionUploadModalOpen(false)}
        importId={state.importResult?.importId || ''}
        onUploadSuccess={handleCorrectionUploadSuccess}
      />
    </Modal>
  );
}

export default ExcelImportModal;
