import React, { useState, useEffect } from 'react';
import { Paper, Title, Group, Button, Tabs } from '@mantine/core';
import {
  IconFileReport,
  IconTrendingUp,
  IconAlertTriangle,
  IconFileExport,
  IconPrinter,
  IconRefresh,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { PartidaFilters } from './components/PartidaFilters';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { PartidaDetails } from './components/PartidaDetails';
import { OverduePartidas } from './components/OverduePartidas';
import { PartidaDetailModal } from './components/PartidaDetailModal';
import { usePartidaCalculations } from './hooks/usePartidaCalculations';
import { usePartidaFilters } from './hooks/usePartidaFilters';
import { exportService } from './services/exportService';
import { mockDataService } from './services/mockDataService';
import { PartidaReportData } from './types';

export const PartidaReport: React.FC = () => {
  const [partidas, setPartidas] = useState<PartidaReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [partidaSeleccionada, setPartidaSeleccionada] = useState<PartidaReportData | null>(null);

  const { filtros, setFiltros, partidasFiltradas } = usePartidaFilters(partidas);
  const { resumen } = usePartidaCalculations(partidasFiltradas);

  useEffect(() => {
    const partidasEjemplo = mockDataService.getPartidas();
    setPartidas(partidasEjemplo);
  }, []);

  const handleExport = (formato: 'excel' | 'pdf') => {
    exportService.exportReport(formato, partidasFiltradas, setLoading);
  };

  const handleVerDetalle = (partida: PartidaReportData) => {
    setPartidaSeleccionada(partida);
    openModal();
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconFileReport size={20} />
          <Title order={4}>Reporte de Partidas</Title>
        </Group>
        <Group gap="xs">
          <Button variant="light" leftSection={<IconRefresh size={16} />} loading={loading}>
            Actualizar
          </Button>
          <Button
            variant="light"
            leftSection={<IconFileExport size={16} />}
            onClick={() => handleExport('excel')}
          >
            Excel
          </Button>
          <Button
            variant="light"
            leftSection={<IconPrinter size={16} />}
            onClick={() => handleExport('pdf')}
          >
            PDF
          </Button>
        </Group>
      </Group>

      <PartidaFilters filtros={filtros} onFiltrosChange={setFiltros} />

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'resumen')}>
        <Tabs.List>
          <Tabs.Tab value="resumen" leftSection={<IconTrendingUp size={16} />}>
            Resumen Ejecutivo
          </Tabs.Tab>
          <Tabs.Tab value="detalle" leftSection={<IconFileReport size={16} />}>
            Detalle de Partidas
          </Tabs.Tab>
          <Tabs.Tab value="vencimientos" leftSection={<IconAlertTriangle size={16} />}>
            Vencimientos
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <ExecutiveSummary resumen={resumen} />
        </Tabs.Panel>

        <Tabs.Panel value="detalle" pt="md">
          <PartidaDetails partidas={partidasFiltradas} onVerDetalle={handleVerDetalle} />
        </Tabs.Panel>

        <Tabs.Panel value="vencimientos" pt="md">
          <OverduePartidas partidas={partidasFiltradas} />
        </Tabs.Panel>
      </Tabs>

      <PartidaDetailModal opened={modalOpened} onClose={closeModal} partida={partidaSeleccionada} />
    </Paper>
  );
};
