import React, { useState } from 'react';
import { Paper, Title, Group } from '@mantine/core';
import { IconCreditCard } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { usePaymentTracker, PagoRegistrado, ContactoSeguimiento } from './hooks/usePaymentTracker';
import { PaymentFilters } from './components/PaymentFilters';
import { PaymentTabs } from './components/PaymentTabs';
import { PaymentModals } from './components/PaymentModals';

export const PaymentTracker: React.FC = () => {
  const { seguimientosFiltrados, filtros, setFiltros, registrarPago, registrarContacto } =
    usePaymentTracker();

  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<
    import('./hooks/usePaymentTracker').SeguimientoPago | null
  >(null);
  const [nuevoPago, setNuevoPago] = useState<Partial<PagoRegistrado>>({});
  const [nuevoContacto, setNuevoContacto] = useState<Partial<ContactoSeguimiento>>({});
  const [activeTab, setActiveTab] = useState('todos');

  const [modalPagoOpened, { open: openModalPago, close: closeModalPago }] = useDisclosure(false);
  const [modalContactoOpened, { open: openModalContacto, close: closeModalContacto }] =
    useDisclosure(false);
  const [modalDetalleOpened, { open: openModalDetalle, close: closeModalDetalle }] =
    useDisclosure(false);

  const handleRegistrarPago = () => {
    if (!seguimientoSeleccionado) return;

    const success = registrarPago(seguimientoSeleccionado.partidaId, nuevoPago);
    if (success) {
      setNuevoPago({});
      closeModalPago();
    }
  };

  const handleRegistrarContacto = () => {
    if (!seguimientoSeleccionado) return;

    const success = registrarContacto(seguimientoSeleccionado.partidaId, nuevoContacto);
    if (success) {
      setNuevoContacto({});
      closeModalContacto();
    }
  };

  const handleViewDetail = (seguimiento: import('./hooks/usePaymentTracker').SeguimientoPago) => {
    setSeguimientoSeleccionado(seguimiento);
    openModalDetalle();
  };

  const handleRegisterPayment = (
    seguimiento: import('./hooks/usePaymentTracker').SeguimientoPago
  ) => {
    setSeguimientoSeleccionado(seguimiento);
    openModalPago();
  };

  const handleRegisterContact = (
    seguimiento: import('./hooks/usePaymentTracker').SeguimientoPago
  ) => {
    setSeguimientoSeleccionado(seguimiento);
    openModalContacto();
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconCreditCard size={20} />
          <Title order={4}>Seguimiento de Pagos</Title>
        </Group>
      </Group>

      <PaymentFilters filtros={filtros} setFiltros={setFiltros} />

      <PaymentTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        seguimientosFiltrados={seguimientosFiltrados}
        onViewDetail={handleViewDetail}
        onRegisterPayment={handleRegisterPayment}
        onRegisterContact={handleRegisterContact}
      />

      <PaymentModals
        modalPagoOpened={modalPagoOpened}
        closeModalPago={closeModalPago}
        nuevoPago={nuevoPago}
        setNuevoPago={setNuevoPago}
        onRegistrarPago={handleRegistrarPago}
        modalContactoOpened={modalContactoOpened}
        closeModalContacto={closeModalContacto}
        nuevoContacto={nuevoContacto}
        setNuevoContacto={setNuevoContacto}
        onRegistrarContacto={handleRegistrarContacto}
        modalDetalleOpened={modalDetalleOpened}
        closeModalDetalle={closeModalDetalle}
        seguimientoSeleccionado={seguimientoSeleccionado}
      />
    </Paper>
  );
};
