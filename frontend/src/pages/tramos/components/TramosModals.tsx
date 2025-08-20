import React, { Suspense } from 'react';
import { Modal } from '@mantine/core';
import { ExcelImportModal } from '../../../components/modals/ExcelImportModal';
import TramoDetail from '../../../components/details/TramoDetail';
import ConfirmModal from '../../../components/base/ConfirmModal';
import { tramoExcelService } from '../../../services/BaseExcelService';
import { Tramo, Cliente, Site } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { TarifaCalculationResult, TramosImportResult, TramoFormData } from '../types';

// Lazy load del formulario complejo
const TramoForm = React.lazy(() => import('../../../components/forms/TramoForm'));

interface TramosModalsProps {
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
  detailModal: ModalReturn<Tramo>;
  importModal: ModalReturn;
  clientes: Cliente[];
  sites: Site[];
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
  _onCalculationChange,
}) => {
  return (
    <>
      {/* Modal de formulario */}
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

      {/* Modal de detalle */}
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

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={onConfirmDelete}
        title="Eliminar Tramo"
        message={`¿Está seguro de que desea eliminar el tramo ${
          deleteModal.selectedItem?.origen.nombre || ''
        } - ${deleteModal.selectedItem?.destino.nombre || ''}?`}
      />

      {/* Modal de importación Excel */}
      <ExcelImportModal
        opened={importModal.isOpen}
        onClose={importModal.close}
        title="Importar Tramos desde Excel"
        entityType="cliente"
        onImportComplete={onImportComplete}
        processExcelFile={async (file: File) => {
          // Usar el sistema base de importación
          return await tramoExcelService.importFromExcel(file);
        }}
        validateExcelFile={async (_file: File) => {
          // Validación básica de archivo
          return {
            validationResult: {
              isValid: true,
              errors: [],
              warnings: [],
              validRows: [],
              invalidRows: [],
              summary: {
                totalRows: 0,
                validRows: 0,
                errorRows: 0,
                warningRows: 0,
              },
            },
            processedData: {
              data: [],
              headers: [],
            },
          };
        }}
        previewExcelFile={async (_file: File, _sampleSize?: number) => {
          // Preview básico de archivo
          return {
            samples: [],
            headers: [],
            totalRows: 0,
          };
        }}
        getTemplate={async () => {
          const blob = await tramoExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_tramos.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />
    </>
  );
};
