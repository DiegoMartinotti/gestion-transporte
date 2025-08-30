import dayjs from 'dayjs';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';

// Constantes para strings duplicados
export const ENTITY_TYPE_VEHICULO = 'vehiculo';
export const ENTITY_TYPE_PERSONAL = 'personal';
export const DATE_FORMAT_ISO = 'YYYY-MM-DD';
export const DATE_FORMAT_DISPLAY = 'DD/MM/YYYY';

export const DEFAULT_CONFIG: ExpirationConfig = {
  diasCritico: 7,
  diasProximo: 30,
  diasVigente: 90,
  notificacionesActivas: true,
  frecuenciaNotificaciones: 'diaria',
  entidadesPermitidas: [ENTITY_TYPE_VEHICULO, ENTITY_TYPE_PERSONAL],
  mostrarCalendario: true,
  mostrarAlertas: true,
  mostrarEstadisticas: true,
  mostrarTimeline: true,
  colores: {
    vencido: 'red',
    critico: 'red',
    proximo: 'orange',
    vigente: 'green',
  },
};

export const TIPOS_DOCUMENTO_LABELS: Record<string, string> = {
  vtv: 'VTV',
  seguro: 'Seguro',
  ruta: 'RUTA',
  senasa: 'SENASA',
  licenciaConducir: 'Licencia de Conducir',
  aptitudPsicofisica: 'Aptitud Psicofísica',
  cargaPeligrosa: 'Carga Peligrosa',
  cursoDefensivo: 'Curso Defensivo',
};

export const calculateDocumentState = (
  fechaVencimiento: Date,
  config: ExpirationConfig
): DocumentoVencimiento['estado'] => {
  const hoy = new Date();
  const diasRestantes = dayjs(fechaVencimiento).diff(dayjs(hoy), 'day');

  if (diasRestantes < 0) {
    return 'vencido';
  } else if (diasRestantes <= (config.diasCritico || DEFAULT_CONFIG.diasCritico || 7)) {
    return 'critico';
  } else if (diasRestantes <= (config.diasProximo || DEFAULT_CONFIG.diasProximo || 30)) {
    return 'proximo';
  } else {
    return 'vigente';
  }
};

export const calculateDocumentsWithState = (
  documentos: DocumentoVencimiento[],
  config: ExpirationConfig
): DocumentoVencimiento[] => {
  const hoy = new Date();

  return documentos.map((doc) => {
    const diasRestantes = dayjs(doc.fechaVencimiento).diff(dayjs(hoy), 'day');
    const estado = calculateDocumentState(doc.fechaVencimiento, config);

    return {
      ...doc,
      diasRestantes,
      estado,
    };
  });
};

export const filterDocuments = (
  documentosConEstado: DocumentoVencimiento[],
  filtroEntidad: string,
  filtroEstado: string,
  config: ExpirationConfig
): DocumentoVencimiento[] => {
  return documentosConEstado.filter((doc) => {
    // Filtro por entidad
    if (filtroEntidad !== 'todos' && doc.entidadTipo !== filtroEntidad) return false;

    // Filtro por estado
    if (filtroEstado !== 'todos' && doc.estado !== filtroEstado) return false;

    // Filtro por entidades permitidas
    if (config.entidadesPermitidas && !config.entidadesPermitidas.includes(doc.entidadTipo))
      return false;

    // Filtro por tipos de documento
    if (config.tiposDocumento && !config.tiposDocumento.includes(doc.tipo)) return false;

    return true;
  });
};

export const calculateStatistics = (documentosFiltrados: DocumentoVencimiento[]) => {
  const total = documentosFiltrados.length;
  const vencidos = documentosFiltrados.filter((d) => d.estado === 'vencido').length;
  const criticos = documentosFiltrados.filter((d) => d.estado === 'critico').length;
  const proximos = documentosFiltrados.filter((d) => d.estado === 'proximo').length;
  const vigentes = documentosFiltrados.filter((d) => d.estado === 'vigente').length;

  return { total, vencidos, criticos, proximos, vigentes };
};

export const groupDocumentsByDate = (
  documentosFiltrados: DocumentoVencimiento[]
): Record<string, DocumentoVencimiento[]> => {
  const grupos: Record<string, DocumentoVencimiento[]> = {};

  documentosFiltrados.forEach((doc) => {
    const fecha = dayjs(doc.fechaVencimiento).format(DATE_FORMAT_ISO);
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(doc);
  });

  return grupos;
};

export const getEstadoColor = (
  estado: DocumentoVencimiento['estado'],
  config: ExpirationConfig
): string => {
  return config.colores?.[estado || 'vigente'] || 'gray';
};
