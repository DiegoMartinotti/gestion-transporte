import { Container, Title, Group, Stack } from '@mantine/core';
import { LoadingOverlay, ConfirmModal } from '../../components/base';
import { ExcelImportModal } from '../../components/modals';
import { useClientesPageLogic } from '../../hooks/useClientesPageLogic';
import {
  getClientesTableColumns,
  ClientesActionButtons,
  ClientesTableContainer,
} from '../../components/clientes';
import { clienteExcelService } from '../../services/BaseExcelService';
import { clienteService } from '../../services/clienteService';

export default function ClientesPage() {
  const {
    clientes,
    loading,
    totalItems,
    currentPage,
    pageSize,
    deleteLoading,
    useVirtualScrolling,
    deleteModal,
    importModal,
    excelOperations,
    setCurrentPage,
    setItemsPerPage,
    handleFiltersChange,
    handleDelete,
    handleImportComplete,
    handleExport,
    handleNewCliente,
    navigate,
  } = useClientesPageLogic();

  const columns = getClientesTableColumns({
    onView: (id) => navigate(`/clientes/${id}`),
    onEdit: (id) => navigate(`/clientes/${id}/edit`),
    onViewSites: (id) => navigate(`/clientes/${id}/sites`),
    onViewTramos: (id) => navigate(`/clientes/${id}/tramos`),
    onDelete: (cliente) => deleteModal.openDelete(cliente),
  });

  return (
    <Container size="xl">
      <LoadingOverlay loading={loading}>
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={1}>Gestión de Clientes</Title>

            <ClientesActionButtons
              onImport={importModal.openCreate}
              onExport={handleExport}
              onNew={handleNewCliente}
              isExporting={excelOperations.isExporting}
            />
          </Group>

          <ClientesTableContainer
            columns={columns}
            data={clientes}
            loading={loading}
            totalItems={totalItems}
            currentPage={currentPage}
            pageSize={pageSize}
            useVirtualScrolling={useVirtualScrolling}
            onPageChange={setCurrentPage}
            onPageSizeChange={setItemsPerPage}
            onFiltersChange={handleFiltersChange}
          />
        </Stack>
      </LoadingOverlay>

      <ConfirmModal
        opened={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar el cliente "${deleteModal.selectedItem?.nombre}"? Esta acción no se puede deshacer.`}
        type="delete"
        loading={deleteLoading}
      />

      <ExcelImportModal
        opened={importModal.isOpen}
        onClose={importModal.close}
        title="Importar Clientes desde Excel"
        entityType="cliente"
        onImportComplete={handleImportComplete}
        processExcelFile={clienteService.processExcelFile}
        validateExcelFile={clienteService.validateExcelFile}
        previewExcelFile={clienteService.previewExcelFile}
        getTemplate={async () => {
          const blob = await clienteExcelService.getTemplate();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_clientes.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      />
    </Container>
  );
}
