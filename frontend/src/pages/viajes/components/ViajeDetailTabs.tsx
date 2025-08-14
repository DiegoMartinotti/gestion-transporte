import { Tabs } from '@mantine/core';
import {
  IconInfoCircle,
  IconTruck,
  IconPackage,
  IconCurrencyDollar,
  IconRoute,
} from '@tabler/icons-react';
import { ViajeGeneralTab } from '../../../components/viajes/ViajeGeneralTab';
import { ViajeRecursosTab } from '../../../components/viajes/ViajeRecursosTab';
import { ViajeCargaTab } from '../../../components/viajes/ViajeCargaTab';
import { ViajeCostosTab } from '../../../components/viajes/ViajeCostosTab';
import { Viaje } from '../../../types/viaje';

import { ViajeTracker } from '../ViajeTracker';
import { formatDate, formatCurrency } from '../helpers/viajeDetailHelpers';

interface ViajeDetailTabsProps {
  viaje: Viaje;
  activeTab: string | null;
  onTabChange: (value: string | null) => void;
  onShowCalculationDetails: () => void;
  onChangeEstado: (estado: string) => void;
}

export function ViajeDetailTabs({
  viaje,
  activeTab,
  onTabChange,
  onShowCalculationDetails,
  onChangeEstado,
}: ViajeDetailTabsProps) {
  return (
    <Tabs value={activeTab} onChange={onTabChange}>
      <Tabs.List>
        <Tabs.Tab value="general" leftSection={<IconInfoCircle size={14} />}>
          Información General
        </Tabs.Tab>
        <Tabs.Tab value="recursos" leftSection={<IconTruck size={14} />}>
          Vehículos y Personal
        </Tabs.Tab>
        <Tabs.Tab value="carga" leftSection={<IconPackage size={14} />}>
          Detalles de Carga
        </Tabs.Tab>
        <Tabs.Tab value="costos" leftSection={<IconCurrencyDollar size={14} />}>
          Costos y Facturación
        </Tabs.Tab>
        <Tabs.Tab value="seguimiento" leftSection={<IconRoute size={14} />}>
          Seguimiento
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="general" pt="md">
        <ViajeGeneralTab viaje={viaje} formatDate={formatDate} />
      </Tabs.Panel>

      <Tabs.Panel value="recursos" pt="md">
        <ViajeRecursosTab viaje={viaje} />
      </Tabs.Panel>

      <Tabs.Panel value="carga" pt="md">
        <ViajeCargaTab viaje={viaje} />
      </Tabs.Panel>

      <Tabs.Panel value="costos" pt="md">
        <ViajeCostosTab
          viaje={viaje}
          formatCurrency={formatCurrency}
          onShowCalculationDetails={onShowCalculationDetails}
        />
      </Tabs.Panel>

      <Tabs.Panel value="seguimiento" pt="md">
        <ViajeTracker viaje={viaje} onUpdateEstado={onChangeEstado} />
      </Tabs.Panel>
    </Tabs>
  );
}
