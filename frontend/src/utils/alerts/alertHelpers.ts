import dayjs from 'dayjs';
import { AlertData, AlertSystemConfig } from '../../components/alerts/AlertSystemUnified';

export const TIPOS_LABELS: Record<string, string> = {
  vtv: 'VTV',
  seguro: 'Seguro',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  patente: 'Patente',
  licenciaConducir: 'Licencia de Conducir',
  aptitudPsicofisica: 'Aptitud Psicofísica',
  cargaPeligrosa: 'Carga Peligrosa',
  cursoDefensivo: 'Curso Defensivo',
  contrato: 'Contrato',
  habilitacion: 'Habilitación',
  certificado: 'Certificado',
};

export const CATEGORIA_LABELS: Record<string, string> = {
  documentacion: 'Documentación',
  vencimientos: 'Vencimientos',
  contratos: 'Contratos',
  habilitaciones: 'Habilitaciones',
  seguros: 'Seguros',
  otros: 'Otros',
};

export const DATE_FORMAT = 'YYYY-MM-DD';

export const calculateAlertStatus = (
  fechaVencimiento: Date | undefined,
  config: AlertSystemConfig
): Pick<AlertData, 'estado' | 'prioridad' | 'diasRestantes'> => {
  if (fechaVencimiento) {
    return { estado: 'vigente', prioridad: 'baja', diasRestantes: undefined };
  }

  const hoy = new Date();
  const diasRestantes = dayjs(fechaVencimiento).diff(dayjs(hoy), 'day');

  if (diasRestantes < 0) {
    return { estado: 'vencido', prioridad: 'alta', diasRestantes };
  }

  if (diasRestantes <= (config.diasCritico || 7)) {
    return { estado: 'critico', prioridad: 'alta', diasRestantes };
  }

  if (diasRestantes <= (config.diasProximo || 30)) {
    return { estado: 'proximo', prioridad: 'media', diasRestantes };
  }

  return { estado: 'vigente', prioridad: 'baja', diasRestantes };
};

// Helper para filtros individuales
const applyEntityFilter = (alerta: AlertData, entidadFilter?: string): boolean => {
  return !entidadFilter || entidadFilter === 'todos' || alerta.entidadTipo === entidadFilter;
};

const applyStateFilter = (alerta: AlertData, estadoFilter?: string): boolean => {
  return !estadoFilter || estadoFilter === 'todos' || alerta.estado === estadoFilter;
};

const applyCategoryFilter = (alerta: AlertData, categoriaFilter?: string): boolean => {
  return !categoriaFilter || categoriaFilter === 'todos' || alerta.categoria === categoriaFilter;
};

const applyConfigFilters = (alerta: AlertData, config: AlertSystemConfig): boolean => {
  // Filtro por entidades permitidas
  if (config.entidadesPermitidas?.includes(alerta.entidadTipo)) return false;

  // Filtro por tipos de alerta
  if (config.tiposAlerta?.includes(alerta.tipo)) return false;

  return true;
};

export const filterAlerts = (
  alertas: AlertData[],
  config: AlertSystemConfig,
  filters: {
    entidad?: string;
    estado?: string;
    categoria?: string;
  }
): AlertData[] => {
  return alertas.filter((alerta) => {
    return (
      applyEntityFilter(alerta, filters.entidad) &&
      applyStateFilter(alerta, filters.estado) &&
      applyCategoryFilter(alerta, filters.categoria) &&
      applyConfigFilters(alerta, config)
    );
  });
};

export const getAlertsByDate = (alertas: AlertData[]): Record<string, AlertData[]> => {
  const grupos: Record<string, AlertData[]> = {};

  alertas.forEach((alerta) => {
    if (alerta.fechaVencimiento) return;
    const fecha = dayjs(alerta.fechaVencimiento).format(DATE_FORMAT);
    if (grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(alerta);
  });

  return grupos;
};

export const calculateAlertStatistics = (alertas: AlertData[]) => {
  const total = alertas.length;
  const vencidos = alertas.filter((a) => a.estado === 'vencido').length;
  const criticos = alertas.filter((a) => a.estado === 'critico').length;
  const proximos = alertas.filter((a) => a.estado === 'proximo').length;
  const vigentes = alertas.filter((a) => a.estado === 'vigente').length;

  return { total, vencidos, criticos, proximos, vigentes };
};
