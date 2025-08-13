import { Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import DataTable from '../base/DataTable';
import { DocumentExpiration } from '../alerts/DocumentExpiration';
import { Vehiculo, VehiculoConVencimientos } from '../../types/vehiculo';
import { VehiculoFormModal } from '../../types/excel';
import { VEHICULOS_CONSTANTS } from '../../constants/vehiculos';

interface VehiculosVencimientosPanelProps {
  vehiculos: Vehiculo[];
  vehiculosVencimientos: VehiculoConVencimientos[];
  vencimientosColumns: any[];
  loading: boolean;
  formModal: VehiculoFormModal;
}

export const VehiculosVencimientosPanel = ({
  vehiculos,
  vehiculosVencimientos,
  vencimientosColumns,
  loading,
  formModal,
}: VehiculosVencimientosPanelProps) => (
  <>
    <DocumentExpiration
      vehiculos={
        vehiculos
          .filter((v: Vehiculo) => v._id !== undefined)
          .map((v: Vehiculo) => ({
            ...v,
            _id: v._id as string,
            empresa: typeof v.empresa === 'string' ? undefined : v.empresa,
          })) as any
      }
      mostrarVencidos={true}
      mostrarProximos={true}
      mostrarVigentes={false}
      onEditVehiculo={(vehiculoId: string) => {
        const vehiculo = vehiculos.find((v: Vehiculo) => v._id === vehiculoId);
        if (vehiculo) formModal.openEdit(vehiculo);
      }}
    />

    {vehiculosVencimientos?.length > 0 && (
      <>
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Lista de Vehículos con Vencimientos"
          color="orange"
          mb="md"
          mt="md"
        >
          Hay {vehiculosVencimientos?.length || 0} vehículo(s) con documentación próxima a vencer o
          vencida.
        </Alert>

        <DataTable
          data={vehiculosVencimientos || []}
          columns={vencimientosColumns}
          loading={loading}
          emptyMessage={VEHICULOS_CONSTANTS.MESSAGES.EMPTY_VENCIMIENTOS}
        />
      </>
    )}
  </>
);
