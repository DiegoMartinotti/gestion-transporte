import React from 'react';
import { Tabs, Stack, Alert } from '@mantine/core';
import { IconHistory, IconAlertTriangle, IconClock, IconCheck } from '@tabler/icons-react';
import { SeguimientoPago } from '../hooks/usePaymentTracker';
import { PaymentCard } from './PaymentCard';
import { MESSAGES } from '../utils/trackingHelpers';

interface PaymentTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  seguimientosFiltrados: SeguimientoPago[];
  onViewDetail: (seguimiento: SeguimientoPago) => void;
  onRegisterPayment: (seguimiento: SeguimientoPago) => void;
  onRegisterContact: (seguimiento: SeguimientoPago) => void;
}

export const PaymentTabs: React.FC<PaymentTabsProps> = ({
  activeTab,
  setActiveTab,
  seguimientosFiltrados,
  onViewDetail,
  onRegisterPayment,
  onRegisterContact,
}) => {
  const getSeguimientosPorTab = () => {
    const hoy = new Date();

    switch (activeTab) {
      case 'urgentes':
        return seguimientosFiltrados.filter(
          (s) => s.prioridad === 'alta' || s.estado === 'vencida'
        );
      case 'hoy':
        return seguimientosFiltrados.filter(
          (s) => s.proximoSeguimiento && s.proximoSeguimiento.toDateString() === hoy.toDateString()
        );
      case 'pagadas':
        return seguimientosFiltrados.filter((s) => s.estado === 'pagada');
      default:
        return seguimientosFiltrados;
    }
  };

  const urgentesCount = seguimientosFiltrados.filter(
    (s) => s.prioridad === 'alta' || s.estado === 'vencida'
  ).length;
  const pagadasCount = seguimientosFiltrados.filter((s) => s.estado === 'pagada').length;
  const seguimientosPorTab = getSeguimientosPorTab();

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'todos')}>
      <Tabs.List>
        <Tabs.Tab value="todos" leftSection={<IconHistory size={16} />}>
          Todos ({seguimientosFiltrados.length})
        </Tabs.Tab>
        <Tabs.Tab value="urgentes" leftSection={<IconAlertTriangle size={16} />}>
          Urgentes ({urgentesCount})
        </Tabs.Tab>
        <Tabs.Tab value="hoy" leftSection={<IconClock size={16} />}>
          Seguimiento Hoy
        </Tabs.Tab>
        <Tabs.Tab value="pagadas" leftSection={<IconCheck size={16} />}>
          Pagadas ({pagadasCount})
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value={activeTab} pt="md">
        <Stack gap="sm">
          {seguimientosPorTab.map((seguimiento) => (
            <PaymentCard
              key={seguimiento.partidaId}
              seguimiento={seguimiento}
              onViewDetail={onViewDetail}
              onRegisterPayment={onRegisterPayment}
              onRegisterContact={onRegisterContact}
            />
          ))}

          {seguimientosPorTab.length === 0 && (
            <Alert color="blue" title="Sin resultados">
              {MESSAGES.NO_RESULTS_FOUND}
            </Alert>
          )}
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
};
