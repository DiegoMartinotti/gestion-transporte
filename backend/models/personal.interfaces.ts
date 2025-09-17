export interface IDireccion {
  calle?: string;
  numero?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

export interface IContacto {
  telefono?: string;
  telefonoEmergencia?: string;
  email?: string;
}

export interface IPeriodoEmpleo {
  fechaIngreso: Date;
  fechaEgreso?: Date;
  motivo?: string;
  categoria?: string;
}

export interface ILicenciaConducir {
  numero?: string;
  categoria?: string;
  vencimiento?: Date;
}

export interface ICarnetProfesional {
  numero?: string;
  vencimiento?: Date;
}

export interface IEvaluacion {
  fecha?: Date;
  vencimiento?: Date;
  resultado?: string;
}

export interface IDocumentacion {
  licenciaConducir?: ILicenciaConducir;
  carnetProfesional?: ICarnetProfesional;
  evaluacionMedica?: IEvaluacion;
  psicofisico?: IEvaluacion;
}

export interface IDatosLaborales {
  categoria?: string;
  obraSocial?: string;
  art?: string;
}

export interface ICapacitacion {
  nombre?: string;
  fecha?: Date;
  vencimiento?: Date;
  institucion?: string;
  certificado?: string;
}

export interface IIncidente {
  fecha?: Date;
  tipo?: 'Accidente' | 'Infracción' | 'Otro';
  descripcion?: string;
  consecuencias?: string;
}

export interface IVencimiento {
  tipo: string;
  vencimiento: Date;
}
