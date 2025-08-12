import { Stack } from '@mantine/core';
import { useState, useEffect } from 'react';
import { Empresa } from '../../types';
import LoadingOverlay from '../base/LoadingOverlay';
import { EmpresaDetailHeader } from './EmpresaDetailHeader';
import { EmpresaDetailInfo } from './EmpresaDetailInfo';
import { EmpresaDetailStats } from './EmpresaDetailStats';

interface EmpresaDetailProps {
  empresa: Empresa;
  onEdit?: (empresa: Empresa) => void;
  onDelete?: (empresa: Empresa) => void;
  onCreateVehiculo?: (empresa: Empresa) => void;
  onCreatePersonal?: (empresa: Empresa) => void;
  onViewVehiculos?: (empresa: Empresa) => void;
  onViewPersonal?: (empresa: Empresa) => void;
  loading?: boolean;
}

export function EmpresaDetail({
  empresa,
  onEdit,
  onDelete,
  onCreateVehiculo,
  onCreatePersonal,
  onViewVehiculos,
  onViewPersonal,
  loading = false,
}: EmpresaDetailProps) {
  const [vehiculosCount, setVehiculosCount] = useState(0);
  const [personalCount, setPersonalCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  // TODO: Implementar carga de estadísticas cuando estén disponibles los servicios
  useEffect(() => {
    // Simulación de carga de estadísticas
    setLoadingStats(true);
    setTimeout(() => {
      setVehiculosCount(empresa.flota?.length || 0);
      setPersonalCount(empresa.personal?.length || 0);
      setLoadingStats(false);
    }, 500);
  }, [empresa._id, empresa.flota, empresa.personal]);

  if (loading) {
    return (
      <LoadingOverlay loading={true}>
        <div />
      </LoadingOverlay>
    );
  }

  return (
    <Stack gap="lg">
      <EmpresaDetailHeader empresa={empresa} onEdit={onEdit} onDelete={onDelete} />

      <EmpresaDetailInfo empresa={empresa} />

      <EmpresaDetailStats
        empresa={empresa}
        vehiculosCount={vehiculosCount}
        personalCount={personalCount}
        loadingStats={loadingStats}
        onCreateVehiculo={onCreateVehiculo}
        onCreatePersonal={onCreatePersonal}
        onViewVehiculos={onViewVehiculos}
        onViewPersonal={onViewPersonal}
      />
    </Stack>
  );
}
