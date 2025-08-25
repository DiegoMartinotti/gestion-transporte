import type { DireccionData, DatosLaboralesData, PeriodoEmpleo } from './PersonalDetailTypes';

export const calculateAge = (fechaNacimiento: Date | string | undefined): number | null => {
  if (!fechaNacimiento) return null;
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const getDocumentStatus = (vencimiento: Date | string | undefined) => {
  if (!vencimiento) return null;
  const now = new Date();
  const expiry = new Date(vencimiento);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0)
    return { status: 'expired', days: Math.abs(daysUntilExpiry), color: 'red' };
  if (daysUntilExpiry <= 30) return { status: 'expiring', days: daysUntilExpiry, color: 'yellow' };
  return { status: 'valid', days: daysUntilExpiry, color: 'green' };
};

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'No especificado';
  return new Date(date).toLocaleDateString('es-AR');
};

export const getTipoColor = (tipo: string): string => {
  const colors = {
    Conductor: 'blue',
    Administrativo: 'green',
    Mecánico: 'orange',
    Supervisor: 'purple',
  };
  return colors[tipo as keyof typeof colors] || 'gray';
};

export const getIncidentColor = (tipo: string): string => {
  const colors = {
    Accidente: 'red',
    Infracción: 'orange',
  };
  return colors[tipo as keyof typeof colors] || 'gray';
};

export const isCurrentlyEmployed = (periodosEmpleo: PeriodoEmpleo[]): boolean => {
  if (!periodosEmpleo || periodosEmpleo.length === 0) return false;
  const lastPeriod = periodosEmpleo[periodosEmpleo.length - 1];
  return !lastPeriod.fechaEgreso;
};

export const getStatusText = (status: { status: string; days: number } | null): string => {
  if (!status) return 'Sin vencimiento';
  if (status.status === 'expired') return `Vencida hace ${status.days} días`;
  if (status.status === 'expiring') return `Vence en ${status.days} días`;
  return 'Vigente';
};

export const hasValidAddress = (direccion: DireccionData | undefined): boolean => {
  return !!(direccion && Object.values(direccion).some((v) => v));
};

export const hasValidDatosLaborales = (datosLaborales: DatosLaboralesData | undefined): boolean => {
  return !!(datosLaborales && Object.values(datosLaborales).some((v) => v));
};

export const buildAddressString = (direccion: DireccionData): string => {
  return [
    direccion.calle,
    direccion.numero,
    direccion.localidad,
    direccion.provincia,
    direccion.codigoPostal,
  ]
    .filter(Boolean)
    .join(', ');
};
