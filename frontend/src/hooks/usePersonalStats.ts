import { useMemo } from 'react';
import { Personal } from '../types';

interface PersonalStats {
  activos: number;
  inactivos: number;
  conductores: number;
  documentosVenciendo: number;
}

const isDocumentExpiring = (vencimiento: Date | string | undefined, daysFromNow = 30): boolean => {
  if (!vencimiento) return false;

  const now = new Date();
  const limitDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
  const venc = new Date(vencimiento);

  return venc <= limitDate;
};

const hasExpiringDocuments = (personal: Personal): boolean => {
  if (personal.tipo !== 'Conductor' || !personal.documentacion) {
    return false;
  }

  const documents = [
    personal.documentacion.licenciaConducir?.vencimiento,
    personal.documentacion.carnetProfesional?.vencimiento,
    personal.documentacion.evaluacionMedica?.vencimiento,
    personal.documentacion.psicofisico?.vencimiento,
  ];

  return documents.some((vencimiento) => isDocumentExpiring(vencimiento));
};

export const usePersonalStats = (personal: Personal[]): PersonalStats => {
  return useMemo(() => {
    const activos = personal.filter((p) => p.activo).length;
    const inactivos = personal.filter((p) => !p.activo).length;
    const conductores = personal.filter((p) => p.tipo === 'Conductor').length;
    const documentosVenciendo = personal.filter(hasExpiringDocuments).length;

    return { activos, inactivos, conductores, documentosVenciendo };
  }, [personal]);
};
