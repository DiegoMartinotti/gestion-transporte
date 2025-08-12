import { Stack } from '@mantine/core';
import { useState, useEffect } from 'react';
import { Cliente } from '../../types';
import LoadingOverlay from '../base/LoadingOverlay';
import { ClienteDetailHeader } from './ClienteDetailHeader';
import { ClienteDetailContact } from './ClienteDetailContact';
import { ClienteDetailStats } from './ClienteDetailStats';

interface ClienteDetailProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (cliente: Cliente) => void;
  onCreateSite?: (cliente: Cliente) => void;
  onCreateTramo?: (cliente: Cliente) => void;
  onViewSites?: (cliente: Cliente) => void;
  onViewTramos?: (cliente: Cliente) => void;
  loading?: boolean;
}

export function ClienteDetail({
  cliente,
  onEdit,
  onDelete,
  onCreateSite,
  onCreateTramo,
  onViewSites,
  onViewTramos,
  loading = false,
}: ClienteDetailProps) {
  const [sitesCount, setSitesCount] = useState(0);
  const [tramosCount, setTramosCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  // TODO: Implementar carga de estadísticas cuando estén disponibles los servicios
  useEffect(() => {
    // Simulación de carga de estadísticas
    setLoadingStats(true);
    setTimeout(() => {
      setSitesCount(0);
      setTramosCount(0);
      setLoadingStats(false);
    }, 500);
  }, [cliente._id]);

  if (loading) {
    return (
      <LoadingOverlay loading={true}>
        <div />
      </LoadingOverlay>
    );
  }

  return (
    <Stack gap="lg">
      <ClienteDetailHeader cliente={cliente} onEdit={onEdit} onDelete={onDelete} />

      <ClienteDetailContact cliente={cliente} />

      <ClienteDetailStats
        cliente={cliente}
        sitesCount={sitesCount}
        tramosCount={tramosCount}
        loadingStats={loadingStats}
        onCreateSite={onCreateSite}
        onCreateTramo={onCreateTramo}
        onViewSites={onViewSites}
        onViewTramos={onViewTramos}
      />
    </Stack>
  );
}
