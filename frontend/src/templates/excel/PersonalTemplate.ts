import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';
import { PersonalRawData } from '../../types/excel';
import { EXCEL_SHARED_CONSTANTS } from './constants';
import ReferenceDataSheets from './ReferenceDataSheets';
import {
  validateRequiredFields,
  validateEmailFormat,
  validateDNIFormat,
  validateCUILFormat,
  validateDuplicates,
  validateInReferenceList,
  validateEnumValue,
  parseDate,
  formatDate,
  parseBooleanValue,
  combineValidationResults,
  formatRowError,
} from '../../utils/excel/validationHelpers';

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
  // Dirección
  direccionCalle?: string;
  direccionNumero?: string;
  direccionLocalidad?: string;
  direccionProvincia?: string;
  direccionCodigoPostal?: string;
  // Contacto
  telefono?: string;
  telefonoEmergencia?: string;
  email?: string;
  // Documentación
  licenciaNumero?: string;
  licenciaCategoria?: string;
  licenciaVencimiento?: Date;
  carnetProfesionalNumero?: string;
  carnetProfesionalVencimiento?: Date;
  evaluacionMedicaFecha?: Date;
  evaluacionMedicaVencimiento?: Date;
  psicofisicoFecha?: Date;
  psicofisicoVencimiento?: Date;
  // Datos laborales
  categoria?: string;
  obraSocial?: string;
  art?: string;
  activo?: boolean;
  observaciones?: string;
}

// Constantes para PersonalTemplate
const PERSONAL_CONSTANTS = {
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
  DEFAULTS: {
    FILENAME: 'plantilla_personal.xlsx',
    ACTIVE_VALUE: 'Sí',
  },
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

export class PersonalTemplate {
  /**
   * Funciones auxiliares para reducir complejidad ciclomática
   */
  private static mapRowToColumns(row: PersonalTemplateData): (string | number)[] {
    const formatValue = (value: unknown): string => String(value || '');
    const formatDateValue = (date?: Date): string => formatDate(date || null);
    const formatBoolean = (value?: boolean): string =>
      value !== undefined
        ? value
          ? EXCEL_SHARED_CONSTANTS.PERSONAL.BOOLEAN.SI
          : EXCEL_SHARED_CONSTANTS.PERSONAL.BOOLEAN.NO
        : PERSONAL_CONSTANTS.DEFAULTS.ACTIVE_VALUE;

    // Orden de columnas según HEADERS
    return [
      formatValue(row.nombre),
      formatValue(row.apellido),
      formatValue(row.dni),
      formatValue(row.cuil),
      formatValue(row.tipo),
      formatDateValue(row.fechaNacimiento),
      formatValue(row.empresaNombre),
      formatValue(row.numeroLegajo),
      formatDateValue(row.fechaIngreso),
      formatValue(row.direccionCalle),
      formatValue(row.direccionNumero),
      formatValue(row.direccionLocalidad),
      formatValue(row.direccionProvincia),
      formatValue(row.direccionCodigoPostal),
      formatValue(row.telefono),
      formatValue(row.telefonoEmergencia),
      formatValue(row.email),
      formatValue(row.licenciaNumero),
      formatValue(row.licenciaCategoria),
      formatDateValue(row.licenciaVencimiento),
      formatValue(row.carnetProfesionalNumero),
      formatDateValue(row.carnetProfesionalVencimiento),
      formatDateValue(row.evaluacionMedicaFecha),
      formatDateValue(row.evaluacionMedicaVencimiento),
      formatDateValue(row.psicofisicoFecha),
      formatDateValue(row.psicofisicoVencimiento),
      formatValue(row.categoria),
      formatValue(row.obraSocial),
      formatValue(row.art),
      formatBoolean(row.activo),
      formatValue(row.observaciones),
    ];
  }

  private static createColumnWidths() {
    // Usar Object.values para crear el array de widths automáticamente
    return Object.values(EXCEL_SHARED_CONSTANTS.PERSONAL.COLUMN_WIDTHS).map((width) => ({
      wch: width,
    }));
  }

  private static addDataValidations(
    ws: WorkSheet,
    empresas: { id: string; nombre: string }[] = []
  ) {
    const DATA_VALIDATION_KEY = '!dataValidation';
    if (!ws[DATA_VALIDATION_KEY]) ws[DATA_VALIDATION_KEY] = [];

    // Validación para Tipo
    ws[DATA_VALIDATION_KEY].push({
      sqref: 'E2:E1000',
      type: 'list',
      formula1: `"${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.CONDUCTOR},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.ADMINISTRATIVO},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.MECANICO},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.SUPERVISOR},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.OTRO}"`,
    });

    // Validación para Empresa (si se proporcionan empresas)
    if (empresas.length > 0) {
      const empresaNames = empresas.map((e) => e.nombre).join(',');
      ws[DATA_VALIDATION_KEY].push({
        sqref: 'G2:G1000',
        type: 'list',
        formula1: `"${empresaNames}"`,
      });
    }

    // Validación para Activo
    ws[DATA_VALIDATION_KEY].push({
      sqref: 'AE2:AE1000',
      type: 'list',
      formula1: `"${EXCEL_SHARED_CONSTANTS.PERSONAL.BOOLEAN.SI},${EXCEL_SHARED_CONSTANTS.PERSONAL.BOOLEAN.NO}"`,
    });
  }

  private static addWorksheets(
    wb: WorkBook,
    ws: WorkSheet,
    empresas: { id: string; nombre: string }[] = []
  ) {
    XLSX.utils.book_append_sheet(wb, ws, 'Personal');

    // Hoja de instrucciones
    const instructionsWs = this.createInstructionsSheet();
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instrucciones');

    // Hoja de referencia de empresas si se proporcionan
    if (empresas.length > 0) {
      const empresasWs = this.createEmpresasReferenceSheet(empresas);
      XLSX.utils.book_append_sheet(wb, empresasWs, 'Ref_Empresas');
    }
  }

  /**
   * Genera una plantilla Excel para carga masiva de personal
   */
  static generateTemplate(empresas: { id: string; nombre: string }[] = []): WorkBook {
    const wb = XLSX.utils.book_new();

    // Hoja principal con plantilla
    const wsData = [
      EXCEL_SHARED_CONSTANTS.PERSONAL.HEADERS,
      ...PERSONAL_CONSTANTS.SAMPLE_DATA.map((row) =>
        this.mapRowToColumns(row as PersonalTemplateData)
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configurar ancho de columnas usando constantes
    ws['!cols'] = this.createColumnWidths();

    // Agregar validaciones de datos
    this.addDataValidations(ws, empresas);

    // Agregar todas las hojas del workbook
    this.addWorksheets(wb, ws, empresas);

    return wb;
  }

  /**
   * Crea hoja de instrucciones
   */
  private static createInstructionsSheet(): WorkSheet {
    const ws = XLSX.utils.aoa_to_sheet(EXCEL_SHARED_CONSTANTS.PERSONAL.INSTRUCTIONS);
    ws['!cols'] = [{ wch: EXCEL_SHARED_CONSTANTS.COLUMN_WIDTHS.INSTRUCTIONS_WIDE }];
    return ws;
  }

  /**
   * Crea hoja de referencia de empresas
   */
  private static createEmpresasReferenceSheet(
    empresas: { id: string; nombre: string }[]
  ): WorkSheet {
    // Adaptar el tipo de empresas para ReferenceDataSheets
    const empresasCompletas = empresas.map((e) => ({
      ...e,
      tipo: 'Propia' as const,
      activa: true,
    }));
    return ReferenceDataSheets.createEmpresasReferenceSheet(empresasCompletas);
  }

  /**
   * Valida datos de personal desde Excel
   */
  static validateData(
    data: unknown[],
    empresas: { id: string; nombre: string }[] = []
  ): { valid: PersonalTemplateData[]; errors: string[] } {
    const valid: PersonalTemplateData[] = [];
    const errors: string[] = [];
    const dnisVistos = new Set<string>();
    const empresaMap = new Map(empresas.map((e) => [e.nombre, e.id]));

    data.forEach((row, index) => {
      const rowNum = index + 2;
      const personal = this.parsePersonalRowData(row);

      // Validación usando métodos auxiliares
      const validationResult = this.validatePersonalRow({
        personal,
        rowNum,
        dnisVistos,
        empresaMap,
        empresas,
      });

      if (validationResult.isValid && validationResult.personalData) {
        valid.push(validationResult.personalData);
      } else {
        errors.push(...validationResult.errors);
      }
    });

    return { valid, errors };
  }

  // Método auxiliar para parsear datos de fila de personal
  private static parsePersonalRowData(row: Record<string, unknown>): PersonalRawData {
    // Mapa de columnas a propiedades
    const columnMap: { [key: string]: string } = {
      'Nombre (*)': 'nombre',
      'Apellido (*)': 'apellido',
      'DNI (*)': 'dni',
      CUIL: 'cuil',
      'Tipo (*)': 'tipo',
      'Fecha Nacimiento': 'fechaNacimiento',
      'Empresa (*)': 'empresaNombre',
      'N° Legajo': 'numeroLegajo',
      'Fecha Ingreso': 'fechaIngreso',
      'Dirección - Calle': 'direccionCalle',
      'Dirección - Número': 'direccionNumero',
      'Dirección - Localidad': 'direccionLocalidad',
      'Dirección - Provincia': 'direccionProvincia',
      'Dirección - Código Postal': 'direccionCodigoPostal',
      Teléfono: 'telefono',
      'Teléfono Emergencia': 'telefonoEmergencia',
      Email: 'email',
      'Licencia - Número': 'licenciaNumero',
      'Licencia - Categoría': 'licenciaCategoria',
      'Licencia - Vencimiento': 'licenciaVencimiento',
      'Carnet Prof. - Número': 'carnetProfesionalNumero',
      'Carnet Prof. - Vencimiento': 'carnetProfesionalVencimiento',
      'Eval. Médica - Fecha': 'evaluacionMedicaFecha',
      'Eval. Médica - Vencimiento': 'evaluacionMedicaVencimiento',
      'Psicofísico - Fecha': 'psicofisicoFecha',
      'Psicofísico - Vencimiento': 'psicofisicoVencimiento',
      Categoría: 'categoria',
      'Obra Social': 'obraSocial',
      ART: 'art',
      Activo: 'activo',
      Observaciones: 'observaciones',
    };

    const parsedData: Record<string, unknown> = {};

    // Parsear todos los campos usando el mapa
    Object.entries(columnMap).forEach(([columnName, propName]) => {
      const value = row[columnName];
      if (value !== undefined && value !== null && value !== '') {
        // Tratamiento especial para DNI (solo números)
        if (propName === 'dni') {
          parsedData[propName] = value.toString().trim().replace(/\D/g, '');
        }
        // Tratamiento para fechas
        else if (
          propName.includes('fecha') ||
          propName.includes('Fecha') ||
          propName.includes('Vencimiento')
        ) {
          parsedData[propName] = value.toString().trim();
        }
        // Tratamiento para activo (booleano)
        else if (propName === 'activo') {
          parsedData[propName] = parseBooleanValue(value);
        }
        // Campos normales
        else {
          parsedData[propName] = value.toString().trim();
        }
      }
    });

    return parsedData;
  }

  // Interfaz para parámetros de validación
  private static validatePersonalRow(params: {
    personal: PersonalRawData;
    rowNum: number;
    dnisVistos: Set<string>;
    empresaMap: Map<string, string>;
    empresas: { id: string; nombre: string }[];
  }): { isValid: boolean; personalData?: PersonalTemplateData; errors: string[] } {
    const { personal, rowNum, dnisVistos, empresaMap, empresas } = params;

    // Validar campos obligatorios
    const requiredResult = this.validatePersonalRequiredFields(personal, rowNum);
    if (!requiredResult.isValid) {
      return { isValid: false, errors: requiredResult.errors };
    }

    // Validar formatos básicos
    const formatResult = this.validatePersonalFormats(personal, rowNum);
    if (!formatResult.isValid) {
      return { isValid: false, errors: formatResult.errors };
    }

    // Validar duplicados
    const duplicateResult = this.validatePersonalDuplicates(personal.dni || '', rowNum, dnisVistos);
    if (!duplicateResult.isValid) {
      return { isValid: false, errors: duplicateResult.errors };
    }

    // Validar empresa
    const empresaResult = this.validatePersonalEmpresa(
      personal.empresaNombre as string,
      rowNum,
      empresaMap,
      empresas
    );
    if (!empresaResult.isValid) {
      return { isValid: false, errors: empresaResult.errors };
    }

    // Validar campos específicos según tipo
    const specificResult = this.validatePersonalSpecificFields(personal, rowNum);
    if (!specificResult.isValid) {
      return { isValid: false, errors: specificResult.errors };
    }

    // Construir objeto personalData
    const personalData = this.buildPersonalData(personal, empresaResult.empresaId);

    return { isValid: true, personalData, errors: [] };
  }

  // Validar campos obligatorios específicos de personal
  private static validatePersonalRequiredFields(
    personal: PersonalRawData,
    rowNum: number
  ): { isValid: boolean; errors: string[] } {
    return validateRequiredFields([
      { value: personal.nombre, fieldName: 'Nombre', rowNum, required: true },
      { value: personal.apellido, fieldName: 'Apellido', rowNum, required: true },
      { value: personal.dni, fieldName: 'DNI', rowNum, required: true },
      { value: personal.tipo, fieldName: 'Tipo', rowNum, required: true },
      { value: personal.empresaNombre, fieldName: 'Empresa', rowNum, required: true },
    ]);
  }

  // Validar formatos de personal
  private static validatePersonalFormats(
    personal: PersonalRawData,
    rowNum: number
  ): { isValid: boolean; errors: string[] } {
    const validationResults = [];

    // Validar formato DNI
    if (personal.dni) {
      validationResults.push(validateDNIFormat(personal.dni, rowNum));
    }

    // Validar tipo
    const validTypes = Object.values(EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS);
    validationResults.push(validateEnumValue(personal.tipo, rowNum, validTypes, 'Tipo'));

    // Validar CUIL si se proporciona
    if (personal.cuil) {
      validationResults.push(validateCUILFormat(personal.cuil, rowNum));
    }

    // Validar email si se proporciona
    if (personal.email) {
      validationResults.push(validateEmailFormat(personal.email, rowNum));
    }

    return combineValidationResults(...validationResults);
  }

  // Validar duplicados de DNI
  private static validatePersonalDuplicates(
    dni: string,
    rowNum: number,
    dnisVistos: Set<string>
  ): { isValid: boolean; errors: string[] } {
    return validateDuplicates(dni, rowNum, dnisVistos, 'DNI');
  }

  // Validar empresa
  private static validatePersonalEmpresa(
    empresaNombre: string,
    rowNum: number,
    empresaMap: Map<string, string>,
    _empresas: { id: string; nombre: string }[]
  ): { isValid: boolean; errors: string[]; empresaId?: string } {
    const result = validateInReferenceList(empresaNombre, rowNum, empresaMap, 'Empresa');

    return {
      isValid: result.isValid,
      errors: result.errors,
      empresaId: result.referenceId,
    };
  }

  // Validar campos específicos según tipo de personal
  private static validatePersonalSpecificFields(
    personal: PersonalRawData,
    rowNum: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones específicas por tipo usando un mapa
    const typeValidations: { [key: string]: () => void } = {
      [EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.CONDUCTOR]: () => {
        if (!personal.licenciaNumero) {
          errors.push(formatRowError(rowNum, 'Licencia obligatoria para conductores'));
        }
      },
    };

    // Ejecutar validación específica si existe
    const validation = typeValidations[personal.tipo];
    if (validation) {
      validation();
    }

    return { isValid: errors.length === 0, errors };
  }

  // Construir objeto PersonalTemplateData
  private static buildPersonalData(
    personal: PersonalRawData,
    empresaId?: string
  ): PersonalTemplateData {
    // Campos básicos obligatorios
    const baseData: PersonalTemplateData = {
      nombre: personal.nombre,
      apellido: personal.apellido,
      dni: personal.dni,
      tipo: personal.tipo as any,
      empresaId,
      empresaNombre: personal.empresaNombre,
    };

    // Agregar campos opcionales de texto
    const textFields = [
      'cuil',
      'email',
      'licenciaNumero',
      'licenciaCategoria',
      'carnetProfesionalNumero',
      'numeroLegajo',
      'direccionCalle',
      'direccionNumero',
      'direccionLocalidad',
      'direccionProvincia',
      'direccionCodigoPostal',
      'telefono',
      'telefonoEmergencia',
      'categoria',
      'obraSocial',
      'art',
      'observaciones',
    ];

    textFields.forEach((field) => {
      if (personal[field]) {
        (baseData as Record<string, string>)[field] = personal[field] as string;
      }
    });

    // Agregar campos de fecha
    const dateFields = [
      'fechaNacimiento',
      'fechaIngreso',
      'licenciaVencimiento',
      'carnetProfesionalVencimiento',
      'evaluacionMedicaFecha',
      'evaluacionMedicaVencimiento',
      'psicofisicoFecha',
      'psicofisicoVencimiento',
    ];

    dateFields.forEach((field) => {
      if (personal[field]) {
        (baseData as Record<string, unknown>)[field] = parseDate(personal[field]);
      }
    });

    // Campo booleano
    if (personal.activo !== undefined) {
      baseData.activo = parseBooleanValue(personal.activo);
    }

    return baseData;
  }

  // Métodos auxiliares para reducción de complejidad

  /**
   * Genera archivo Excel para descarga
   */
  static downloadTemplate(
    empresas: { id: string; nombre: string }[] = [],
    filename = PERSONAL_CONSTANTS.DEFAULTS.FILENAME
  ): void {
    const wb = this.generateTemplate(empresas);
    XLSX.writeFile(wb, filename);
  }
}

export default PersonalTemplate;
