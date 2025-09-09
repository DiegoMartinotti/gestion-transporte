import { UseFormReturnType } from '@mantine/form';

// Shared types for PersonalForm components
export interface PersonalFormData extends Record<string, unknown> {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  tipo: string;
  fechaNacimiento?: Date | null;
  direccion?: {
    calle?: string;
    numero?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
  contacto?: {
    telefono?: string;
    telefonoEmergencia?: string;
    email?: string;
  };
  empresa: string;
  numeroLegajo?: string;
  periodosEmpleo: Array<{
    fechaIngreso: Date | null;
    fechaEgreso?: Date | null;
    motivo?: string;
    categoria?: string;
  }>;
  documentacion?: {
    licenciaConducir?: {
      numero: string;
      categoria: string;
      vencimiento: Date | null;
      fecha: Date | null;
      resultado: string;
    };
    carnetProfesional?: {
      numero: string;
      categoria: string;
      vencimiento: Date | null;
      fecha: Date | null;
      resultado: string;
    };
    evaluacionMedica?: {
      numero: string;
      categoria: string;
      fecha: Date | null;
      vencimiento: Date | null;
      resultado: string;
    };
    psicofisico?: {
      numero: string;
      categoria: string;
      fecha: Date | null;
      vencimiento: Date | null;
      resultado: string;
    };
  };
  datosLaborales?: {
    categoria?: string;
    obraSocial?: string;
    art?: string;
  };
  capacitaciones?: Array<{
    nombre?: string;
    fecha?: Date | null;
    vencimiento?: Date | null;
    institucion?: string;
    certificado?: string;
  }>;
  incidentes?: Array<{
    fecha?: Date | null;
    tipo?: 'Accidente' | 'Infracción' | 'Otro';
    descripcion?: string;
    consecuencias?: string;
  }>;
  activo: boolean;
  observaciones?: string;
}

export type PersonalFormType = UseFormReturnType<PersonalFormData>;
