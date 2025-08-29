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
      label: 'Sin fecha de vencimiento' 
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
      diasRestantes: diasRestantes
    };
  } else if (diasRestantes <= 30) {
    return {
      status: 'por-vencer',
      color: COLORS.ORANGE,
      label: `Vence en ${diasRestantes} días`,
      diasRestantes: diasRestantes
    };
  } else {
    return {
      status: 'vigente',
      color: COLORS.GREEN,
      label: `Vigente (${diasRestantes} días)`,
      diasRestantes: diasRestantes
    };
  }
};

/**
 * Filtra documentos basado en criterios de búsqueda
 */
export const filterDocuments = (
  documentos: DocumentoGenerico[],
  searchTerm: string,
  filterTipo: string,
  filterEstado: string,
  filterEntidad: string
): DocumentoGenerico[] => {
  return documentos.filter((doc) => {
    // Filtro por búsqueda
    const matchesSearch = !searchTerm || 
      doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.entidadNombre?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por tipo
    const matchesTipo = filterTipo === 'todos' || doc.tipo === filterTipo;

    // Filtro por estado
    const status = getDocumentStatus(doc.fechaVencimiento);
    const matchesEstado = filterEstado === 'todos' || status.status === filterEstado;

    // Filtro por entidad
    const matchesEntidad = filterEntidad === 'todos' || doc.entidadId === filterEntidad;

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
    sinFecha: 0
  };

  documentos.forEach(doc => {
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
  return documentos.reduce((acc, doc) => {
    const entidadId = doc.entidadId || 'sin-entidad';
    if (!acc[entidadId]) {
      acc[entidadId] = {
        entidadId,
        entidadNombre: doc.entidadNombre || 'Sin nombre',
        entidadTipo: doc.entidadTipo || 'vehiculo',
        documentos: []
      };
    }
    acc[entidadId].documentos.push(doc);
    return acc;
  }, {} as Record<string, {
    entidadId: string;
    entidadNombre: string;
    entidadTipo: string;
    documentos: DocumentoGenerico[];
  }>);
};