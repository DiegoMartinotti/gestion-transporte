import { useMemo } from 'react';
import type { DocumentoInfo } from './useDocumentosData';

export const useFilteredDocumentos = (
  documentos: DocumentoInfo[],
  statusFilter: string,
  tipoFilter: string,
  maxExpireDays: number
) => {
  const filteredDocumentos = useMemo(() => {
    return documentos.filter((doc) => {
      // Filter by status
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;

      // Filter by tipo
      if (tipoFilter !== 'all' && doc.tipo !== tipoFilter) return false;

      // Only show documents that expire within the specified days
      if (doc.daysUntilExpiry > maxExpireDays && doc.status !== 'expired') return false;

      return true;
    });
  }, [documentos, statusFilter, tipoFilter, maxExpireDays]);

  return filteredDocumentos;
};
