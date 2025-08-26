import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';
import { PersonalRawData } from '../../types/excel';
import { EXCEL_SHARED_CONSTANTS } from './constants';
import ReferenceDataSheets from './ReferenceDataSheets';
import { PERSONAL_CONSTANTS, PersonalTemplateData } from './PersonalTemplateConstants';
import { PersonalTemplateValidators } from './PersonalTemplateValidators';
import { parseDate, formatDate, parseBooleanValue } from '../../utils/excel/validationHelpers';

export type { PersonalTemplateData } from './PersonalTemplateConstants';

export class PersonalTemplate {
  private static mapRowToColumns(row: PersonalTemplateData): (string | number)[] {
    const formatValue = (value: unknown): string => String(value || '');
    const formatDateValue = (date?: Date): string => formatDate(date || null);
    const formatBoolean = (value?: boolean): string =>
      value !== undefined
        ? value
          ? EXCEL_SHARED_CONSTANTS.PERSONAL.BOOLEAN.SI
          : EXCEL_SHARED_CONSTANTS.PERSONAL.BOOLEAN.NO
        : PERSONAL_CONSTANTS.DEFAULTS.ACTIVE_VALUE;
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
    ws[DATA_VALIDATION_KEY].push({
      sqref: 'E2:E1000',
      type: 'list',
      formula1: `"${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.CONDUCTOR},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.ADMINISTRATIVO},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.MECANICO},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.SUPERVISOR},${EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.OTRO}"`,
    });
    if (empresas.length > 0) {
      const empresaNames = empresas.map((e) => e.nombre).join(',');
      ws[DATA_VALIDATION_KEY].push({
        sqref: 'G2:G1000',
        type: 'list',
        formula1: `"${empresaNames}"`,
      });
    }
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
    const instructionsWs = this.createInstructionsSheet();
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instrucciones');
    if (empresas.length > 0) {
      const empresasWs = this.createEmpresasReferenceSheet(empresas);
      XLSX.utils.book_append_sheet(wb, empresasWs, 'Ref_Empresas');
    }
  }
  static generateTemplate(empresas: { id: string; nombre: string }[] = []): WorkBook {
    const wb = XLSX.utils.book_new();
    const wsData = [
      EXCEL_SHARED_CONSTANTS.PERSONAL.HEADERS,
      ...PERSONAL_CONSTANTS.SAMPLE_DATA.map((row) =>
        this.mapRowToColumns(row as PersonalTemplateData)
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = this.createColumnWidths();
    this.addDataValidations(ws, empresas);
    this.addWorksheets(wb, ws, empresas);
    return wb;
  }
  private static createInstructionsSheet(): WorkSheet {
    const ws = XLSX.utils.aoa_to_sheet(EXCEL_SHARED_CONSTANTS.PERSONAL.INSTRUCTIONS);
    ws['!cols'] = [{ wch: EXCEL_SHARED_CONSTANTS.COLUMN_WIDTHS.INSTRUCTIONS_WIDE }];
    return ws;
  }

  private static createEmpresasReferenceSheet(
    empresas: { id: string; nombre: string }[]
  ): WorkSheet {
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
      const personal = this.parsePersonalRowData(row as Record<string, unknown>);

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

  private static parsePersonalRowData(row: Record<string, unknown>): PersonalRawData {
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
        if (propName === 'dni') {
          parsedData[propName] = value.toString().trim().replace(/\D/g, '');
        } else if (
          propName.includes('fecha') ||
          propName.includes('Fecha') ||
          propName.includes('Vencimiento')
        ) {
          parsedData[propName] = value.toString().trim();
        } else if (propName === 'activo') {
          parsedData[propName] = parseBooleanValue(value as string | number | boolean);
        } else {
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

    return PersonalTemplateValidators.validatePersonalRow({
      personal,
      rowNum,
      dnisVistos,
      empresaMap,
      empresas,
      buildPersonalData: (personal: PersonalRawData, empresaId?: string) =>
        this.buildPersonalData(personal, empresaId),
    });
  }

  // Validar campos obligatorios específicos de personal

  // Validar duplicados de DNI

  // Validar empresa

  private static buildPersonalData(
    personal: PersonalRawData,
    empresaId?: string
  ): PersonalTemplateData {
    const baseData: PersonalTemplateData = {
      nombre: personal.nombre || '',
      apellido: personal.apellido || '',
      dni: personal.dni || '',
      tipo: personal.tipo as 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro',
      empresaId,
      empresaNombre: personal.empresaNombre as string | undefined,
    };
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
        (baseData as unknown as Record<string, unknown>)[field] = personal[field] as string;
      }
    });
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
        (baseData as unknown as Record<string, unknown>)[field] = parseDate(
          personal[field] as string | Date
        );
      }
    });
    if (personal.activo !== undefined) {
      baseData.activo = parseBooleanValue(personal.activo);
    }
    return baseData;
  }
  static downloadTemplate(
    empresas: { id: string; nombre: string }[] = [],
    filename = PERSONAL_CONSTANTS.DEFAULTS.FILENAME
  ): void {
    const wb = this.generateTemplate(empresas);
    XLSX.writeFile(wb, filename);
  }
}
export default PersonalTemplate;
