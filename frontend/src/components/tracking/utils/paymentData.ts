import { SeguimientoPago } from '../hooks/usePaymentTracker';

export const getSeguimientosEjemplo = (): SeguimientoPago[] => {
  return [
    {
      partidaId: 'P-001',
      numeroPartida: 'P-001',
      ordenCompra: 'OC-2024-001',
      cliente: 'TECPETROL S.A.',
      descripcion: 'Transporte de equipos - Enero',
      montoTotal: 850000,
      montoAcumulado: 400000,
      montoPendiente: 450000,
      estado: 'abierta',
      fechaVencimiento: new Date('2024-03-15'),
      proximoSeguimiento: new Date('2024-02-20'),
      prioridad: 'media',
      pagosRegistrados: [
        {
          id: '1',
          fecha: new Date('2024-02-01'),
          monto: 400000,
          metodoPago: 'transferencia',
          referencia: 'TRF-240201-001',
          observaciones: 'Pago parcial recibido',
        },
      ],
      contactosRealizados: [
        {
          id: '1',
          fecha: new Date('2024-02-15'),
          tipo: 'email',
          descripcion: 'Recordatorio de saldo pendiente',
          resultado: 'exitoso',
          proximaAccion: 'Seguimiento telefónico',
          fechaProximaAccion: new Date('2024-02-20'),
        },
      ],
    },
    {
      partidaId: 'P-002',
      numeroPartida: 'P-002',
      ordenCompra: 'OC-2024-002',
      cliente: 'YPF S.A.',
      descripcion: 'Servicios de transporte - Febrero',
      montoTotal: 1200000,
      montoAcumulado: 0,
      montoPendiente: 1200000,
      estado: 'vencida',
      fechaVencimiento: new Date('2024-02-10'),
      diasVencimiento: 10,
      proximoSeguimiento: new Date('2024-02-18'),
      prioridad: 'alta',
      pagosRegistrados: [],
      contactosRealizados: [
        {
          id: '1',
          fecha: new Date('2024-02-12'),
          tipo: 'telefono',
          descripcion: 'Contacto para recordatorio de vencimiento',
          resultado: 'sin_respuesta',
        },
        {
          id: '2',
          fecha: new Date('2024-02-16'),
          tipo: 'email',
          descripcion: 'Envío de estado de cuenta',
          resultado: 'pendiente',
        },
      ],
      observaciones: 'Cliente con historial de pagos tardíos',
    },
  ];
};
