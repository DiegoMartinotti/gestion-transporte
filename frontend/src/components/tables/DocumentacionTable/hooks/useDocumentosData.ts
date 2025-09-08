import { useMemo } from 'react';
import type { Personal, Empresa } from '../../../../types';

export interface DocumentoInfo {
  personalId: string;
  personalNombre: string;
  dni: string;
  empresa: string;
  tipo: string;
  tipoDocumento: string;
  numero?: string;
  categoria?: string;
  fechaEmision?: Date;
  fechaVencimiento?: Date;
  resultado?: string;
  daysUntilExpiry: number;
  status: 'expired' | 'expiring' | 'valid' | 'missing';
}

const SIN_EMPRESA = 'Sin empresa';

const createBaseDocument = (person: Personal, empresaInfo: Empresa | null) => ({
  personalId: person._id,
  personalNombre: `${person.nombre} ${person.apellido}`,
  dni: person.dni,
  empresa: empresaInfo?.nombre || SIN_EMPRESA,
  tipo: person.tipo,
});

const calculateDaysUntilExpiry = (vencimiento: Date | string | undefined, now: Date) => {
  return vencimiento
    ? Math.ceil((new Date(vencimiento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
};

function getDocumentStatus(daysUntilExpiry: number): 'expired' | 'expiring' | 'valid' | 'missing' {
  if (daysUntilExpiry === Infinity) return 'missing';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'valid';
}

const procesarLicenciaConducir = (
  person: Personal,
  empresaInfo: Empresa | null,
  now: Date
): DocumentoInfo[] => {
  const docs: DocumentoInfo[] = [];
  const { documentacion } = person;

  if (documentacion?.licenciaConducir?.numero) {
    const vencimiento = documentacion.licenciaConducir.vencimiento;
    const daysUntilExpiry = calculateDaysUntilExpiry(vencimiento, now);

    docs.push({
      ...createBaseDocument(person, empresaInfo),
      tipoDocumento: 'Licencia de Conducir',
      numero: documentacion.licenciaConducir.numero,
      categoria: documentacion.licenciaConducir.categoria,
      fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
      daysUntilExpiry,
      status: getDocumentStatus(daysUntilExpiry),
    });
  }
  return docs;
};

const procesarCarnetProfesional = (
  person: Personal,
  empresaInfo: Empresa | null,
  now: Date
): DocumentoInfo[] => {
  const docs: DocumentoInfo[] = [];
  const { documentacion } = person;

  if (documentacion?.carnetProfesional?.numero) {
    const vencimiento = documentacion.carnetProfesional.vencimiento;
    const daysUntilExpiry = calculateDaysUntilExpiry(vencimiento, now);

    docs.push({
      ...createBaseDocument(person, empresaInfo),
      tipoDocumento: 'Carnet Profesional',
      numero: documentacion.carnetProfesional.numero,
      fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
      daysUntilExpiry,
      status: getDocumentStatus(daysUntilExpiry),
    });
  }
  return docs;
};

const procesarEvaluacionMedica = (
  person: Personal,
  empresaInfo: Empresa | null,
  now: Date
): DocumentoInfo[] => {
  const docs: DocumentoInfo[] = [];
  const { documentacion } = person;

  if (documentacion?.evaluacionMedica?.fecha) {
    const fecha = documentacion.evaluacionMedica.fecha;
    const vencimiento = documentacion.evaluacionMedica.vencimiento;
    const daysUntilExpiry = calculateDaysUntilExpiry(vencimiento, now);

    docs.push({
      ...createBaseDocument(person, empresaInfo),
      tipoDocumento: 'Evaluación Médica',
      fechaEmision: fecha ? new Date(fecha) : undefined,
      fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
      resultado: documentacion.evaluacionMedica.resultado,
      daysUntilExpiry,
      status: getDocumentStatus(daysUntilExpiry),
    });
  }
  return docs;
};

const procesarPsicofisico = (
  person: Personal,
  empresaInfo: Empresa | null,
  now: Date
): DocumentoInfo[] => {
  const docs: DocumentoInfo[] = [];
  const { documentacion } = person;

  if (documentacion?.psicofisico?.fecha) {
    const fecha = documentacion.psicofisico.fecha;
    const vencimiento = documentacion.psicofisico.vencimiento;
    const daysUntilExpiry = calculateDaysUntilExpiry(vencimiento, now);

    docs.push({
      ...createBaseDocument(person, empresaInfo),
      tipoDocumento: 'Psicofísico',
      fechaEmision: fecha ? new Date(fecha) : undefined,
      fechaVencimiento: vencimiento ? new Date(vencimiento) : undefined,
      resultado: documentacion.psicofisico.resultado,
      daysUntilExpiry,
      status: getDocumentStatus(daysUntilExpiry),
    });
  }
  return docs;
};

export const useDocumentosData = (personal: Personal[]) => {
  return useMemo(() => {
    const docs: DocumentoInfo[] = [];
    const now = new Date();

    personal.forEach((person) => {
      const empresaInfo = typeof person.empresa === 'object' ? person.empresa : null;

      if (person.documentacion) {
        docs.push(
          ...procesarLicenciaConducir(person, empresaInfo, now),
          ...procesarCarnetProfesional(person, empresaInfo, now),
          ...procesarEvaluacionMedica(person, empresaInfo, now),
          ...procesarPsicofisico(person, empresaInfo, now)
        );
      }
    });

    return docs;
  }, [personal]);
};
