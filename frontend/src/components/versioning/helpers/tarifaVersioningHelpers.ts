export interface TarifaVersion {
  _id: string;
  version: number;
  fechaVigenciaInicio: string;
  fechaVigenciaFin?: string;
  tipoCalculo: string;
  tarifasPorTipo: {
    semi: number;
    acoplado: number;
  };
  activa: boolean;
}

export interface VersionStatus {
  label: string;
  color: string;
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getVersionStatus = (version: TarifaVersion): VersionStatus => {
  const now = new Date();
  const inicio = new Date(version.fechaVigenciaInicio);
  const fin = version.fechaVigenciaFin ? new Date(version.fechaVigenciaFin) : null;

  if (!version.activa) {
    return { label: 'Inactiva', color: 'gray' };
  }

  if (now < inicio) {
    return { label: 'Futura', color: 'blue' };
  }

  if (fin && now > fin) {
    return { label: 'Vencida', color: 'red' };
  }

  return { label: 'Vigente', color: 'green' };
};

export const getActiveVersionIndex = (versions: TarifaVersion[]): number => {
  return versions.findIndex((v) => getVersionStatus(v).label === 'Vigente');
};

export const sortVersionsByDate = (versions: TarifaVersion[]): TarifaVersion[] => {
  return [...versions].sort(
    (a, b) => new Date(b.fechaVigenciaInicio).getTime() - new Date(a.fechaVigenciaInicio).getTime()
  );
};
