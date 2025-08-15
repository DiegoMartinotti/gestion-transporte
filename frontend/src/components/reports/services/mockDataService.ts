import { EstadoPartida } from '../../../types/ordenCompra';
import { PartidaReportData } from '../types';

interface PartidaExampleData {
  numero: string;
  ordenCompra: string;
  cliente: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaCreacion: string;
  fechaVencimiento?: string;
  fechaPago?: string;
  diasVencimiento?: number;
}

const createPartidaExample = (data: PartidaExampleData): PartidaReportData => ({
  numero: data.numero,
  ordenCompra: data.ordenCompra,
  cliente: data.cliente,
  descripcion: data.descripcion,
  montoOriginal: data.montoOriginal,
  importePagado: data.importePagado,
  importePendiente: data.importePendiente,
  estado: data.estado,
  fechaCreacion: new Date(data.fechaCreacion),
  fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : undefined,
  fechaPago: data.fechaPago ? new Date(data.fechaPago) : undefined,
  diasVencimiento: data.diasVencimiento,
});

export const mockDataService = {
  getPartidas: (): PartidaReportData[] => [
    createPartidaExample({
      numero: 'P-001',
      ordenCompra: 'OC-2024-001',
      cliente: 'TECPETROL S.A.',
      descripcion: 'Transporte de equipos - Enero',
      montoOriginal: 850000,
      importePagado: 850000,
      importePendiente: 0,
      estado: 'pagada',
      fechaCreacion: '2024-01-15',
      fechaVencimiento: '2024-02-15',
      fechaPago: '2024-02-10',
    }),
    createPartidaExample({
      numero: 'P-002',
      ordenCompra: 'OC-2024-002',
      cliente: 'YPF S.A.',
      descripcion: 'Servicios de transporte - Febrero',
      montoOriginal: 1200000,
      importePagado: 600000,
      importePendiente: 600000,
      estado: 'abierta',
      fechaCreacion: '2024-02-01',
      fechaVencimiento: '2024-03-15',
    }),
    createPartidaExample({
      numero: 'P-003',
      ordenCompra: 'OC-2024-003',
      cliente: 'SHELL ARGENTINA S.A.',
      descripcion: 'Transporte especializado',
      montoOriginal: 750000,
      importePagado: 0,
      importePendiente: 750000,
      estado: 'vencida',
      fechaCreacion: '2024-01-20',
      fechaVencimiento: '2024-02-20',
      diasVencimiento: 15,
    }),
  ],
};
