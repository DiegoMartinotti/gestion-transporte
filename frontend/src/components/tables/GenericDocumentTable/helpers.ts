import dayjs from 'dayjs';
import { DocumentoGenerico, DocumentStatus, COLORS } from './types';

/**
 * Calcula el estado de un documento basado en su fecha de vencimiento
 */
export const getDocumentStatus = (fechaVencimiento?: Date): DocumentStatus => {
  if (!fechaVencimiento) {
    return {
      status: 'sin-fecha',
      color: COLORS.GRAY,
      label: 'Sin fecha de vencimiento',
    };
  }

  const today = dayjs();
  const vencimiento = dayjs(fechaVencimiento);
  const diasRestantes = vencimiento.diff(today, 'day');

  if (diasRestantes < 0) {
    return {
      status: 'vencido',
      color: COLORS.RED,
      label: `Vencido hace ${Math.abs(diasRestantes)} días`,
      diasRestantes: diasRestantes,
    };
  } else if (diasRestantes <= 30) {
    return {
      status: 'por-vencer',
      color: COLORS.ORANGE,
      label: `Vence en ${diasRestantes} días`,
      diasRestantes: diasRestantes,
    };
  } else {
    return {
      status: 'vigente',
      color: COLORS.GREEN,
      label: `Vigente (${diasRestantes} días)`,
      diasRestantes: diasRestantes,
    };
  }
};

/**
 * Opciones de filtrado para documentos
 */
export interface DocumentFilters {
  searchTerm: string;
  tipo: string;
  estado: string;
  entidad: string;
}

/**
 * Filtra documentos basado en criterios de búsqueda
 */
export const filterDocuments = (
  documentos: DocumentoGenerico[],
  filters: DocumentFilters
): DocumentoGenerico[] => {
  return documentos.filter((doc) => {
    // Filtro por búsqueda
    const matchesSearch =
      !filters.searchTerm ||
      doc.tipo.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      doc.numero?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      doc.entidadNombre?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Filtro por tipo
    const matchesTipo = filters.tipo === 'todos' || doc.tipo === filters.tipo;

    // Filtro por estado
    const status = getDocumentStatus(doc.fechaVencimiento);
    const matchesEstado = filters.estado === 'todos' || status.status === filters.estado;

    // Filtro por entidad
    const matchesEntidad = filters.entidad === 'todos' || doc.entidadId === filters.entidad;

    return matchesSearch && matchesTipo && matchesEstado && matchesEntidad;
  });
};

/**
 * Calcula estadísticas de documentos
 */
export const calculateDocumentStats = (documentos: DocumentoGenerico[]) => {
  const stats = {
    total: documentos.length,
    vencidos: 0,
    porVencer: 0,
    vigentes: 0,
    sinFecha: 0,
  };

  documentos.forEach((doc) => {
    const status = getDocumentStatus(doc.fechaVencimiento);
    switch (status.status) {
      case 'vencido':
        stats.vencidos++;
        break;
      case 'por-vencer':
        stats.porVencer++;
        break;
      case 'vigente':
        stats.vigentes++;
        break;
      case 'sin-fecha':
        stats.sinFecha++;
        break;
    }
  });

  return stats;
};

/**
 * Agrupa documentos por entidad
 */
export const groupDocumentsByEntity = (documentos: DocumentoGenerico[]) => {
  return documentos.reduce(
    (acc, doc) => {
      const entidadId = doc.entidadId || 'sin-entidad';
      if (!acc[entidadId]) {
        acc[entidadId] = {
          entidadId,
          entidadNombre: doc.entidadNombre || 'Sin nombre',
          entidadTipo: doc.entidadTipo || 'vehiculo',
          documentos: [],
        };
      }
      acc[entidadId].documentos.push(doc);
      return acc;
    },
    {} as Record<
      string,
      {
        entidadId: string;
        entidadNombre: string;
        entidadTipo: string;
        documentos: DocumentoGenerico[];
      }
    >
  );
};
