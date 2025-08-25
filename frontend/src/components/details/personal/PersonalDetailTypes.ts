import type { Personal, Empresa } from '../../../types';

export interface DireccionData {
  calle?: string;
  numero?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

export interface DatosLaboralesData {
  categoria?: string;
  obraSocial?: string;
  art?: string;
}

export interface PeriodoEmpleo {
  fechaIngreso: Date | string;
  fechaEgreso?: Date | string;
  categoria?: string;
  motivo?: string;
}

export interface PersonalDetailProps {
  personal: Personal;
  onEdit?: (personal: Personal) => void;
  showEditButton?: boolean;
}

export interface PersonalCardProps {
  personal: Personal;
}

export interface PersonalHeaderCardProps {
  personal: Personal;
  empresa: Empresa | null;
  onEdit?: (personal: Personal) => void;
  showEditButton: boolean;
  isEmployed: boolean;
}

export interface PersonalInfoCardProps {
  personal: Personal;
  empresa: Empresa | null;
  age: number | null;
}
