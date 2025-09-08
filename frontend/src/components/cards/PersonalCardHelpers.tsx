import type { Personal } from '../../types';
import type { DocumentInfo, DocumentStatus } from './PersonalCardTypes';

// Helper para calcular edad
export function calculateAge(fechaNacimiento?: string): number | null {
  if (!fechaNacimiento) return null;
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper para calcular días hasta vencimiento
export const calculateDaysUntilExpiry = (fecha: string): number =>
  Math.ceil((new Date(fecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

// Helper para convertir Date a string
export const convertDateToString = (date: Date | undefined): string | undefined => {
  return date ? date.toISOString() : undefined;
};

// Helper para obtener estado de documentos
export function getDocumentStatus(personal: Personal): DocumentStatus {
  const documents: DocumentInfo[] = [];

  const addDocument = (vencimiento: string | undefined, name: string) => {
    if (vencimiento) {
      const days = calculateDaysUntilExpiry(vencimiento);
      documents.push({ name, days, expired: days < 0, expiring: days >= 0 && days <= 30 });
    }
  };

  addDocument(
    convertDateToString(personal.documentacion?.licenciaConducir?.vencimiento),
    'Licencia'
  );
  addDocument(
    convertDateToString(personal.documentacion?.carnetProfesional?.vencimiento),
    'Carnet Prof.'
  );
  addDocument(
    convertDateToString(personal.documentacion?.evaluacionMedica?.vencimiento),
    'Eval. Médica'
  );
  addDocument(convertDateToString(personal.documentacion?.psicofisico?.vencimiento), 'Psicofísico');

  const expired = documents.filter((d) => d.expired).length;
  const expiring = documents.filter((d) => d.expiring).length;
  const total = documents.length;
  const valid = total - expired - expiring;

  return { expired, expiring, valid, total, documents };
}

// Helper para obtener color de estado
export function getStatusColor(personal: Personal, documentStatus: DocumentStatus): string {
  if (!personal.activo) return 'gray';
  if (documentStatus.expired > 0) return 'red';
  if (documentStatus.expiring > 0) return 'yellow';
  return 'green';
}

// Helper para obtener color del tipo
export function getTipoColor(tipo: string): string {
  switch (tipo) {
    case 'Conductor':
      return 'blue';
    case 'Administrativo':
      return 'green';
    case 'Mecánico':
      return 'orange';
    case 'Supervisor':
      return 'purple';
    default:
      return 'gray';
  }
}

// Helper para verificar si está empleado actualmente
export function isCurrentlyEmployed(personal: Personal): boolean {
  if (!personal.periodosEmpleo || personal.periodosEmpleo.length === 0) return false;
  const lastPeriod = personal.periodosEmpleo[personal.periodosEmpleo.length - 1];
  return !lastPeriod.fechaEgreso;
}
