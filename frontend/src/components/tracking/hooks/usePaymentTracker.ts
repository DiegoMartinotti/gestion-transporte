import { useState, useEffect } from 'react';
import { EstadoPartida } from '../../../types/ordenCompra';
import { usePaymentOperations } from './usePaymentOperations';
import { getSeguimientosEjemplo } from '../utils/paymentData';

export interface PagoRegistrado {
  id: string;
  fecha: Date;
  monto: number;
  metodoPago: 'transferencia' | 'cheque' | 'efectivo' | 'otro';
  referencia?: string;
  observaciones?: string;
  comprobante?: string;
}

export interface ContactoSeguimiento {
  id: string;
  fecha: Date;
  tipo: 'email' | 'telefono' | 'visita' | 'otro';
  descripcion: string;
  resultado: 'exitoso' | 'pendiente' | 'sin_respuesta';
  proximaAccion?: string;
  fechaProximaAccion?: Date;
}

export interface SeguimientoPago {
  partidaId: string;
  numeroPartida: string;
  ordenCompra: string;
  cliente: string;
  descripcion: string;
  montoTotal: number;
  montoAcumulado: number;
  montoPendiente: number;
  estado: EstadoPartida;
  fechaVencimiento?: Date;
  diasVencimiento?: number;
  proximoSeguimiento?: Date;
  pagosRegistrados: PagoRegistrado[];
  contactosRealizados: ContactoSeguimiento[];
  prioridad: 'alta' | 'media' | 'baja';
  observaciones?: string;
}

export interface FiltrosSeguimiento {
  estado?: EstadoPartida | '';
  prioridad?: string;
  cliente?: string;
  vencimientoDesde?: Date;
  vencimientoHasta?: Date;
  soloVencidos?: boolean;
}

export const usePaymentTracker = () => {
  const [seguimientos, setSeguimientos] = useState<SeguimientoPago[]>([]);
  const [seguimientosFiltrados, setSeguimientosFiltrados] = useState<SeguimientoPago[]>([]);
  const [filtros, setFiltros] = useState<FiltrosSeguimiento>({});

  const { registrarPago: registrarPagoOperation, registrarContacto: registrarContactoOperation } =
    usePaymentOperations();

  // Datos de ejemplo
  useEffect(() => {
    const seguimientosEjemplo = getSeguimientosEjemplo();
    setSeguimientos(seguimientosEjemplo);
    setSeguimientosFiltrados(seguimientosEjemplo);
  }, []);

  const aplicarFiltros = () => {
    let resultado = [...seguimientos];

    if (filtros.estado) {
      resultado = resultado.filter((s) => s.estado === filtros.estado);
    }

    if (filtros.prioridad) {
      resultado = resultado.filter((s) => s.prioridad === filtros.prioridad);
    }

    if (filtros.cliente) {
      resultado = resultado.filter((s) =>
        s.cliente.toLowerCase().includes((filtros.cliente || '').toLowerCase())
      );
    }

    if (filtros.soloVencidos) {
      resultado = resultado.filter((s) => s.estado === 'vencida');
    }

    setSeguimientosFiltrados(resultado);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, seguimientos]); // eslint-disable-line react-hooks/exhaustive-deps

  const registrarPago = (seguimientoId: string, pago: Partial<PagoRegistrado>): boolean => {
    return registrarPagoOperation(seguimientos, setSeguimientos, seguimientoId, pago);
  };

  const registrarContacto = (
    seguimientoId: string,
    contacto: Partial<ContactoSeguimiento>
  ): boolean => {
    return registrarContactoOperation(seguimientos, setSeguimientos, seguimientoId, contacto);
  };

  return {
    seguimientos,
    seguimientosFiltrados,
    filtros,
    setFiltros,
    registrarPago,
    registrarContacto,
  };
};
