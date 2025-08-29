import React from 'react';
import { PaymentModal } from './PaymentModal';
import { ContactModal } from './ContactModal';
import { DetailModal } from './DetailModal';
import { SeguimientoPago, PagoRegistrado, ContactoSeguimiento } from '../hooks/usePaymentTracker';

interface PaymentModalsProps {
  // Modal Pago
  modalPagoOpened: boolean;
  closeModalPago: () => void;
  nuevoPago: Partial<PagoRegistrado>;
  setNuevoPago: (pago: Partial<PagoRegistrado>) => void;
  onRegistrarPago: () => void;

  // Modal Contacto
  modalContactoOpened: boolean;
  closeModalContacto: () => void;
  nuevoContacto: Partial<ContactoSeguimiento>;
  setNuevoContacto: (contacto: Partial<ContactoSeguimiento>) => void;
  onRegistrarContacto: () => void;

  // Modal Detalle
  modalDetalleOpened: boolean;
  closeModalDetalle: () => void;

  // Data
  seguimientoSeleccionado: SeguimientoPago | null;
}

export const PaymentModals: React.FC<PaymentModalsProps> = ({
  modalPagoOpened,
  closeModalPago,
  nuevoPago,
  setNuevoPago,
  onRegistrarPago,
  modalContactoOpened,
  closeModalContacto,
  nuevoContacto,
  setNuevoContacto,
  onRegistrarContacto,
  modalDetalleOpened,
  closeModalDetalle,
  seguimientoSeleccionado,
}) => {
  return (
    <>
      <PaymentModal
        opened={modalPagoOpened}
        onClose={closeModalPago}
        seguimientoSeleccionado={seguimientoSeleccionado}
        nuevoPago={nuevoPago}
        setNuevoPago={setNuevoPago}
        onRegistrarPago={onRegistrarPago}
      />

      <ContactModal
        opened={modalContactoOpened}
        onClose={closeModalContacto}
        seguimientoSeleccionado={seguimientoSeleccionado}
        nuevoContacto={nuevoContacto}
        setNuevoContacto={setNuevoContacto}
        onRegistrarContacto={onRegistrarContacto}
      />

      <DetailModal
        opened={modalDetalleOpened}
        onClose={closeModalDetalle}
        seguimientoSeleccionado={seguimientoSeleccionado}
      />
    </>
  );
};
