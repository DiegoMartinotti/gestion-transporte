export interface PersonalTemplateData {
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string;
  tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  fechaNacimiento?: Date;
  empresaId?: string;
  empresaNombre?: string;
  numeroLegajo?: string;
  fechaIngreso?: Date;
  direccionCalle?: string;
  direccionNumero?: string;
  direccionLocalidad?: string;
  direccionProvincia?: string;
  direccionCodigoPostal?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  email?: string;
  licenciaNumero?: string;
  licenciaCategoria?: string;
  licenciaVencimiento?: Date;
  carnetProfesionalNumero?: string;
  carnetProfesionalVencimiento?: Date;
  evaluacionMedicaFecha?: Date;
  evaluacionMedicaVencimiento?: Date;
  psicofisicoFecha?: Date;
  psicofisicoVencimiento?: Date;
  categoria?: string;
  obraSocial?: string;
  art?: string;
  activo?: boolean;
  observaciones?: string;
}

export const PERSONAL_CONSTANTS = {
  VALIDATION: {
    DNI_REGEX: /^[0-9]{7,8}$/,
    CUIL_REGEX: /^[0-9]{2}-[0-9]{8}-[0-9]$/,
    EMAIL_REGEX: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  },
  MESSAGES: {
    REQUIRED_NAME: 'El nombre es obligatorio',
    REQUIRED_LASTNAME: 'El apellido es obligatorio',
    REQUIRED_DNI: 'El DNI es obligatorio',
    REQUIRED_TYPE: 'El tipo es obligatorio',
    REQUIRED_EMPRESA: 'La empresa es obligatoria',
    INVALID_DNI: 'DNI con formato inválido',
    DUPLICATE_DNI: 'DNI duplicado en el archivo',
    INVALID_TYPE: 'Tipo inválido',
    EMPRESA_NOT_FOUND: 'Empresa no encontrada',
    INVALID_CUIL: 'CUIL con formato inválido',
    INVALID_EMAIL: 'Email con formato inválido',
    REQUIRED_LICENSE: 'Licencia obligatoria para conductores',
  },
  ERROR_PREFIX: 'Fila',
  DEFAULTS: { FILENAME: 'plantilla_personal.xlsx', ACTIVE_VALUE: 'Sí' },
  SAMPLE_DATA: [
    {
      nombre: 'Juan Carlos',
      apellido: 'Pérez',
      dni: '12345678',
      cuil: '20-12345678-9',
      tipo: 'Conductor',
      fechaNacimiento: new Date('1985-03-15'),
      empresaNombre: 'Transportes del Norte',
      numeroLegajo: '0001',
      fechaIngreso: new Date('2020-01-15'),
      direccionCalle: 'San Martín',
      direccionNumero: '1234',
      direccionLocalidad: 'Buenos Aires',
      direccionProvincia: 'Buenos Aires',
      direccionCodigoPostal: '1000',
      telefono: '+54 11 1234-5678',
      telefonoEmergencia: '+54 11 8765-4321',
      email: 'jperez@email.com',
      licenciaNumero: 'BA123456789',
      licenciaCategoria: 'D1',
      licenciaVencimiento: new Date('2025-12-31'),
      carnetProfesionalNumero: 'CP123456',
      carnetProfesionalVencimiento: new Date('2024-06-30'),
      evaluacionMedicaFecha: new Date('2023-01-15'),
      evaluacionMedicaVencimiento: new Date('2024-01-15'),
      psicofisicoFecha: new Date('2023-01-20'),
      psicofisicoVencimiento: new Date('2024-01-20'),
      categoria: 'Chofer',
      obraSocial: 'OSDE',
      art: 'La Caja ART',
      activo: true,
      observaciones: 'Conductor experimentado',
    },
    {
      nombre: 'María',
      apellido: 'González',
      dni: '87654321',
      cuil: '27-87654321-4',
      tipo: 'Administrativo' as const,
      fechaNacimiento: new Date('1990-08-22'),
      empresaNombre: 'Transportes del Norte',
      numeroLegajo: '0002',
      fechaIngreso: new Date('2021-03-01'),
      direccionCalle: 'Rivadavia',
      direccionNumero: '567',
      direccionLocalidad: 'CABA',
      direccionProvincia: 'Ciudad Autónoma de Buenos Aires',
      direccionCodigoPostal: '1002',
      telefono: '+54 11 2345-6789',
      email: 'mgonzalez@email.com',
      categoria: 'Administrativa',
      obraSocial: 'Swiss Medical',
      art: 'Galeno ART',
      activo: true,
      observaciones: 'Encargada de facturación',
    },
  ] as Partial<PersonalTemplateData>[],
};
