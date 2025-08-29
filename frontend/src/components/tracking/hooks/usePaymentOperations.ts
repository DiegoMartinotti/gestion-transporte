import { notifications } from '@mantine/notifications';
import { EstadoPartida } from '../../../types/ordenCompra';
import { PagoRegistrado, ContactoSeguimiento, SeguimientoPago } from './usePaymentTracker';

export const usePaymentOperations = () => {
  const registrarPago = (
    seguimientos: SeguimientoPago[],
    setSeguimientos: (seguimientos: SeguimientoPago[]) => void,
    seguimientoId: string,
    pago: Partial<PagoRegistrado>
  ): boolean => {
    if (!pago.monto || !pago.fecha) {
      notifications.show({
        title: 'Error',
        message: 'Debe completar todos los campos requeridos',
        color: 'red',
      });
      return false;
    }

    const pagoCompleto: PagoRegistrado = {
      id: Date.now().toString(),
      fecha: pago.fecha,
      monto: pago.monto,
      metodoPago: pago.metodoPago || 'transferencia',
      referencia: pago.referencia,
      observaciones: pago.observaciones,
    };

    const seguimientosActualizados = seguimientos.map((s) => {
      if (s.partidaId === seguimientoId) {
        const nuevoMontoAcumulado = s.montoAcumulado + pagoCompleto.monto;
        const nuevoMontoPendiente = s.montoTotal - nuevoMontoAcumulado;

        return {
          ...s,
          montoAcumulado: nuevoMontoAcumulado,
          montoPendiente: nuevoMontoPendiente,
          estado: nuevoMontoPendiente <= 0 ? ('pagada' as EstadoPartida) : s.estado,
          pagosRegistrados: [...s.pagosRegistrados, pagoCompleto],
        };
      }
      return s;
    });

    setSeguimientos(seguimientosActualizados);

    notifications.show({
      title: 'Pago Registrado',
      message: 'El pago ha sido registrado exitosamente',
      color: 'green',
    });

    return true;
  };

  const registrarContacto = (
    seguimientos: SeguimientoPago[],
    setSeguimientos: (seguimientos: SeguimientoPago[]) => void,
    seguimientoId: string,
    contacto: Partial<ContactoSeguimiento>
  ): boolean => {
    if (!contacto.descripcion) {
      notifications.show({
        title: 'Error',
        message: 'Debe completar la descripción del contacto',
        color: 'red',
      });
      return false;
    }

    const contactoCompleto: ContactoSeguimiento = {
      id: Date.now().toString(),
      fecha: contacto.fecha || new Date(),
      tipo: contacto.tipo || 'email',
      descripcion: contacto.descripcion,
      resultado: contacto.resultado || 'pendiente',
      proximaAccion: contacto.proximaAccion,
      fechaProximaAccion: contacto.fechaProximaAccion,
    };

    const seguimientosActualizados = seguimientos.map((s) => {
      if (s.partidaId === seguimientoId) {
        return {
          ...s,
          contactosRealizados: [...s.contactosRealizados, contactoCompleto],
          proximoSeguimiento: contactoCompleto.fechaProximaAccion,
        };
      }
      return s;
    });

    setSeguimientos(seguimientosActualizados);

    notifications.show({
      title: 'Contacto Registrado',
      message: 'El contacto ha sido registrado exitosamente',
      color: 'green',
    });

    return true;
  };

  return {
    registrarPago,
    registrarContacto,
  };
};
