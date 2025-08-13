import type { Personal } from '../../../types';

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

/**
 * Calcula el estado de un documento basado en los días hasta el vencimiento
 */
export const getDocumentStatus = (
  daysUntilExpiry: number
): 'expired' | 'expiring' | 'valid' | 'missing' => {
  if (daysUntilExpiry === Infinity) return 'missing';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'valid';
};

/**
 * Calcula los días hasta el vencimiento de un documento
 */
export const calculateDaysUntilExpiry = (vencimiento: Date | string | undefined): number => {
  if (!vencimiento) return Infinity;
  const now = new Date();
  const vencimientoDate = new Date(vencimiento);
  return Math.ceil((vencimientoDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Obtiene el color correspondiente al estado del documento
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'expired':
      return 'red';
    case 'expiring':
      return 'yellow';
    case 'valid':
      return 'green';
    default:
      return 'gray';
  }
};

/**
 * Obtiene la etiqueta correspondiente al estado del documento
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'expired':
      return 'Vencido';
    case 'expiring':
      return 'Por Vencer';
    case 'valid':
      return 'Vigente';
    default:
      return 'Sin Datos';
  }
};

/**
 * Formatea una fecha para mostrar
 */
export const formatDocumentDate = (date: Date | undefined): string => {
  if (!date) return '-';
  return date.toLocaleDateString('es-AR');
};

/**
 * Obtiene el texto descriptivo de días hasta vencimiento
 */
export const getDaysUntilText = (days: number, status: string): string => {
  if (status === 'expired') return `Vencido hace ${Math.abs(days)} días`;
  if (status === 'expiring') return `Vence en ${days} días`;
  if (status === 'valid') return `Vigente (${days} días)`;
  return '-';
};

interface CreateDocumentInfoOptions {
  tipoDocumento: string;
  numero?: string;
  categoria?: string;
  fechaEmision?: Date | string;
  fechaVencimiento?: Date | string;
  resultado?: string;
}

/**
 * Crea un documento info a partir de los datos del personal
 */
export const createDocumentInfo = (
  person: Personal,
  options: CreateDocumentInfoOptions
): DocumentoInfo => {
  const empresaInfo = typeof person.empresa === 'object' ? person.empresa : null;
  const daysUntilExpiry = calculateDaysUntilExpiry(options.fechaVencimiento);

  return {
    personalId: person._id,
    personalNombre: `${person.nombre} ${person.apellido}`,
    dni: person.dni,
    empresa: empresaInfo?.nombre || 'Sin empresa',
    tipo: person.tipo,
    tipoDocumento: options.tipoDocumento,
    numero: options.numero,
    categoria: options.categoria,
    fechaEmision: options.fechaEmision ? new Date(options.fechaEmision) : undefined,
    fechaVencimiento: options.fechaVencimiento ? new Date(options.fechaVencimiento) : undefined,
    resultado: options.resultado,
    daysUntilExpiry,
    status: getDocumentStatus(daysUntilExpiry),
  };
};

/**
 * Extrae todos los documentos del array de personal
 */
export const extractDocumentsFromPersonal = (personal: Personal[]): DocumentoInfo[] => {
  const docs: DocumentoInfo[] = [];

  personal.forEach((person) => {
    if (!person.documentacion) return;

    const { documentacion } = person;

    // Licencia de Conducir
    if (documentacion.licenciaConducir?.numero) {
      docs.push(
        createDocumentInfo(person, {
          tipoDocumento: 'Licencia de Conducir',
          numero: documentacion.licenciaConducir.numero,
          categoria: documentacion.licenciaConducir.categoria,
          fechaVencimiento: documentacion.licenciaConducir.vencimiento,
        })
      );
    }

    // Carnet Profesional
    if (documentacion.carnetProfesional?.numero) {
      docs.push(
        createDocumentInfo(person, {
          tipoDocumento: 'Carnet Profesional',
          numero: documentacion.carnetProfesional.numero,
          fechaVencimiento: documentacion.carnetProfesional.vencimiento,
        })
      );
    }

    // Evaluación Médica
    if (documentacion.evaluacionMedica?.fecha) {
      docs.push(
        createDocumentInfo(person, {
          tipoDocumento: 'Evaluación Médica',
          fechaEmision: documentacion.evaluacionMedica.fecha,
          fechaVencimiento: documentacion.evaluacionMedica.vencimiento,
          resultado: documentacion.evaluacionMedica.resultado,
        })
      );
    }

    // Psicofísico
    if (documentacion.psicofisico?.fecha) {
      docs.push(
        createDocumentInfo(person, {
          tipoDocumento: 'Psicofísico',
          fechaEmision: documentacion.psicofisico.fecha,
          fechaVencimiento: documentacion.psicofisico.vencimiento,
          resultado: documentacion.psicofisico.resultado,
        })
      );
    }
  });

  return docs;
};

/**
 * Filtra documentos según criterios dados
 */
export const filterDocuments = (
  documentos: DocumentoInfo[],
  statusFilter: string,
  tipoFilter: string,
  maxExpireDays: number
): DocumentoInfo[] => {
  return documentos.filter((doc) => {
    // Filter by status
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;

    // Filter by tipo
    if (tipoFilter !== 'all' && doc.tipo !== tipoFilter) return false;

    // Only show documents that expire within the specified days
    if (doc.daysUntilExpiry > maxExpireDays && doc.status !== 'expired') return false;

    return true;
  });
};

/**
 * Calcula estadísticas de documentos
 */
export const calculateDocumentStats = (documentos: DocumentoInfo[]) => {
  const total = documentos.length;
  const expired = documentos.filter((d) => d.status === 'expired').length;
  const expiring = documentos.filter((d) => d.status === 'expiring').length;
  const valid = documentos.filter((d) => d.status === 'valid').length;

  return { total, expired, expiring, valid };
};

/**
 * Constantes para filtros
 */
export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'expiring', label: 'Por vencer' },
  { value: 'valid', label: 'Vigentes' },
];

export const TIPO_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'Conductor', label: 'Conductor' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Mecánico', label: 'Mecánico' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Otro', label: 'Otro' },
];
