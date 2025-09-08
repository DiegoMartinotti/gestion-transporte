import { useMemo } from 'react';
import type { DocumentoInfo } from './useDocumentosData';

export interface DocumentStats {
  total: number;
  expired: number;
  expiring: number;
  valid: number;
}

export const useDocumentStats = (documentos: DocumentoInfo[]): DocumentStats => {
  return useMemo(() => {
    const total = documentos.length;
    const expired = documentos.filter((d) => d.status === 'expired').length;
    const expiring = documentos.filter((d) => d.status === 'expiring').length;
    const valid = documentos.filter((d) => d.status === 'valid').length;

    return { total, expired, expiring, valid };
  }, [documentos]);
};
