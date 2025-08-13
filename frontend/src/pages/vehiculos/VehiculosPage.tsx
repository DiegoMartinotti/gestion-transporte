import React from 'react';
import { Container } from '@mantine/core';
import { useVehiculos } from '../../hooks/useVehiculos';
import { VehiculosActions } from '../../components/vehiculos';
import VehiculosTabs from '../../components/vehiculos/VehiculosTabs';
import VehiculosModales from '../../components/vehiculos/VehiculosModales';
import LoadingOverlay from '../../components/base/LoadingOverlay';

export default function VehiculosPage() {
  const {
    // Estados
    filters,
    activeTab,
    viewMode,
    setViewMode,

    // Data
    empresas,
    vehiculos,
    vehiculosVencimientos,
    loading,

    // Columnas
    vehiculosColumns,
    vencimientosColumns,

    // Modales
    formModal,
    deleteModal,
    detailModal,

    // Handlers
    handleTabChange,
    handleDelete,
    openDeleteModal,
    handleFiltersChange,

    // Excel
    excelOperations,
  } = useVehiculos();

  return (
    <Container size="xl">
      <VehiculosActions
        onCreateVehicle={() => formModal.openCreate()}
        excelOperations={excelOperations}
      />

      <VehiculosTabs
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        vehiculos={vehiculos}
        vehiculosVencimientos={vehiculosVencimientos}
        filters={filters}
        handleFiltersChange={handleFiltersChange}
        empresas={empresas}
        viewMode={viewMode}
        setViewMode={setViewMode}
        vehiculosColumns={vehiculosColumns}
        vencimientosColumns={vencimientosColumns}
        loading={loading}
        formModal={formModal}
        openDeleteModal={openDeleteModal}
        detailModal={detailModal}
      />

      <VehiculosModales
        deleteModal={deleteModal}
        formModal={formModal}
        detailModal={detailModal}
        handleDelete={handleDelete}
      />

      <LoadingOverlay loading={loading}>
        <div />
      </LoadingOverlay>
    </Container>
  );
}
